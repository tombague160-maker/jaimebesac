import { clsx, type ClassValue } from "clsx";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type { Client } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, pattern = "d MMM yyyy") {
  if (!date) return "Date à préciser";
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) return "Date à préciser";
  return format(parsedDate, pattern, { locale: fr });
}

export function formatTimeRange(start: string, end: string) {
  if (!start && !end) return "Horaire à préciser";
  if (!start) return `Jusqu'à ${end}`;
  if (!end) return `À partir de ${start}`;
  return `${start} - ${end}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getClientName(clientId: string | undefined, clients: Client[] = []) {
  if (!clientId) return "J'aime Besac";
  return clients.find((client) => client.id === clientId)?.name ?? "Client inconnu";
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
