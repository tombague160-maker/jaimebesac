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
import { createEmptyWorkspace } from "@/lib/workspace-defaults";
import type { WorkspaceData, WorkspaceKey } from "@/types";

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";

interface WorkspaceContextValue {
  data: WorkspaceData;
  isLoading: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  updateValue: <K extends WorkspaceKey>(key: K, action: SetStateAction<WorkspaceData[K]>) => void;
  reload: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(() => createEmptyWorkspace());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const queues = useRef<Partial<Record<WorkspaceKey, Promise<void>>>>({});
  const pendingWrites = useRef(0);

  const reload = useCallback(async () => {
    setSaveStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (!response.ok) throw new Error("Impossible de charger les donnees de travail.");
      const next = (await response.json()) as WorkspaceData;
      dataRef.current = next;
      setData(next);
      setSaveStatus("idle");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement.");
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    let active = true;

    void fetch("/api/workspace", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossible de charger les donnees de travail.");
        return (await response.json()) as WorkspaceData;
      })
      .then((next) => {
        if (!active) return;
        dataRef.current = next;
        setData(next);
        setSaveStatus("idle");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement.");
        setSaveStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(<K extends WorkspaceKey>(key: K, value: WorkspaceData[K]) => {
    pendingWrites.current += 1;
    setSaveStatus("saving");
    setError(null);

    const previous = queues.current[key] ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch(`/api/workspace/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
        if (!response.ok) throw new Error("La sauvegarde a echoue.");
      })
      .then(() => {
        pendingWrites.current -= 1;
        if (pendingWrites.current === 0) setSaveStatus("saved");
      })
      .catch((saveError) => {
        pendingWrites.current -= 1;
        setError(saveError instanceof Error ? saveError.message : "Erreur de sauvegarde.");
        setSaveStatus("error");
      });

    queues.current[key] = next;
  }, []);

  const updateValue = useCallback(
    <K extends WorkspaceKey>(key: K, action: SetStateAction<WorkspaceData[K]>) => {
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
      saveStatus,
      error,
      updateValue,
      reload,
    }),
    [data, error, reload, saveStatus, updateValue],
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
