import { emptyDraft, type Property, type PropertyDraft } from "../types";

export const TRANSFER_FORMAT = "rental-scout-backup";
export const TRANSFER_VERSION = 1;

interface TransferEnvelope {
  format: typeof TRANSFER_FORMAT;
  version: number;
  exported_at: string;
  property_count: number;
  properties: Property[];
}

export function createBackup(properties: Property[]): string {
  const envelope: TransferEnvelope = {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exported_at: new Date().toISOString(),
    property_count: properties.length,
    properties,
  };
  return JSON.stringify(envelope, null, 2);
}

function asDraft(value: unknown, index: number): PropertyDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Property ${index + 1} is not a valid record.`);
  }
  const source = value as Record<string, unknown>;
  const defaults = emptyDraft();
  const draft = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof PropertyDraft)[]) {
    if (source[key] !== undefined && source[key] !== null) {
      (draft as Record<string, unknown>)[key] = source[key];
    }
  }

  if (
    typeof draft.nickname !== "string" ||
    typeof draft.full_address !== "string" ||
    typeof draft.city !== "string" ||
    typeof draft.state !== "string" ||
    typeof draft.zip_code !== "string" ||
    !draft.nickname.trim() ||
    !draft.full_address.trim() ||
    !draft.city.trim() ||
    !draft.state.trim() ||
    !draft.zip_code.trim()
  ) {
    throw new Error(`Property ${index + 1} is missing its nickname or address.`);
  }
  if (typeof draft.asking_price !== "number" || draft.asking_price <= 0) {
    throw new Error(`Property ${index + 1} has an invalid asking price.`);
  }
  if (!Array.isArray(draft.verification_checklist)) draft.verification_checklist = [];
  if (!Array.isArray(draft.status_history)) draft.status_history = [];
  return draft;
}

export function parseBackup(contents: string): PropertyDraft[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  let records: unknown;
  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (parsed && typeof parsed === "object") {
    const envelope = parsed as Record<string, unknown>;
    if (envelope.format && envelope.format !== TRANSFER_FORMAT) {
      throw new Error("This is not a Rental Scout backup file.");
    }
    if (
      typeof envelope.version === "number" &&
      envelope.version > TRANSFER_VERSION
    ) {
      throw new Error("This backup was created by a newer version of Rental Scout.");
    }
    records = envelope.properties;
  }

  if (!Array.isArray(records)) {
    throw new Error("No property records were found in this file.");
  }
  if (!records.length) return [];
  return records.map(asDraft);
}

export function propertyFingerprint(
  property: Pick<PropertyDraft, "full_address" | "city" | "state" | "zip_code">,
) {
  return [property.full_address, property.city, property.state, property.zip_code]
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
}
