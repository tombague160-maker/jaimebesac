import { z } from "zod";

export const clientStatusValues = [
  "prospect",
  "contacted",
  "meeting_scheduled",
  "proposal_sent",
  "active",
  "to_follow_up",
  "former",
  "partner",
  "lost",
] as const;

export const priorityValues = ["low", "medium", "high", "urgent"] as const;

export const newsStatusValues = [
  "to_read",
  "interesting",
  "to_process",
  "content_planned",
  "processed",
  "ignored",
] as const;

export const newsCategoryValues = [
  "politique locale",
  "economie",
  "commerces",
  "culture",
  "evenements",
  "sport",
  "faits divers",
  "travaux / circulation",
  "vie etudiante",
  "associations",
  "sorties",
  "gastronomie",
  "tourisme",
  "initiatives locales",
] as const;

const defaultString = z.string().trim().optional().default("");
const patchString = z.string().trim().optional();

export const createClientSchema = z.object({
  name: z.string().trim().min(1),
  sector: defaultString,
  address: defaultString,
  city: z.string().trim().optional().default("Besancon"),
  contactName: defaultString,
  phone: defaultString,
  email: defaultString,
  instagram: defaultString,
  facebook: defaultString,
  tiktok: defaultString,
  linkedin: defaultString,
  website: defaultString,
  status: z.enum(clientStatusValues).optional().default("prospect"),
  priority: z.enum(priorityValues).optional().default("medium"),
  estimatedRevenue: z.coerce.number().int().min(0).optional().default(0),
  actualRevenue: z.coerce.number().int().min(0).optional().default(0),
  lastContactDate: defaultString,
  nextFollowUpDate: defaultString,
  notes: defaultString,
});

export const updateClientSchema = z.object({
  name: patchString,
  sector: patchString,
  address: patchString,
  city: patchString,
  contactName: patchString,
  phone: patchString,
  email: patchString,
  instagram: patchString,
  facebook: patchString,
  tiktok: patchString,
  linkedin: patchString,
  website: patchString,
  status: z.enum(clientStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  estimatedRevenue: z.coerce.number().int().min(0).optional(),
  actualRevenue: z.coerce.number().int().min(0).optional(),
  lastContactDate: patchString,
  nextFollowUpDate: patchString,
  notes: patchString,
});

export const createNewsItemSchema = z.object({
  title: z.string().trim().min(1),
  summary: defaultString,
  sourceId: z.string().trim().min(1),
  originalUrl: z.string().trim().url(),
  publishedAt: defaultString,
  category: z.string().trim().optional().default("initiatives locales"),
  tags: z.array(z.string().trim()).optional().default([]),
  importanceScore: z.coerce.number().int().min(0).max(100).optional().default(50),
  urgencyLevel: z.enum(priorityValues).optional().default("medium"),
  editorialAngle: defaultString,
  status: z.enum(newsStatusValues).optional().default("to_read"),
  notes: defaultString,
});

export const updateNewsItemSchema = z.object({
  title: patchString,
  summary: patchString,
  sourceId: patchString,
  originalUrl: z.string().trim().url().optional(),
  publishedAt: patchString,
  category: patchString,
  tags: z.array(z.string().trim()).optional(),
  importanceScore: z.coerce.number().int().min(0).max(100).optional(),
  urgencyLevel: z.enum(priorityValues).optional(),
  status: z.enum(newsStatusValues).optional(),
  editorialAngle: patchString,
  notes: patchString,
});
