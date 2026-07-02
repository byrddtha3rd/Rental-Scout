import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Property, PropertyDraft } from "../types";
import { repository } from "../lib/repository";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

interface AppContextValue {
  properties: Property[];
  loading: boolean;
  error: string;
  session: Session | null;
  authLoading: boolean;
  localMode: boolean;
  notice: string;
  setNotice: (message: string) => void;
  refresh: () => Promise<void>;
  createProperty: (draft: PropertyDraft) => Promise<Property>;
  updateProperty: (id: string, draft: PropertyDraft) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      setProperties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setProperties(await repository.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load properties.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AppContextValue>(
    () => ({
      properties,
      loading,
      error,
      session,
      authLoading,
      localMode: !isSupabaseConfigured,
      notice,
      setNotice,
      refresh,
      createProperty: async (draft) => {
        const property = await repository.create(draft);
        setProperties((current) => [property, ...current]);
        setNotice(isSupabaseConfigured ? "Saved to Supabase" : "Saved on this device");
        return property;
      },
      updateProperty: async (id, draft) => {
        const property = await repository.update(id, draft);
        setProperties((current) =>
          current.map((item) => (item.id === id ? property : item)),
        );
        setNotice(isSupabaseConfigured ? "Changes synced" : "Changes saved locally");
        return property;
      },
      deleteProperty: async (id) => {
        await repository.remove(id);
        setProperties((current) => current.filter((item) => item.id !== id));
        setNotice("Property deleted");
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [authLoading, error, loading, notice, properties, refresh, session],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppProvider.");
  return value;
}
