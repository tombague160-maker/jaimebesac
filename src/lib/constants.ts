import type {
  CalendarEventType,
  ClientStatus,
  ContentIdeaStatus,
  NewsCategory,
  NewsStatus,
  Priority,
  PublicationPlatform,
  PublicationStatus,
  ReminderChannel,
  ReminderStatus,
  ReminderType,
  ShootingStatus,
} from "@/types";
import { brandColors, pastelColors } from "@/lib/theme";

export type StatusTone = "neutral" | "blue" | "green" | "orange" | "rose" | "yellow" | "black";

export interface VisualConfig {
  label: string;
  color: string;
  bg: string;
  tone: StatusTone;
}

export const priorityConfig: Record<Priority, VisualConfig> = {
  low: { label: "Basse", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  medium: { label: "Normale", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  high: { label: "Haute", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  urgent: { label: "Urgente", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
};

export const clientStatusConfig: Record<ClientStatus, VisualConfig> = {
  prospect: { label: "Prospect", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  contacted: { label: "Contacté", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  meeting_scheduled: { label: "RDV prévu", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  proposal_sent: { label: "Proposition envoyée", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  active: { label: "Client actif", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  to_follow_up: { label: "À relancer", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  former: { label: "Ancien client", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  partner: { label: "Partenaire", color: brandColors.ink, bg: brandColors.blueSoft, tone: "black" },
  lost: { label: "Perdu", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const shootingStatusConfig: Record<ShootingStatus, VisualConfig> = {
  idea: { label: "Idée", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  to_confirm: { label: "À confirmer", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  confirmed: { label: "Confirmé", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  shot: { label: "Tourné", color: brandColors.ink, bg: brandColors.blueSoft, tone: "black" },
  editing: { label: "En montage", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  sent_to_client: { label: "Envoyé client", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  client_approved: { label: "Validé client", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  scheduled: { label: "Programmé", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  published: { label: "Publié", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  archived: { label: "Archivé", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const publicationStatusConfig: Record<PublicationStatus, VisualConfig> = {
  idea: { label: "Idée", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  to_write: { label: "À rédiger", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  waiting_media: { label: "Attente média", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  waiting_client_validation: { label: "Validation client", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  approved: { label: "Validé", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  scheduled: { label: "Programmé", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  published: { label: "Publié", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  to_edit: { label: "À modifier", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  cancelled: { label: "Annulé", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const reminderStatusConfig: Record<ReminderStatus, VisualConfig> = {
  todo: { label: "À faire", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  overdue: { label: "En retard", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  done: { label: "Faite", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  postponed: { label: "Reportée", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  cancelled: { label: "Annulée", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const newsStatusConfig: Record<NewsStatus, VisualConfig> = {
  to_read: { label: "À lire", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  interesting: { label: "Intéressant", color: brandColors.ink, bg: brandColors.blueSoft, tone: "black" },
  to_process: { label: "À traiter", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  content_planned: { label: "Contenu prévu", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  processed: { label: "Traité", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  ignored: { label: "Ignoré", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const contentIdeaStatusConfig: Record<ContentIdeaStatus, VisualConfig> = {
  raw: { label: "Idée brute", color: brandColors.muted, bg: brandColors.paperDeep, tone: "neutral" },
  to_validate: { label: "À valider", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  validated: { label: "Validée", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  planned: { label: "Planifiée", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  in_production: { label: "En production", color: brandColors.ink, bg: brandColors.blueSoft, tone: "black" },
  published: { label: "Publiée", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  abandoned: { label: "Abandonnée", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
};

export const eventTypeConfig: Record<CalendarEventType, VisualConfig> = {
  shooting: { label: "Tournage", color: brandColors.ink, bg: brandColors.blueSoft, tone: "black" },
  editing: { label: "Montage", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  publication: { label: "Publication", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
  client_meeting: { label: "RDV client", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  follow_up: { label: "Relance", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  local_event: { label: "Événement local", color: brandColors.blueDeep, bg: pastelColors.bluePastelSoft, tone: "blue" },
  client_validation: { label: "Validation client", color: pastelColors.yellowText, bg: pastelColors.yellowSoft, tone: "yellow" },
  payment: { label: "Paiement", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  travel: { label: "Déplacement", color: brandColors.muted, bg: brandColors.lineSoft, tone: "neutral" },
  internal_meeting: { label: "Réunion interne", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
};

export const platformConfig: Record<PublicationPlatform, VisualConfig> = {
  Instagram: { label: "Instagram", color: pastelColors.roseText, bg: pastelColors.roseSoft, tone: "rose" },
  TikTok: { label: "TikTok", color: brandColors.ink, bg: brandColors.lineSoft, tone: "black" },
  Facebook: { label: "Facebook", color: brandColors.blueDeep, bg: brandColors.blueWash, tone: "blue" },
  "YouTube Shorts": { label: "YouTube Shorts", color: pastelColors.orangeText, bg: pastelColors.orangeSoft, tone: "orange" },
  LinkedIn: { label: "LinkedIn", color: brandColors.blueDeep, bg: pastelColors.bluePastelSoft, tone: "blue" },
  "Site web": { label: "Site web", color: pastelColors.greenText, bg: pastelColors.greenSoft, tone: "green" },
};

export const reminderTypeLabels: Record<ReminderType, string> = {
  prospect: "Prospect",
  post_shooting_client: "Client après tournage",
  video_validation: "Validation vidéo",
  payment: "Paiement",
  partnership: "Partenariat",
  publication: "Publication",
  quote: "Devis",
  meeting: "Rendez-vous",
  contract_renewal: "Renouvellement",
};

export const channelLabels: Record<ReminderChannel, string> = {
  phone: "Téléphone",
  email: "Email",
  instagram: "Instagram",
  sms: "SMS",
  in_person: "Rendez-vous",
  whatsapp: "WhatsApp",
};

export const newsCategories: NewsCategory[] = [
  "politique locale",
  "économie",
  "commerces",
  "culture",
  "événements",
  "sport",
  "faits divers",
  "travaux / circulation",
  "vie étudiante",
  "associations",
  "sorties",
  "gastronomie",
  "tourisme",
  "initiatives locales",
];
