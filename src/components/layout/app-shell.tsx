"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  FileText,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Modal } from "@/components/ui/modal";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { useWorkspace } from "@/components/workspace-provider";
import { addDaysIso, todayIso } from "@/lib/dates";
import { countOverdue } from "@/lib/reminders";
import { pastelColors } from "@/lib/theme";
import { getClientName, getInitials } from "@/lib/utils";
import type { Client, ContentIdea, NewsItem, Publication, Reminder, Shooting } from "@/types";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: Home },
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Tournages", href: "/shootings", icon: Clapperboard },
  { label: "Publications", href: "/publications", icon: FileText },
  { label: "Actualités Besançon", href: "/news", icon: Newspaper },
  { label: "Clients / CRM", href: "/clients", icon: Users },
  { label: "Relances", href: "/reminders", icon: Bell },
  { label: "Idées de contenus", href: "/content-ideas", icon: Lightbulb },
  { label: "Statistiques", href: "/statistics", icon: BarChart3 },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

const quickTypes = [
  "Client",
  "Tournage",
  "Publication",
  "Relance",
  "Actualité",
  "Idée de contenu",
];

function todayLabels() {
  const now = new Date();
  return {
    display: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now),
    input: todayIso(),
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page renders outside the authenticated shell (no sidebar, no
  // workspace data fetch).
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, updateValue, saveStatus, error, reload } = useWorkspace();
  const { clients, contentIdeas, newsItems, publications, reminders, shootings } = data;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const urgentReminders = countOverdue(reminders, todayIso());
  const activeItem = navigation.find((item) => pathname.startsWith(item.href));
  const currentDate = useMemo(() => todayLabels(), []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return [
      ...clients.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${item.sector} · ${item.contactName}`,
        href: "/clients",
        type: "Client",
      })),
      ...shootings.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${getClientName(item.clientId, clients)} · ${item.date}`,
        href: "/shootings",
        type: "Tournage",
      })),
      ...publications.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.platform} · ${item.date}`,
        href: "/publications",
        type: "Publication",
      })),
      ...newsItems.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.sourceName} · score ${item.importanceScore}`,
        href: "/news",
        type: "Actualité",
      })),
      ...reminders.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${getClientName(item.clientId, clients)} · ${item.dueDate}`,
        href: "/reminders",
        type: "Relance",
      })),
      ...contentIdeas.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.recommendedFormat} · ${item.targetDate}`,
        href: "/content-ideas",
        type: "Idée",
      })),
    ]
      .filter((item) => `${item.title} ${item.meta} ${item.type}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [clients, contentIdeas, newsItems, publications, reminders, searchQuery, shootings]);

  function handleQuickSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") || "Tournage");
    const title = String(form.get("title") || "Nouvel élément");
    const clientId = String(form.get("clientId") || "");
    const date = String(form.get("date") || todayIso());
    const note = String(form.get("note") || "");
    const id = `${type.toLowerCase().replace(/\s+/g, "-")}-${crypto.randomUUID()}`;

    if (type === "Client") {
      const client: Client = {
        id,
        name: title,
        logo: getInitials(title),
        sector: "",
        address: "",
        city: "Besançon",
        contactName: "",
        phone: "",
        email: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        linkedin: "",
        website: "",
        status: "prospect",
        priority: "medium",
        estimatedRevenue: 0,
        actualRevenue: 0,
        lastContactDate: todayIso(),
        nextFollowUpDate: addDaysIso(7),
        notes: note,
        createdAt: todayIso(),
        updatedAt: todayIso(),
      };
      updateValue("clients", (current) => [client, ...current]);
    } else if (type === "Tournage") {
      const shooting: Shooting = {
        id,
        title,
        clientId,
        date,
        startTime: "09:00",
        endTime: "11:00",
        location: "",
        contactName: "",
        contactPhone: "",
        creativeBrief: note,
        objective: "",
        platforms: ["Instagram"],
        equipment: [],
        notes: note,
        status: "idea",
        priority: "medium",
        reminderIds: [],
        createdAt: todayIso(),
        updatedAt: todayIso(),
      };
      updateValue("shootings", (current) => [shooting, ...current]);
    } else if (type === "Publication") {
      const publication: Publication = {
        id,
        title,
        clientId: clientId || undefined,
        date,
        time: "12:00",
        platform: "Instagram",
        caption: note,
        hashtags: [],
        mediaUrl: "",
        status: "idea",
        clientValidationStatus: "not_required",
        notes: note,
        createdAt: todayIso(),
        updatedAt: todayIso(),
      };
      updateValue("publications", (current) => [publication, ...current]);
    } else if (type === "Relance") {
      const reminder: Reminder = {
        id,
        title,
        clientId,
        relatedType: "client",
        relatedId: clientId,
        type: "prospect",
        dueDate: date,
        priority: "medium",
        channel: "phone",
        status: "todo",
        notes: note,
        history: [],
      };
      updateValue("reminders", (current) => [reminder, ...current]);
    } else if (type === "Actualité") {
      const newsItem: NewsItem = {
        id,
        title,
        summary: note,
        sourceId: "",
        sourceName: "Source manuelle",
        sourceUrl: "",
        originalUrl: "",
        publishedAt: date,
        category: "initiatives locales",
        tags: [],
        importanceScore: 50,
        urgencyLevel: "medium",
        editorialAngle: "",
        status: "to_read",
        notes: note,
        contentIdeas: [],
        relatedPublicationIds: [],
        relatedCalendarEventIds: [],
      };
      updateValue("newsItems", (current) => [newsItem, ...current]);
    } else {
      const idea: ContentIdea = {
        id,
        title,
        description: note,
        sourceType: "manual",
        clientId: clientId || undefined,
        recommendedFormat: "Reel Instagram",
        recommendedPlatform: "Instagram",
        priority: "medium",
        status: "raw",
        targetDate: date,
        notes: note,
      };
      updateValue("contentIdeas", (current) => [idea, ...current]);
    }

    setQuickOpen(false);
    setToast("Élément créé et sauvegardé.");
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="min-h-screen text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-line bg-paper/92 backdrop-blur-xl lg:block">
        <SidebarContent
          pathname={pathname}
          urgentReminders={urgentReminders}
          onCreate={() => setQuickOpen(true)}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              aria-label="Fermer la navigation"
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[300px] border-r border-line bg-paper"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 270, damping: 28 }}
            >
              <SidebarContent
                pathname={pathname}
                urgentReminders={urgentReminders}
                onCreate={() => {
                  setMobileOpen(false);
                  setQuickOpen(true);
                }}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-line bg-card/86 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir la navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted">Aujourd&apos;hui · {currentDate.display}</p>
              <p className="truncate text-base font-black text-ink sm:text-lg">
                {activeItem?.label ?? "Studio"}
              </p>
            </div>
            <button
              className="hidden h-10 min-w-[280px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-left text-sm text-muted transition hover:border-blue-soft hover:bg-card md:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              Rechercher client, tournage, actu...
            </button>
            <Button variant="secondary" size="icon" onClick={() => setSearchOpen(true)} aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button onClick={() => setQuickOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Créer</span>
            </Button>
          </div>
        </header>
        {saveStatus === "loading" ? (
          <div className="h-0.5 w-full animate-pulse bg-blue" aria-hidden />
        ) : null}
        <div className="app-content px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>

      <Modal
        open={quickOpen}
        title="Action rapide"
        subtitle="Créer rapidement un nouvel élément de travail."
        onClose={() => setQuickOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleQuickSubmit}>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select name="type" defaultValue="Tournage">
              {quickTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" placeholder="Ex. Reel ouverture commerce" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select name="clientId" defaultValue="">
                <option value="">Sans client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date cible</Label>
              <TextInput name="date" type="date" defaultValue={currentDate.input} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Note</Label>
            <TextArea name="note" placeholder="Brief, objectif ou prochaine action..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setQuickOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={searchOpen}
        title="Recherche globale"
        subtitle="Clients, tournages, publications, relances, actualités et idées."
        onClose={() => setSearchOpen(false)}
      >
        <div className="space-y-4">
          <TextInput
            autoFocus
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tapez un nom, un sujet, une source..."
          />
          <div className="premium-scrollbar max-h-[360px] space-y-2 overflow-y-auto">
            {searchResults.length ? (
              searchResults.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-card p-3 text-left transition hover:border-blue-soft hover:bg-hover"
                  onClick={() => {
                    router.push(item.href);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-ink">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {item.type} · {item.meta}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface p-8 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-blue" />
                <p className="mt-3 text-sm font-bold text-ink">
                  {searchQuery ? "Aucun résultat trouvé" : "Recherche instantanée prête"}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-blue-soft bg-card px-4 py-3 text-sm font-bold text-ink shadow-[0_18px_48px_rgba(24,35,43,0.18)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <CheckCircle2 className="h-4 w-4" style={{ color: pastelColors.greenText }} />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {saveStatus === "error" ? (
        <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-danger-border bg-card px-4 py-3 text-sm font-bold text-danger shadow-lg">
          <span className="min-w-0">{error ?? "La sauvegarde est momentanément indisponible."}</span>
          <Button variant="secondary" size="sm" onClick={() => reload()}>
            Réessayer
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({
  pathname,
  urgentReminders,
  onCreate,
  onNavigate,
}: {
  pathname: string;
  urgentReminders: number;
  onCreate: () => void;
  onNavigate?: () => void;
}) {
  const { data } = useWorkspace();
  const userName = data.settings.displayName || "Utilisateur";
  const avatar = getInitials(userName) || "JB";

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center justify-between gap-3 px-1">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onNavigate}>
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-strong bg-card shadow-[0_12px_28px_rgba(24,35,43,0.16)]">
            <Image
              src="/logo-jaime-besac.jpeg"
              alt="Logo J'aime Besac"
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-ink">J&apos;aime Besac</p>
            <p className="truncate text-xs font-bold text-muted">Infos & good mood</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onNavigate} aria-label="Fermer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Button className="mb-5 w-full justify-start" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Action rapide
      </Button>

      <nav className="premium-scrollbar -mx-1 flex-1 space-y-1 overflow-y-auto px-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-bold transition",
                active
                  ? "border border-strong bg-blue-soft text-ink shadow-[3px_3px_0_rgba(24,35,43,0.16)]"
                  : "text-muted hover:bg-surface hover:text-ink",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-strong" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-lg border border-line bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase text-muted">Relances critiques</p>
            <p className="mt-1 text-2xl font-black text-ink">{urgentReminders}</p>
          </div>
          <Bell className="h-5 w-5" style={{ color: pastelColors.roseText }} />
        </div>
        <Link
          href="/reminders"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1 text-xs font-black text-ink"
        >
          Ouvrir les priorités
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-card p-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-wash text-xs font-black text-ink">
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">{userName}</p>
          <p className="truncate text-xs text-muted">Pilotage éditorial</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Se déconnecter"
          title="Se déconnecter"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
            window.location.assign("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
