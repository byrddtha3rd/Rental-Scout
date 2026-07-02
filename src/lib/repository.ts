import { calculateProperty } from "../calculations";
import type { Property, PropertyDraft } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface PropertyRepository {
  list(): Promise<Property[]>;
  get(id: string): Promise<Property | null>;
  create(draft: PropertyDraft): Promise<Property>;
  update(id: string, draft: PropertyDraft): Promise<Property>;
  remove(id: string): Promise<void>;
}

const STORAGE_KEY = "rental-scout-properties-v1";

function readLocal(): Property[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Property[];
  } catch {
    return [];
  }
}

function writeLocal(properties: Property[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
}

export class LocalPropertyRepository implements PropertyRepository {
  async list() {
    return readLocal().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async get(id: string) {
    return readLocal().find((property) => property.id === id) ?? null;
  }

  async create(draft: PropertyDraft) {
    const now = new Date().toISOString();
    const property: Property = {
      ...draft,
      ...calculateProperty(draft),
      id: crypto.randomUUID(),
      user_id: null,
      created_at: now,
      updated_at: now,
    };
    writeLocal([property, ...readLocal()]);
    return property;
  }

  async update(id: string, draft: PropertyDraft) {
    const properties = readLocal();
    const previous = properties.find((property) => property.id === id);
    if (!previous) throw new Error("Property not found.");
    const property: Property = {
      ...previous,
      ...draft,
      ...calculateProperty(draft),
      updated_at: new Date().toISOString(),
    };
    writeLocal(properties.map((item) => (item.id === id ? property : item)));
    return property;
  }

  async remove(id: string) {
    writeLocal(readLocal().filter((property) => property.id !== id));
  }
}

export class SupabasePropertyRepository implements PropertyRepository {
  private client = supabase!;

  private normalize(property: Record<string, unknown>): Property {
    return { ...property, visit_date: property.visit_date ?? "" } as unknown as Property;
  }

  private payload(draft: PropertyDraft) {
    return { ...draft, visit_date: draft.visit_date || null, ...calculateProperty(draft) };
  }

  async list() {
    const { data, error } = await this.client
      .from("properties")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((property) => this.normalize(property));
  }

  async get(id: string) {
    const { data, error } = await this.client
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? this.normalize(data) : null;
  }

  async create(draft: PropertyDraft) {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new Error("Please sign in before saving.");
    const { data, error } = await this.client
      .from("properties")
      .insert({ ...this.payload(draft), user_id: user.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.normalize(data);
  }

  async update(id: string, draft: PropertyDraft) {
    const { data, error } = await this.client
      .from("properties")
      .update(this.payload(draft))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.normalize(data);
  }

  async remove(id: string) {
    const { error } = await this.client.from("properties").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const repository: PropertyRepository = isSupabaseConfigured
  ? new SupabasePropertyRepository()
  : new LocalPropertyRepository();
