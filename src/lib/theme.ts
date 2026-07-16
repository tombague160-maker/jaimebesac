import type { CalendarEventType } from "@/types";

export const brandColors = {
  ink: "#18232B",
  inkSoft: "#24313A",
  blue: "#5EADD3",
  blueStrong: "#469AC4",
  blueDeep: "#287CA8",
  blueSoft: "#9FD8F3",
  blueWash: "#E7F5FA",
  paper: "#FFFDF3",
  paperDeep: "#FBFAF2",
  muted: "#596A76",
  mutedSoft: "#8697A2",
  line: "#D8E5EC",
  lineSoft: "#E8F0F4",
  white: "#FFFFFF",
} as const;

export const pastelColors = {
  orange: "#FFD9B3",
  orangeSoft: "#FFF3E7",
  orangeText: "#86521E",
  rose: "#F8C7D8",
  roseSoft: "#FDEDF3",
  roseText: "#88415C",
  green: "#BFE7CF",
  greenSoft: "#EAF8F0",
  greenText: "#2F7452",
  yellow: "#F7E8A8",
  yellowSoft: "#FFF8DA",
  yellowText: "#746216",
  bluePastel: "#CDEAF6",
  bluePastelSoft: "#EEF9FC",
  bluePastelText: "#287CA8",
} as const;

export const chartPalette = [
  brandColors.blue,
  pastelColors.orange,
  pastelColors.rose,
  pastelColors.green,
  pastelColors.yellow,
  brandColors.blueSoft,
  brandColors.ink,
] as const;

export const calendarTypeColors: Record<CalendarEventType, string> = {
  shooting: brandColors.blueSoft,
  editing: pastelColors.yellow,
  publication: pastelColors.green,
  client_meeting: pastelColors.orange,
  follow_up: pastelColors.rose,
  local_event: pastelColors.bluePastel,
  client_validation: pastelColors.yellow,
  payment: pastelColors.rose,
  travel: brandColors.lineSoft,
  internal_meeting: brandColors.blueWash,
};

export function getCalendarEventColor(type: CalendarEventType, status?: string) {
  if (status === "done" || status === "published") return pastelColors.green;
  if (status === "urgent" || status === "overdue") return pastelColors.rose;
  return calendarTypeColors[type] ?? brandColors.blueSoft;
}
