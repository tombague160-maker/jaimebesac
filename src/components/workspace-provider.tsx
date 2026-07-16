"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { createEmptyWorkspace } from "@/lib/workspace-defaults";
import type { WorkspaceData, WorkspaceKey } from "@/types";

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";

interface WorkspaceContextValue {
  data: WorkspaceData;
  isLoading: boolean;
  isReady: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  updateValue: <K extends WorkspaceKey>(key: K, action: SetStateAction<WorkspaceData[K]>) => void;
  reload: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceResponse = {
  data: WorkspaceData;
  versions: Partial<Record<WorkspaceKey, string>>;
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<WorkspaceData>(() => createEmptyWorkspace());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const dataRef = useRef(data);
  const versionsRef = useRef<Partial<Record<WorkspaceKey, string>>>({});
  const queues = useRef<Partial<Record<WorkspaceKey, Promise<void>>>>({});
  const loadedRef = useRef(false);
  const pendingWrites = useRef(0);
  const failedWrites = useRef(0);

  const applyLoaded = useCallback((next: WorkspaceResponse) => {
    dataRef.current = next.data;
    versionsRef.current = next.versions ?? {};
    loadedRef.current = true;
    failedWrites.current = 0;
    setData(next.data);
    setReady(true);
    setError(null);
    setSaveStatus("idle");
  }, []);

  const fetchWorkspace = useCallback(async () => {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger les donnees de travail.");
    return (await response.json()) as WorkspaceResponse;
  }, []);

  const reload = useCallback(async () => {
    setSaveStatus("loading");
    setError(null);
    try {
      applyLoaded(await fetchWorkspace());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement.");
      setSaveStatus("error");
    }
  }, [applyLoaded, fetchWorkspace]);

  useEffect(() => {
    // The login page renders outside the shell; never load workspace data there.
    if (pathname === "/login") return;

    let active = true;
    void fetchWorkspace()
      .then((next) => {
        if (active) applyLoaded(next);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement.");
        setSaveStatus("error");
      });

    return () => {
      active = false;
    };
  }, [applyLoaded, fetchWorkspace, pathname]);

  // Revalidate when the tab regains focus — but never while writes are in flight,
  // to avoid reverting optimistic state.
  useEffect(() => {
    if (pathname === "/login") return;
    function onFocus() {
      if (loadedRef.current && pendingWrites.current === 0) void reload();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pathname, reload]);

  const persist = useCallback(
    <K extends WorkspaceKey>(key: K, value: WorkspaceData[K]) => {
      pendingWrites.current += 1;
      setSaveStatus("saving");

      const previous = queues.current[key] ?? Promise.resolve();
      const next = previous
        .catch(() => undefined)
        .then(async () => {
          const response = await fetch(`/api/workspace/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value, version: versionsRef.current[key] }),
          });

          if (response.status === 409) {
            // Someone else changed this key: reload authoritative state and inform.
            await reload();
            throw new Error(
              "Ces donnees ont ete modifiees dans un autre onglet. La derniere version a ete rechargee.",
            );
          }
          if (!response.ok) throw new Error("La sauvegarde a echoue.");

          const payload = (await response.json().catch(() => null)) as { version?: string } | null;
          if (payload?.version) versionsRef.current[key] = payload.version;
        })
        .then(() => {
          pendingWrites.current -= 1;
          if (pendingWrites.current === 0 && failedWrites.current === 0) setSaveStatus("saved");
        })
        .catch((saveError) => {
          pendingWrites.current -= 1;
          failedWrites.current += 1;
          setError(saveError instanceof Error ? saveError.message : "Erreur de sauvegarde.");
          setSaveStatus("error");
        });

      queues.current[key] = next;
    },
    [reload],
  );

  const updateValue = useCallback(
    <K extends WorkspaceKey>(key: K, action: SetStateAction<WorkspaceData[K]>) => {
      // Guard: never write before the initial load succeeded, otherwise an empty
      // starting state would overwrite (and destroy) the persisted data.
      if (!loadedRef.current) return;

      const previousValue = dataRef.current[key];
      const nextValue =
        typeof action === "function"
          ? (action as (previous: WorkspaceData[K]) => WorkspaceData[K])(previousValue)
          : action;
      const nextData = { ...dataRef.current, [key]: nextValue };

      dataRef.current = nextData;
      setData(nextData);
      persist(key, nextValue);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      data,
      isLoading: saveStatus === "loading",
      isReady: ready,
      saveStatus,
      error,
      updateValue,
      reload,
    }),
    [data, error, ready, reload, saveStatus, updateValue],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace doit etre utilise dans WorkspaceProvider.");
  return context;
}

export function useWorkspaceValue<K extends WorkspaceKey>(
  key: K,
): [WorkspaceData[K], Dispatch<SetStateAction<WorkspaceData[K]>>] {
  const { data, updateValue } = useWorkspace();
  const setter = useCallback<Dispatch<SetStateAction<WorkspaceData[K]>>>(
    (action) => updateValue(key, action),
    [key, updateValue],
  );

  return [data[key], setter];
}
