"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Clapperboard, FilePlus2, Lightbulb, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { contentIdeaStatusConfig, platformConfig, priorityConfig } from "@/lib/constants";
import { addDaysIso, todayIso } from "@/lib/dates";
import { getCalendarEventColor } from "@/lib/theme";
import { formatDate, getClientName } from "@/lib/utils";
import type { CalendarEvent, ContentFormat, ContentIdea, ContentIdeaStatus, Priority, Publication, PublicationPlatform, Shooting } from "@/types";

const formats: ContentFormat[] = [
  "Reel Instagram",
  "TikTok",
  "interview",
  "reportage",
  "micro-trottoir",
  "story",
  "post carousel",
  "article",
  "vidéo événement",
  "live",
];

export function ContentIdeasWorkspace() {
  const [ideas, setIdeas] = useWorkspaceValue("contentIdeas");
  const [, setShootings] = useWorkspaceValue("shootings");
  const [, setPublications] = useWorkspaceValue("publications");
  const [, setCalendarEvents] = useWorkspaceValue("calendarEvents");
  const { data } = useWorkspace();
  const { clients, newsItems } = data;
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<"all" | ContentFormat>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("Les idées peuvent être transformées en tournages ou publications.");

  const filteredIdeas = useMemo(() => {
    const lowered = query.toLowerCase();
    return ideas.filter((idea) => {
      const news = idea.newsItemId ? newsItems.find((item) => item.id === idea.newsItemId)?.title : "";
      const matchesQuery = `${idea.title} ${idea.description} ${idea.notes} ${news} ${getClientName(idea.clientId, clients)}`
        .toLowerCase()
        .includes(lowered);
      const matchesFormat = format === "all" || idea.recommendedFormat === format;
      const matchesPriority = priority === "all" || idea.priority === priority;
      return matchesQuery && matchesFormat && matchesPriority;
    });
  }, [clients, format, ideas, newsItems, priority, query]);

  const selectedIdea = ideas.find((idea) => idea.id === selectedId) ?? null;

  function updateStatus(id: string, status: ContentIdeaStatus, message: string) {
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, status } : idea)));
    setNotice(message);
  }

  function createIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newIdea: ContentIdea = {
      id: `idea-local-${Date.now()}`,
      title: String(form.get("title") || "Nouvelle idée"),
      description: String(form.get("description") || ""),
      sourceType: "manual",
      newsItemId: String(form.get("newsItemId") || "") || undefined,
      clientId: String(form.get("clientId") || "") || undefined,
      recommendedFormat: form.get("recommendedFormat") as ContentFormat,
      recommendedPlatform: form.get("recommendedPlatform") as PublicationPlatform,
      priority: form.get("priority") as Priority,
      status: "raw",
      targetDate: String(form.get("targetDate") || addDaysIso(2)),
      notes: String(form.get("notes") || ""),
    };
    setIdeas((current) => [newIdea, ...current]);
    setSelectedId(newIdea.id);
    setModalOpen(false);
  }

  function transformToShooting(idea: ContentIdea) {
    const today = todayIso();
    const shooting: Shooting = {
      id: `shooting-${crypto.randomUUID()}`,
      title: idea.title,
      clientId: idea.clientId ?? "",
      date: idea.targetDate,
      startTime: "09:00",
      endTime: "11:00",
      location: "",
      contactName: "",
      contactPhone: "",
      creativeBrief: idea.description,
      objective: idea.notes,
      platforms: [idea.recommendedPlatform],
      equipment: [],
      notes: `Créé depuis l'idée : ${idea.title}`,
      status: "idea",
      priority: idea.priority,
      reminderIds: [],
      createdAt: today,
      updatedAt: today,
    };
    setShootings((current) => [shooting, ...current]);
    updateStatus(idea.id, "in_production", "Tournage créé et sauvegardé.");
    setSelectedId(null);
  }

  function transformToPublication(idea: ContentIdea) {
    const today = todayIso();
    const publication: Publication = {
      id: `publication-${crypto.randomUUID()}`,
      title: idea.title,
      clientId: idea.clientId,
      date: idea.targetDate,
      time: "12:00",
      platform: idea.recommendedPlatform,
      caption: idea.description,
      hashtags: [],
      mediaUrl: "",
      status: "idea",
      clientValidationStatus: "not_required",
      notes: idea.notes,
      createdAt: today,
      updatedAt: today,
    };
    setPublications((current) => [publication, ...current]);
    updateStatus(idea.id, "planned", "Publication créée et sauvegardée.");
    setSelectedId(null);
  }

  function addIdeaToPlanning(idea: ContentIdea) {
    const calendarEvent: CalendarEvent = {
      id: `event-${crypto.randomUUID()}`,
      title: idea.title,
      type: "publication",
      clientId: idea.clientId,
      date: idea.targetDate,
      startTime: "12:00",
      endTime: "12:30",
      location: "",
      description: idea.description,
      platforms: [idea.recommendedPlatform],
      status: "to_plan",
      priority: idea.priority,
      color: getCalendarEventColor("publication"),
      notes: idea.notes,
    };
    setCalendarEvents((current) => [calendarEvent, ...current]);
    updateStatus(idea.id, "planned", "Événement ajouté et sauvegardé dans le planning.");
    setSelectedId(null);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">Idées de contenus</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Transformer la veille et les opportunités client.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Chaque idée garde sa source, son format recommandé, sa plateforme cible et sa prochaine action.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer une idée
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Idées actives" value={String(ideas.filter((idea) => idea.status !== "abandoned").length)} />
        <Metric label="À valider" value={String(ideas.filter((idea) => idea.status === "to_validate").length)} />
        <Metric label="Planifiées" value={String(ideas.filter((idea) => idea.status === "planned").length)} />
        <Metric label="En production" value={String(ideas.filter((idea) => idea.status === "in_production").length)} />
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher sujet, client, source..."
            />
          </div>
          <Select value={format} onChange={(event) => setFormat(event.target.value as "all" | ContentFormat)}>
            <option value="all">Tous les formats</option>
            {formats.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value as "all" | Priority)}>
            <option value="all">Toutes priorités</option>
            {(["low", "medium", "high", "urgent"] as Priority[]).map((item) => (
              <option key={item} value={item}>
                {priorityConfig[item].label}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">{notice}</p>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            clientName={getClientName(idea.clientId, clients)}
            onOpen={() => setSelectedId(idea.id)}
            onValidate={() => updateStatus(idea.id, "validated", "Idée validée.")}
            onPlan={() => updateStatus(idea.id, "planned", "Idée planifiée.")}
          />
        ))}
      </section>

      <Drawer
        open={Boolean(selectedIdea)}
        title={selectedIdea?.title ?? ""}
        subtitle={selectedIdea ? `${selectedIdea.recommendedFormat} · ${formatDate(selectedIdea.targetDate)}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedIdea ? (
          <IdeaDetail
            idea={selectedIdea}
            clientName={getClientName(selectedIdea.clientId, clients)}
            newsTitle={selectedIdea.newsItemId ? newsItems.find((item) => item.id === selectedIdea.newsItemId)?.title : undefined}
            onStatus={(status, message) => updateStatus(selectedIdea.id, status, message)}
            onCreateShooting={() => transformToShooting(selectedIdea)}
            onCreatePublication={() => transformToPublication(selectedIdea)}
            onAddToPlanning={() => addIdeaToPlanning(selectedIdea)}
          />
        ) : null}
      </Drawer>

      <Modal open={modalOpen} title="Nouvelle idée" subtitle="Du signal éditorial à la production." onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createIdea}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" required placeholder="Ex. Guide marchés du week-end" />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <TextArea name="description" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Actualité associée</Label>
              <Select name="newsItemId" defaultValue="">
                <option value="">Aucune</option>
                {newsItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Client potentiel</Label>
              <Select name="clientId" defaultValue="">
                <option value="">Aucun</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Format</Label>
              <Select name="recommendedFormat" defaultValue="Reel Instagram">
                {formats.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Plateforme</Label>
              <Select name="recommendedPlatform" defaultValue="Instagram">
                {Object.keys(platformConfig).map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priorité</Label>
              <Select name="priority" defaultValue="medium">
                {(["low", "medium", "high", "urgent"] as Priority[]).map((item) => (
                  <option key={item} value={item}>
                    {priorityConfig[item].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Date cible</Label>
            <TextInput name="targetDate" type="date" defaultValue={addDaysIso(2)} />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <TextArea name="notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l&apos;idée</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#596A76]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#18232B]">{value}</p>
        </div>
        <Lightbulb className="h-5 w-5 text-[#5EADD3]" />
      </CardContent>
    </Card>
  );
}

function IdeaCard({
  idea,
  clientName,
  onOpen,
  onValidate,
  onPlan,
}: {
  idea: ContentIdea;
  clientName: string;
  onOpen: () => void;
  onValidate: () => void;
  onPlan: () => void;
}) {
  return (
    <Card>
      <button className="w-full p-4 text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-[#18232B]">{idea.title}</p>
            <p className="mt-1 text-sm text-[#596A76]">{clientName}</p>
          </div>
          <Badge config={priorityConfig[idea.priority]} />
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#596A76]">{idea.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge config={contentIdeaStatusConfig[idea.status]} />
          <Badge config={platformConfig[idea.recommendedPlatform]} />
          <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
            {idea.recommendedFormat}
          </span>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 border-t border-[#D8E5EC] p-3">
        <Button variant="secondary" size="sm" onClick={onValidate}>
          Valider
        </Button>
        <Button variant="ghost" size="sm" onClick={onPlan}>
          Planifier
        </Button>
      </div>
    </Card>
  );
}

function IdeaDetail({
  idea,
  clientName,
  newsTitle,
  onStatus,
  onCreateShooting,
  onCreatePublication,
  onAddToPlanning,
}: {
  idea: ContentIdea;
  clientName: string;
  newsTitle?: string;
  onStatus: (status: ContentIdeaStatus, message: string) => void;
  onCreateShooting: () => void;
  onCreatePublication: () => void;
  onAddToPlanning: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge config={contentIdeaStatusConfig[idea.status]} />
        <Badge config={priorityConfig[idea.priority]} />
        <Badge config={platformConfig[idea.recommendedPlatform]} />
      </div>
      <Info label="Description" value={idea.description} />
      <Info label="Source d'inspiration" value={newsTitle ?? idea.sourceType} />
      <Info label="Client potentiel" value={clientName} />
      <Info label="Format recommandé" value={idea.recommendedFormat} />
      <Info label="Plateforme recommandée" value={idea.recommendedPlatform} />
      <Info label="Date cible" value={formatDate(idea.targetDate)} />
      <Info label="Notes" value={idea.notes || "Aucune note"} />
      <div className="grid gap-2">
        <Button onClick={onCreateShooting}>
          <Clapperboard className="h-4 w-4" />
          Transformer en tournage
        </Button>
        <Button variant="secondary" onClick={onCreatePublication}>
          <FilePlus2 className="h-4 w-4" />
          Transformer en publication
        </Button>
        <Button variant="secondary" onClick={onAddToPlanning}>
          <CalendarPlus className="h-4 w-4" />
          Ajouter au planning
        </Button>
        <Button variant="ghost" onClick={() => onStatus("abandoned", "Idée abandonnée.")}>
          Abandonner
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <p className="text-xs font-black uppercase text-[#596A76]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-[#18232B]">{value}</p>
    </div>
  );
}
