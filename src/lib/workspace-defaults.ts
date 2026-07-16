import type { WorkspaceData } from "@/types";

export function createEmptyWorkspace(): WorkspaceData {
  return {
    clients: [],
    shootings: [],
    publications: [],
    calendarEvents: [],
    reminders: [],
    newsItems: [],
    newsSources: [],
    contentIdeas: [],
    serviceOffers: [],
    settings: {
      density: "comfortable",
      displayName: "Tom Martin",
      email: "",
    },
  };
}
