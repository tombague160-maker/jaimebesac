"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileText, LayoutGrid, Plus, Search, Send, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { platformConfig, publicationStatusConfig } from "@/lib/constants";
import { addDaysIso, todayIso, weekDaysIso } from "@/lib/dates";
import { cn, formatDate, getClientName } from "@/lib/utils";
import type { Publication, PublicationPlatform, PublicationStatus } from "@/types";

const publicationStatuses: PublicationStatus[] = [
  "idea",
  "to_write",
  "waiting_media",
  "waiting_client_validation",
  "approved",
  "scheduled",
  "published",
  "to_edit",
  "cancelled",
];

const platforms = Object.keys(platformConfig) as PublicationPlatform[];
const weekDays = weekDaysIso();
type ViewMode = "calendar" | "kanban" | "list";

export function PublicationsWorkspace() {
  const [publications, setPublications] = useWorkspaceValue("publications");
  const { data } = useWorkspace();
  const { clients, shootings } = data;
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | PublicationPlatform>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PublicationStatus>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("calendar");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("Calendrier éditorial prêt pour la semaine en cours.");

  const filteredPublications = useMemo(() => {
    const lowered = query.toLowerCase();
    return publications.filter((publication) => {
      const matchesQuery = `${publication.title} ${publication.caption} ${publication.hashtags.join(" ")} ${getClientName(publication.clientId, clients)}`
        .toLowerCase()
        .includes(lowered);
      const matchesPlatform = platformFilter === "all" || publication.platform === platformFilter;
      const matchesStatus = statusFilter === "all" || publication.status === statusFilter;
      const matchesClient = clientFilter === "all" || publication.clientId === clientFilter;
      return matchesQuery && matchesPlatform && matchesStatus && matchesClient;
    });
  }, [clientFilter, clients, platformFilter, publications, query, statusFilter]);

  const selectedPublication = publications.find((publication) => publication.id === selectedId) ?? null;

  function updateStatus(id: string, status: PublicationStatus, noticeText: string) {
    setPublications((current) =>
      current.map((publication) =>
        publication.id === id ? { ...publication, status, updatedAt: todayIso() } : publication,
      ),
    );
    setNotice(noticeText);
  }

  function createPublication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hashtags = String(form.get("hashtags") || "")
      .split(" ")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const newPublication: Publication = {
      id: `publication-local-${Date.now()}`,
      title: String(form.get("title") || "Nouvelle publication"),
      clientId: String(form.get("clientId") || "") || undefined,
      shootingId: String(form.get("shootingId") || "") || undefined,
      date: String(form.get("date") || addDaysIso(2)),
      time: String(form.get("time") || "12:00"),
      platform: form.get("platform") as PublicationPlatform,
      caption: String(form.get("caption") || ""),
      hashtags,
      mediaUrl: String(form.get("mediaUrl") || "manual://draft"),
      status: "idea",
      clientValidationStatus: "not_required",
      notes: String(form.get("notes") || ""),
      createdAt: todayIso(),
      updatedAt: todayIso(),
    };
    setPublications((current) => [newPublication, ...current]);
    setSelectedId(newPublication.id);
    setModalOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">Calendrier éditorial</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Publications sociales et contenus programmés.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Suivez chaque publication, sa plateforme, son client, sa validation et son lien tournage.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer une publication
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Cette semaine" value={String(filteredPublications.filter((item) => weekDays.includes(item.date)).length)} />
        <Metric label="En validation" value={String(publications.filter((item) => item.status === "waiting_client_validation").length)} />
        <Metric label="Programmées" value={String(publications.filter((item) => item.status === "scheduled").length)} />
        <Metric label="Publiées" value={String(publications.filter((item) => item.status === "published").length)} />
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[1fr_170px_190px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              placeholder="Rechercher titre, caption, hashtag..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value as "all" | PublicationPlatform)}
          >
            <option value="all">Plateformes</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | PublicationStatus)}
          >
            <option value="all">Tous les statuts</option>
            {publicationStatuses.map((status) => (
              <option key={status} value={status}>
                {publicationStatusConfig[status].label}
              </option>
            ))}
          </Select>
          <Select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
            <option value="all">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <ViewButton active={view === "calendar"} onClick={() => setView("calendar")} icon={CalendarDays} label="Calendrier" />
            <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={LayoutGrid} label="Kanban" />
            <ViewButton active={view === "list"} onClick={() => setView("list")} icon={Table2} label="Liste" />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">{notice}</p>

      {view === "calendar" ? (
        <section className="premium-scrollbar grid gap-3 overflow-x-auto pb-2 xl:grid-cols-7">
          {weekDays.map((day) => (
            <Card key={day} className="min-w-[220px]">
              <CardHeader>
                <p className="text-sm font-black text-[#18232B]">{formatDate(day, "EEEE d MMM")}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredPublications.filter((publication) => publication.date === day).length ? (
                  filteredPublications
                    .filter((publication) => publication.date === day)
                    .map((publication) => (
                      <PublicationMiniCard
                        key={publication.id}
                        publication={publication}
                        clientName={getClientName(publication.clientId, clients)}
                        onOpen={() => setSelectedId(publication.id)}
                      />
                    ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-5 text-center text-xs font-bold text-[#8697A2]">
                    Créneau libre
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {view === "kanban" ? (
        <section className="premium-scrollbar grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
          {publicationStatuses.slice(0, 5).map((status) => (
            <Card key={status} className="min-w-[260px]">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge config={publicationStatusConfig[status]} />
                  <span className="text-sm font-black text-[#18232B]">
                    {filteredPublications.filter((publication) => publication.status === status).length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredPublications
                  .filter((publication) => publication.status === status)
                  .map((publication) => (
                    <PublicationMiniCard
                      key={publication.id}
                      publication={publication}
                      clientName={getClientName(publication.clientId, clients)}
                      onOpen={() => setSelectedId(publication.id)}
                    />
                  ))}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {view === "list" ? (
        <Card className="overflow-hidden">
          <div className="premium-scrollbar overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#FBFAF2] text-xs font-black uppercase text-[#596A76]">
                <tr>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plateforme</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E5EC] bg-white">
                {filteredPublications.map((publication) => (
                  <tr
                    key={publication.id}
                    className="cursor-pointer hover:bg-[#F4FBFD]"
                    onClick={() => setSelectedId(publication.id)}
                  >
                    <td className="px-4 py-3 font-black text-[#18232B]">{publication.title}</td>
                    <td className="px-4 py-3 text-[#596A76]">{getClientName(publication.clientId, clients)}</td>
                    <td className="px-4 py-3 text-[#596A76]">
                      {formatDate(publication.date)} · {publication.time}
                    </td>
                    <td className="px-4 py-3">
                      <Badge config={platformConfig[publication.platform]} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge config={publicationStatusConfig[publication.status]} />
                    </td>
                    <td className="px-4 py-3 text-[#596A76]">{publication.clientValidationStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Drawer
        open={Boolean(selectedPublication)}
        title={selectedPublication?.title ?? ""}
        subtitle={selectedPublication ? `${selectedPublication.platform} · ${formatDate(selectedPublication.date)} à ${selectedPublication.time}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedPublication ? (
          <PublicationDetail
            publication={selectedPublication}
            clientName={getClientName(selectedPublication.clientId, clients)}
            onStatus={(status, message) => updateStatus(selectedPublication.id, status, message)}
          />
        ) : null}
      </Drawer>

      <Modal open={modalOpen} title="Nouvelle publication" subtitle="Brouillon éditorial local." onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createPublication}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" placeholder="Ex. Agenda sorties du week-end" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select name="clientId" defaultValue="">
                <option value="">J&apos;aime Besac</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tournage associé</Label>
              <Select name="shootingId" defaultValue="">
                <option value="">Aucun</option>
                {shootings.map((shooting) => (
                  <option key={shooting.id} value={shooting.id}>
                    {shooting.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Date</Label>
              <TextInput name="date" type="date" defaultValue={addDaysIso(2)} />
            </div>
            <div className="grid gap-2">
              <Label>Heure</Label>
              <TextInput name="time" type="time" defaultValue="12:00" />
            </div>
            <div className="grid gap-2">
              <Label>Plateforme</Label>
              <Select name="platform" defaultValue="Instagram">
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Texte</Label>
            <TextArea name="caption" placeholder="Caption, accroche, appel à l'action..." />
          </div>
          <div className="grid gap-2">
            <Label>Hashtags</Label>
            <TextInput name="hashtags" defaultValue="#besancon #jaimebesac" />
          </div>
          <div className="grid gap-2">
            <Label>Média</Label>
            <TextInput name="mediaUrl" placeholder="drive://..." />
          </div>
          <div className="grid gap-2">
            <Label>Notes internes</Label>
            <TextArea name="notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le brouillon</Button>
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
        <FileText className="h-5 w-5 text-[#5EADD3]" />
      </CardContent>
    </Card>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition",
        active
          ? "border-[#9FD8F3] bg-[#E7F5FA] text-[#18232B]"
          : "border-[#D8E5EC] bg-white text-[#596A76] hover:text-[#18232B]",
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function PublicationMiniCard({
  publication,
  clientName,
  onOpen,
}: {
  publication: Publication;
  clientName: string;
  onOpen: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border border-[#D8E5EC] bg-white p-3 text-left transition hover:border-[#9FD8F3] hover:bg-[#F4FBFD]"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-black text-[#18232B]">{publication.title}</p>
        <Badge config={platformConfig[publication.platform]} />
      </div>
      <p className="mt-2 text-xs font-bold text-[#596A76]">{clientName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge config={publicationStatusConfig[publication.status]} />
        <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
          {publication.time}
        </span>
      </div>
    </button>
  );
}

function PublicationDetail({
  publication,
  clientName,
  onStatus,
}: {
  publication: Publication;
  clientName: string;
  onStatus: (status: PublicationStatus, message: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge config={platformConfig[publication.platform]} />
        <Badge config={publicationStatusConfig[publication.status]} />
        <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
          Validation : {publication.clientValidationStatus}
        </span>
      </div>
      <Info label="Client" value={clientName} />
      <Info label="Tournage associé" value={publication.shootingId ?? "Aucun"} />
      <Info label="Date de publication" value={`${formatDate(publication.date)} · ${publication.time}`} />
      <Info label="Texte de publication" value={publication.caption || "À rédiger"} />
      <Info label="Hashtags" value={publication.hashtags.join(" ")} />
      <Info label="Média" value={publication.mediaUrl} />
      <Info label="Notes internes" value={publication.notes || "Aucune note"} />
      <div className="grid gap-2">
        <Button onClick={() => onStatus("approved", "Publication validée et sauvegardée.")}>
          <CheckCircle2 className="h-4 w-4" />
          Marquer comme validée
        </Button>
        <Button variant="secondary" onClick={() => onStatus("scheduled", "Publication programmée et sauvegardée.")}>
          <CalendarDays className="h-4 w-4" />
          Programmer
        </Button>
        <Button variant="secondary" onClick={() => onStatus("published", "Publication marquée publiée.")}>
          <Send className="h-4 w-4" />
          Marquer comme publiée
        </Button>
        <Button variant="danger" onClick={() => onStatus("to_edit", "Publication renvoyée en modification.")}>
          À modifier
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
