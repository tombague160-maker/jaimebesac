import { z } from "zod";
import type { WorkspaceKey } from "@/types";

// Structural validation for the generic `PUT /api/workspace/[key]` write path.
// Goal: reject the shapes that corrupt data or crash the front (a non-array for a
// collection, a null, an array for `settings`) and block arbitrary injection —
// without rejecting legitimate rows, so collections keep unknown fields via
// `.passthrough()` and only enforce the invariant every consumer relies on (a
// string `id`).

const collection = z.array(z.object({ id: z.string().min(1) }).passthrough());

const settingsSchema = z
  .object({
    density: z.enum(["compact", "comfortable", "large"]),
    displayName: z.string(),
    email: z.string(),
  })
  .passthrough();

export const workspaceValueSchemas: Record<WorkspaceKey, z.ZodTypeAny> = {
  clients: collection,
  shootings: collection,
  publications: collection,
  calendarEvents: collection,
  reminders: collection,
  newsItems: collection,
  newsSources: collection,
  contentIdeas: collection,
  serviceOffers: collection,
  settings: settingsSchema,
};

export function validateWorkspaceValue(
  key: WorkspaceKey,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const result = workspaceValueSchemas[key].safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, message: `Donnees invalides pour "${key}".` };
}
