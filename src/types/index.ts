export type UserRole = "owner" | "editor" | "sales" | "producer";
export type Priority = "low" | "medium" | "high" | "urgent";

export type ClientStatus =
  | "prospect"
  | "contacted"
  | "meeting_scheduled"
  | "proposal_sent"
  | "active"
  | "to_follow_up"
  | "former"
  | "partner"
  | "lost";

export type ShootingStatus =
  | "idea"
  | "to_confirm"
  | "confirmed"
  | "shot"
  | "editing"
  | "sent_to_client"
  | "client_approved"
  | "scheduled"
  | "published"
  | "archived";

export type PublicationPlatform =
  | "Instagram"
  | "TikTok"
  | "Facebook"
  | "YouTube Shorts"
  | "LinkedIn"
  | "Site web";

export type PublicationStatus =
  | "idea"
  | "to_write"
  | "waiting_media"
  | "waiting_client_validation"
  | "approved"
  | "scheduled"
  | "published"
  | "to_edit"
  | "cancelled";

export type PublicationValidationStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "changes_requested";

export type CalendarEventType =
  | "shooting"
  | "editing"
  | "publication"
  | "client_meeting"
  | "follow_up"
  | "local_event"
  | "client_validation"
  | "payment"
  | "travel"
  | "internal_meeting";

export type CalendarEventStatus =
  | "to_plan"
  | "confirmed"
  | "in_progress"
  | "done"
  | "waiting_client"
  | "published"
  | "to_follow_up"
  | "cancelled"
  | "urgent";

export type ReminderType =
  | "prospect"
  | "post_shooting_client"
  | "video_validation"
  | "payment"
  | "partnership"
  | "publication"
  | "quote"
  | "meeting"
  | "contract_renewal";

export type ReminderChannel =
  | "phone"
  | "email"
  | "instagram"
  | "sms"
  | "in_person"
  | "whatsapp";

export type ReminderStatus = "todo" | "overdue" | "done" | "postponed" | "cancelled";

export type NewsCategory =
  | "politique locale"
  | "économie"
  | "commerces"
  | "culture"
  | "événements"
  | "sport"
  | "faits divers"
  | "travaux / circulation"
  | "vie étudiante"
  | "associations"
  | "sorties"
  | "gastronomie"
  | "tourisme"
  | "initiatives locales";

export type NewsStatus =
  | "to_read"
  | "interesting"
  | "to_process"
  | "content_planned"
  | "processed"
  | "ignored";

export type NewsSourceType =
  | "rss"
  | "official_api"
  | "manual_link"
  | "social_public"
  | "press_release"
  | "open_data";

export type ContentFormat =
  | "Reel Instagram"
  | "TikTok"
  | "interview"
  | "reportage"
  | "micro-trottoir"
  | "story"
  | "post carousel"
  | "article"
  | "vidéo événement"
  | "live";

export type ContentIdeaStatus =
  | "raw"
  | "to_validate"
  | "validated"
  | "planned"
  | "in_production"
  | "published"
  | "abandoned";

export type EntityType =
  | "client"
  | "shooting"
  | "publication"
  | "calendar_event"
  | "reminder"
  | "news_item"
  | "content_idea";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface Client {
  id: string;
  name: string;
  logo: string;
  sector: string;
  address: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  website: string;
  status: ClientStatus;
  priority: Priority;
  estimatedRevenue: number;
  actualRevenue: number;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  preferredChannel: ReminderChannel;
}

export interface Shooting {
  id: string;
  title: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  contactName: string;
  contactPhone: string;
  creativeBrief: string;
  objective: string;
  platforms: PublicationPlatform[];
  equipment: string[];
  notes: string;
  status: ShootingStatus;
  priority: Priority;
  publicationId?: string;
  reminderIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  clientId?: string;
  shootingId?: string;
  date: string;
  time: string;
  platform: PublicationPlatform;
  caption: string;
  hashtags: string[];
  mediaUrl: string;
  status: PublicationStatus;
  clientValidationStatus: PublicationValidationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  clientId?: string;
  shootingId?: string;
  publicationId?: string;
  reminderId?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  contact?: string;
  phone?: string;
  platforms?: PublicationPlatform[];
  status: CalendarEventStatus;
  priority: Priority;
  color: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  clientId: string;
  relatedType: EntityType;
  relatedId: string;
  type: ReminderType;
  dueDate: string;
  priority: Priority;
  channel: ReminderChannel;
  status: ReminderStatus;
  notes: string;
  history: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  publishedAt: string;
  category: NewsCategory;
  tags: string[];
  importanceScore: number;
  urgencyLevel: Priority;
  editorialAngle: string;
  status: NewsStatus;
  notes: string;
  contentIdeas: string[];
  relatedPublicationIds: string[];
  relatedCalendarEventIds: string[];
}

export interface NewsSource {
  id: string;
  name: string;
  type: NewsSourceType;
  url: string;
  rssUrl?: string;
  category: string;
  reliabilityScore: number;
  isActive: boolean;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  sourceType: "news" | "client" | "event" | "manual" | "trend";
  newsItemId?: string;
  clientId?: string;
  recommendedFormat: ContentFormat;
  recommendedPlatform: PublicationPlatform;
  priority: Priority;
  status: ContentIdeaStatus;
  targetDate: string;
  notes: string;
}

export interface ServiceOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface WorkspaceSettings {
  density: "compact" | "comfortable" | "large";
  displayName: string;
  email: string;
}

export interface WorkspaceData {
  clients: Client[];
  shootings: Shooting[];
  publications: Publication[];
  calendarEvents: CalendarEvent[];
  reminders: Reminder[];
  newsItems: NewsItem[];
  newsSources: NewsSource[];
  contentIdeas: ContentIdea[];
  serviceOffers: ServiceOffer[];
  settings: WorkspaceSettings;
}

export type WorkspaceKey = keyof WorkspaceData;

export interface ActivityLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  description: string;
  createdAt: string;
  userId: string;
}

export interface Note {
  id: string;
  entityType: EntityType;
  entityId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
