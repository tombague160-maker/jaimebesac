"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  ExternalLink,
  FilePlus2,
  Lightbulb,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { newsCategories, newsStatusConfig, priorityConfig } from "@/lib/constants";
import { addDaysIso, todayIso } from "@/lib/dates";
import { getCalendarEventColor, pastelColors } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import type { CalendarEvent, ContentIdea, NewsCategory, NewsItem, NewsStatus, Priority, Publication } from "@/types";
import { Metric } from "@/components/ui/metric";
import { InfoRow } from "@/components/ui/info-row";

export function NewsWorkspace() {
  const [items, setItems] = useWorkspaceValue("newsItems");
  const [sources] = useWorkspaceValue("newsSources");
  const [, setContentIdeas] = useWorkspaceValue("contentIdeas");
  const [, setCalendarEvents] = useWorkspaceValue("calendarEvents");
  const [, setPublications] = useWorkspaceValue("publications");
  const { isLoading, reload } = useWorkspace();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | NewsCategory>("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState<"all" | NewsStatus>("all");
  const [minimumScore, setMinimumScore] = useState("0");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("La veille et ses changements sont sauvegardes automatiquement.");
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredItems = useMemo(() => {
    const lowered = query.toLowerCase();
    const minScore = Number(minimumScore);
    return items
      .filter((item) => {
        const matchesQuery = `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.sourceName}`
          .toLowerCase()
          .includes(lowered);
        const matchesCategory = category === "all" || item.category === category;
        const matchesSource = source === "all" || item.sourceId === source;
        const matchesStatus = status === "all" || item.status === status;
        const matchesScore = item.importanceScore >= minScore;
        return matchesQuery && matchesCategory && matchesSource && matchesStatus && matchesScore;
      })
      .sort((a, b) => b.importanceScore - a.importanceScore);
  }, [category, items, minimumScore, query, source, status]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const averageScore = items.length
    ? String(Math.round(items.reduce((sum, item) => sum + item.importanceScore, 0) / items.length))
    : "0";

  function updateStatus(id: string, nextStatus: NewsStatus, message: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    setNotice(message);
  }

  function createNews(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    // Empty value = "Source manuelle" — keep it manual instead of falling back to
    // the first configured RSS source.
    const sourceId = String(form.get("sourceId") ?? "");
    const sourceRecord = sources.find((entry) => entry.id === sourceId);
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const newItem: NewsItem = {
      id: `news-local-${Date.now()}`,
      title: String(form.get("title") || "Nouvelle actualite"),
      summary: String(form.get("summary") || ""),
      sourceId,
      sourceName: sourceRecord?.name ?? "Source manuelle",
      sourceUrl: sourceRecord?.url ?? "",
      originalUrl: String(form.get("originalUrl") || sourceRecord?.url || ""),
      publishedAt: String(form.get("publishedAt") || new Date().toISOString().slice(0, 10)),
      category: form.get("category") as NewsCategory,
      tags,
      importanceScore: Number(form.get("importanceScore") || 50),
      urgencyLevel: form.get("urgencyLevel") as Priority,
      editorialAngle: String(form.get("editorialAngle") || ""),
      status: "to_read",
      notes: String(form.get("notes") || ""),
      contentIdeas: [],
      relatedPublicationIds: [],
      relatedCalendarEventIds: [],
    };

    setItems((current) => [newItem, ...current]);
    setSelectedId(newItem.id);
    setNotice("Actualite ajoutee et sauvegardee.");
    formElement.reset();
    setModalOpen(false);
  }

  async function runSync() {
    setIsSyncing(true);
    setNotice("Synchronisation RSS en cours...");

    try {
      const response = await fetch("/api/news/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limitPerSource: 20 }),
      });

      if (!response.ok) throw new Error("Synchronisation refusee");
      const result = (await response.json()) as {
        addedCount: number;
        duplicateCount: number;
        errorCount: number;
      };
      await reload();
      setNotice(
        `Synchronisation terminee : ${result.addedCount} ajoutee(s), ${result.duplicateCount} doublon(s), ${result.errorCount} erreur(s).`,
      );
    } catch {
      setNotice("Synchronisation impossible pour le moment. Verifie les flux RSS configures.");
    } finally {
      setIsSyncing(false);
    }
  }

  function createIdeaFromNews(item: NewsItem) {
    const idea: ContentIdea = {
      id: `idea-${crypto.randomUUID()}`,
      title: item.title,
      description: item.summary,
      sourceType: "news",
      newsItemId: item.id,
      recommendedFormat: "Reel Instagram",
      recommendedPlatform: "Instagram",
      priority: item.urgencyLevel,
      status: "raw",
      targetDate: addDaysIso(2),
      notes: item.editorialAngle,
    };
    setContentIdeas((current) => [idea, ...current]);
    updateStatus(item.id, "content_planned", "Idée de contenu créée et sauvegardée.");
    setSelectedId(null);
  }

  function addNewsToPlanning(item: NewsItem) {
    const calendarEvent: CalendarEvent = {
      id: `event-${crypto.randomUUID()}`,
      title: item.title,
      type: "local_event",
      date: addDaysIso(1),
      startTime: "09:00",
      endTime: "09:30",
      location: "Besançon",
      description: item.summary,
      status: "to_plan",
      priority: item.urgencyLevel,
      color: getCalendarEventColor("local_event"),
      notes: item.editorialAngle,
    };
    setCalendarEvents((current) => [calendarEvent, ...current]);
    updateStatus(item.id, "content_planned", "Actualité ajoutée et sauvegardée dans le planning.");
    setSelectedId(null);
  }

  function createPublicationFromNews(item: NewsItem) {
    const today = todayIso();
    const publication: Publication = {
      id: `publication-${crypto.randomUUID()}`,
      title: item.title,
      date: addDaysIso(2),
      time: "12:00",
      platform: "Instagram",
      caption: item.editorialAngle || item.summary,
      hashtags: item.tags.map((tag) => `#${tag.replace(/\s+/g, "")}`),
      mediaUrl: "",
      status: "to_write",
      clientValidationStatus: "not_required",
      notes: item.originalUrl,
      createdAt: today,
      updatedAt: today,
    };
    setPublications((current) => [publication, ...current]);
    updateStatus(item.id, "content_planned", "Publication créée et sauvegardée.");
    setSelectedId(null);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-eyebrow">Veille editoriale</p>
            <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
              Actualites Besancon a transformer en sujets.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Sources fiables, scores d&apos;interet, angles suggeres et actions vers idees, planning ou publications.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={runSync} disabled={isSyncing}>
              <RefreshCw className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Synchroniser
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter une actualite
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Newspaper} label="A traiter" value={String(items.filter((item) => ["to_process", "interesting"].includes(item.status)).length)} />
        <Metric icon={Newspaper} label="Score moyen" value={averageScore} />
        <Metric icon={Newspaper} label="Sources actives" value={String(sources.filter((item) => item.isActive).length)} />
        <Metric icon={Newspaper} label="Sujets urgents" value={String(items.filter((item) => item.urgencyLevel === "urgent").length)} />
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[1fr_190px_220px_190px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <TextInput
              className="pl-9"
              placeholder="Rechercher titre, source, tag..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={category} onChange={(event) => setCategory(event.target.value as "all" | NewsCategory)}>
            <option value="all">Categories</option>
            {newsCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="all">Sources</option>
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value as "all" | NewsStatus)}>
            <option value="all">Tous statuts</option>
            {Object.keys(newsStatusConfig).map((key) => (
              <option key={key} value={key}>
                {newsStatusConfig[key as NewsStatus].label}
              </option>
            ))}
          </Select>
          <Select value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)}>
            <option value="0">Score 0+</option>
            <option value="60">Score 60+</option>
            <option value="75">Score 75+</option>
            <option value="90">Score 90+</option>
          </Select>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-muted">
        {isLoading ? "Chargement de la veille persistante..." : notice}
      </p>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onOpen={() => setSelectedId(item.id)}
              onMarkInteresting={() => updateStatus(item.id, "interesting", "Actualite marquee comme interessante.")}
              onIgnore={() => updateStatus(item.id, "ignored", "Actualite ignoree.")}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <SectionHeading title="Sources prevues" eyebrow="Architecture veille" />
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-ink">{item.name}</p>
                    <p className="mt-1 text-xs font-bold text-muted">{item.type}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-black"
                    style={{ backgroundColor: pastelColors.greenSoft, color: pastelColors.greenText }}
                  >
                    {item.reliabilityScore}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.category}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Drawer
        open={Boolean(selectedItem)}
        title={selectedItem?.title ?? ""}
        subtitle={selectedItem ? `${selectedItem.sourceName} - ${formatNewsDate(selectedItem.publishedAt)}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedItem ? (
          <NewsDetail
            item={selectedItem}
            onStatus={(nextStatus, message) => updateStatus(selectedItem.id, nextStatus, message)}
            onCreateIdea={() => createIdeaFromNews(selectedItem)}
            onAddToPlanning={() => addNewsToPlanning(selectedItem)}
            onCreatePublication={() => createPublicationFromNews(selectedItem)}
          />
        ) : null}
      </Drawer>

      <Modal
        open={modalOpen}
        title="Actualite manuelle"
        subtitle="Lien ou information saisie par l'equipe."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={createNews}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" required placeholder="Titre de l'information" />
          </div>
          <div className="grid gap-2">
            <Label>Resume court</Label>
            <TextArea name="summary" placeholder="Resume autorise ou note interne..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Source</Label>
              <Select name="sourceId" defaultValue="">
                <option value="">Source manuelle</option>
                {sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categorie</Label>
              <Select name="category" defaultValue="culture">
                {newsCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Date</Label>
              <TextInput name="publishedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="grid gap-2">
              <Label>Score</Label>
              <TextInput name="importanceScore" type="number" min="0" max="100" defaultValue="70" />
            </div>
            <div className="grid gap-2">
              <Label>Urgence</Label>
              <Select name="urgencyLevel" defaultValue="medium">
                {(["low", "medium", "high", "urgent"] as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityConfig[priority].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Lien original</Label>
            <TextInput name="originalUrl" placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label>Tags</Label>
            <TextInput name="tags" placeholder="culture, sortie, commerce" />
          </div>
          <div className="grid gap-2">
            <Label>Angle editorial suggere</Label>
            <TextArea name="editorialAngle" />
          </div>
          <div className="grid gap-2">
            <Label>Notes internes</Label>
            <TextArea name="notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter a la veille</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


function NewsCard({
  item,
  onOpen,
  onMarkInteresting,
  onIgnore,
}: {
  item: NewsItem;
  onOpen: () => void;
  onMarkInteresting: () => void;
  onIgnore: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button className="w-full p-4 text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-black text-ink">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-muted">
              {item.sourceName} - {formatNewsDate(item.publishedAt)}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-wash text-lg font-black text-ink">
            {item.importanceScore}
          </div>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{item.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge config={newsStatusConfig[item.status]} />
          <Badge config={priorityConfig[item.urgencyLevel]} />
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted">
            {item.category}
          </span>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
        <Button variant="secondary" size="sm" onClick={onMarkInteresting}>
          <Star className="h-3.5 w-3.5" />
          Interessant
        </Button>
        <Button variant="ghost" size="sm" onClick={onIgnore}>
          <XCircle className="h-3.5 w-3.5" />
          Ignorer
        </Button>
      </div>
    </Card>
  );
}

function NewsDetail({
  item,
  onStatus,
  onCreateIdea,
  onAddToPlanning,
  onCreatePublication,
}: {
  item: NewsItem;
  onStatus: (status: NewsStatus, message: string) => void;
  onCreateIdea: () => void;
  onAddToPlanning: () => void;
  onCreatePublication: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge config={newsStatusConfig[item.status]} />
        <Badge config={priorityConfig[item.urgencyLevel]} />
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted">
          {item.category}
        </span>
        <span className="rounded-full bg-blue-wash px-2.5 py-1 text-xs font-black text-ink">
          Score {item.importanceScore}
        </span>
      </div>
      <InfoRow label="Resume" value={item.summary} />
      <InfoRow label="Angle editorial suggere" value={item.editorialAngle} />
      <InfoRow label="Tags" value={item.tags.join(", ")} />
      <InfoRow label="Notes internes" value={item.notes || "Aucune note"} />
      <InfoRow label="Idees possibles" value={item.contentIdeas.join(" - ") || "A definir"} />
      {item.originalUrl && /^https?:\/\//i.test(item.originalUrl) ? (
        <a
          href={item.originalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 max-w-full items-center gap-2 break-all rounded-lg border border-line bg-card px-3 py-2 text-sm font-bold text-ink transition hover:border-blue-soft"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir la source
        </a>
      ) : null}
      <div className="grid gap-2">
        <Button onClick={() => onStatus("interesting", "Actualite marquee interessante.")}>
          <Star className="h-4 w-4" />
          Marquer comme interessant
        </Button>
        <Button variant="secondary" onClick={onCreateIdea}>
          <Lightbulb className="h-4 w-4" />
          Creer une idee de contenu
        </Button>
        <Button variant="secondary" onClick={onAddToPlanning}>
          <CalendarPlus className="h-4 w-4" />
          Ajouter au planning
        </Button>
        <Button variant="secondary" onClick={onCreatePublication}>
          <FilePlus2 className="h-4 w-4" />
          Creer une publication
        </Button>
        <Button variant="ghost" onClick={() => onStatus("ignored", "Actualite ignoree.")}>
          <XCircle className="h-4 w-4" />
          Ignorer
        </Button>
      </div>
    </div>
  );
}


function formatNewsDate(value: string) {
  return value ? formatDate(value) : "Date inconnue";
}
