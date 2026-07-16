"use client";

import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Clapperboard, FilePlus2, LayoutGrid, List, Plus, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { platformConfig, priorityConfig, shootingStatusConfig } from "@/lib/constants";
import { addDaysIso, todayIso } from "@/lib/dates";
import { cn, formatDate, formatTimeRange, getClientName } from "@/lib/utils";
import type { Priority, Publication, PublicationPlatform, Shooting, ShootingStatus } from "@/types";

const shootingStages: ShootingStatus[] = [
  "idea",
  "to_confirm",
  "confirmed",
  "shot",
  "editing",
  "sent_to_client",
  "client_approved",
  "scheduled",
  "published",
  "archived",
];

type ViewMode = "cards" | "kanban";

export function ShootingsWorkspace() {
  const [shootings, setShootings] = useWorkspaceValue("shootings");
  const [, setPublications] = useWorkspaceValue("publications");
  const { data } = useWorkspace();
  const clients = data.clients;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShootingStatus>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("cards");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("Actions locales prêtes : tourné, montage, validation, publication.");

  const filteredShootings = useMemo(() => {
    const lowered = query.toLowerCase();
    return shootings.filter((shooting) => {
      const matchesQuery = `${shooting.title} ${shooting.location} ${shooting.objective} ${getClientName(shooting.clientId, clients)}`
        .toLowerCase()
        .includes(lowered);
      const matchesStatus = statusFilter === "all" || shooting.status === statusFilter;
      const matchesClient = clientFilter === "all" || shooting.clientId === clientFilter;
      return matchesQuery && matchesStatus && matchesClient;
    });
  }, [clientFilter, clients, query, shootings, statusFilter]);

  const selectedShooting = shootings.find((shooting) => shooting.id === selectedId) ?? null;

  function updateStatus(id: string, status: ShootingStatus, message: string) {
    setShootings((current) =>
      current.map((shooting) => (shooting.id === id ? { ...shooting, status, updatedAt: todayIso() } : shooting)),
    );
    setNotice(message);
  }

  function createShooting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newShooting: Shooting = {
      id: `shooting-local-${Date.now()}`,
      title: String(form.get("title") || "Nouveau tournage"),
      clientId: String(form.get("clientId") || ""),
      date: String(form.get("date") || addDaysIso(2)),
      startTime: String(form.get("startTime") || "10:00"),
      endTime: String(form.get("endTime") || "12:00"),
      location: String(form.get("location") || "Besançon"),
      contactName: String(form.get("contactName") || ""),
      contactPhone: String(form.get("contactPhone") || ""),
      creativeBrief: String(form.get("creativeBrief") || ""),
      objective: String(form.get("objective") || ""),
      platforms: [form.get("platform") as PublicationPlatform],
      equipment: String(form.get("equipment") || "iPhone, micro cravate")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: String(form.get("notes") || ""),
      status: "idea",
      priority: form.get("priority") as Priority,
      reminderIds: [],
      createdAt: todayIso(),
      updatedAt: todayIso(),
    };
    setShootings((current) => [newShooting, ...current]);
    setSelectedId(newShooting.id);
    setModalOpen(false);
  }

  function createPublicationFromShooting(shooting: Shooting) {
    const today = todayIso();
    const publication: Publication = {
      id: `publication-${crypto.randomUUID()}`,
      title: shooting.title,
      clientId: shooting.clientId || undefined,
      shootingId: shooting.id,
      date: addDaysIso(2, shooting.date),
      time: "12:00",
      platform: shooting.platforms[0] ?? "Instagram",
      caption: shooting.objective,
      hashtags: [],
      mediaUrl: "",
      status: "to_write",
      clientValidationStatus: "pending",
      notes: shooting.notes,
      createdAt: today,
      updatedAt: today,
    };
    setPublications((current) => [publication, ...current]);
    setShootings((current) => current.map((item) => item.id === shooting.id ? { ...item, publicationId: publication.id, status: "editing", updatedAt: today } : item));
    setNotice("Publication associée créée et sauvegardée.");
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">Production vidéo</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Suivi des tournages de l&apos;idée à la publication.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Briefs créatifs, contacts terrain, plateformes, matériel, validation client et actions de passage de statut.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer un tournage
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Confirmés" value={String(shootings.filter((item) => item.status === "confirmed").length)} />
        <Metric label="En montage" value={String(shootings.filter((item) => item.status === "editing").length)} />
        <Metric label="À valider" value={String(shootings.filter((item) => item.status === "sent_to_client").length)} />
        <Metric label="Publiés" value={String(shootings.filter((item) => item.status === "published").length)} />
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[1fr_190px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              placeholder="Rechercher brief, client, lieu..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | ShootingStatus)}
          >
            <option value="all">Tous les statuts</option>
            {shootingStages.map((status) => (
              <option key={status} value={status}>
                {shootingStatusConfig[status].label}
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
            <ViewButton active={view === "cards"} onClick={() => setView("cards")} icon={LayoutGrid} label="Cartes" />
            <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={List} label="Kanban" />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">{notice}</p>

      {view === "cards" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredShootings.map((shooting) => (
            <ShootingCard
              key={shooting.id}
              shooting={shooting}
              clientName={getClientName(shooting.clientId, clients)}
              onOpen={() => setSelectedId(shooting.id)}
            />
          ))}
        </section>
      ) : (
        <section className="premium-scrollbar grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
          {shootingStages.slice(0, 5).map((stage) => (
            <Card key={stage} className="min-w-[270px]">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge config={shootingStatusConfig[stage]} />
                  <span className="text-sm font-black text-[#18232B]">
                    {filteredShootings.filter((shooting) => shooting.status === stage).length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredShootings
                  .filter((shooting) => shooting.status === stage)
                  .map((shooting) => (
                    <button
                      key={shooting.id}
                      className="w-full rounded-lg border border-[#D8E5EC] bg-white p-3 text-left transition hover:border-[#9FD8F3]"
                      onClick={() => setSelectedId(shooting.id)}
                    >
                      <p className="font-black text-[#18232B]">{shooting.title}</p>
                      <p className="mt-1 text-xs font-bold text-[#596A76]">{getClientName(shooting.clientId, clients)}</p>
                      <p className="mt-2 text-sm text-[#596A76]">{formatDate(shooting.date)}</p>
                    </button>
                  ))}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Drawer
        open={Boolean(selectedShooting)}
        title={selectedShooting?.title ?? ""}
        subtitle={selectedShooting ? `${getClientName(selectedShooting.clientId, clients)} · ${formatDate(selectedShooting.date)}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedShooting ? (
          <ShootingDetail
            shooting={selectedShooting}
            onStatus={(status, message) => updateStatus(selectedShooting.id, status, message)}
            onCreatePublication={() => createPublicationFromShooting(selectedShooting)}
          />
        ) : null}
      </Drawer>

      <Modal open={modalOpen} title="Nouveau tournage" subtitle="Brief de production local." onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createShooting}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" placeholder="Ex. Reel lancement commerce" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label>Priorité</Label>
              <Select name="priority" defaultValue="medium">
                {(["low", "medium", "high", "urgent"] as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityConfig[priority].label}
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
              <Label>Début</Label>
              <TextInput name="startTime" type="time" defaultValue="10:00" />
            </div>
            <div className="grid gap-2">
              <Label>Fin</Label>
              <TextInput name="endTime" type="time" defaultValue="12:00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Lieu</Label>
            <TextInput name="location" placeholder="Adresse du tournage" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Contact sur place</Label>
              <TextInput name="contactName" />
            </div>
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <TextInput name="contactPhone" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Plateforme principale</Label>
            <Select name="platform" defaultValue="Instagram">
              {Object.keys(platformConfig).map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Brief créatif</Label>
            <TextArea name="creativeBrief" placeholder="Angle, ambiance, plans clés..." />
          </div>
          <div className="grid gap-2">
            <Label>Objectif</Label>
            <TextArea name="objective" placeholder="Réservation, notoriété, trafic magasin..." />
          </div>
          <div className="grid gap-2">
            <Label>Matériel</Label>
            <TextInput name="equipment" defaultValue="iPhone, micro cravate, stabilisateur" />
          </div>
          <div className="grid gap-2">
            <Label>Notes internes</Label>
            <TextArea name="notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer le tournage</Button>
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
        <Clapperboard className="h-5 w-5 text-[#5EADD3]" />
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
  icon: typeof LayoutGrid;
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

function ShootingCard({
  shooting,
  clientName,
  onOpen,
}: {
  shooting: Shooting;
  clientName: string;
  onOpen: () => void;
}) {
  const progress = Math.max(1, shootingStages.indexOf(shooting.status) + 1);
  return (
    <button
      className="rounded-lg border border-[#D8E5EC] bg-white p-4 text-left shadow-[0_10px_26px_rgba(24,35,43,0.04)] transition hover:-translate-y-0.5 hover:border-[#9FD8F3] hover:shadow-[0_18px_42px_rgba(24,35,43,0.08)]"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-[#18232B]">{shooting.title}</p>
          <p className="mt-1 text-sm text-[#596A76]">{clientName}</p>
        </div>
        <Badge config={shootingStatusConfig[shooting.status]} />
      </div>
      <p className="mt-3 text-sm text-[#596A76]">
        {formatDate(shooting.date)} · {formatTimeRange(shooting.startTime, shooting.endTime)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {shooting.platforms.map((platform) => (
          <Badge key={platform} config={platformConfig[platform]} />
        ))}
      </div>
      <div className="mt-4 h-2 rounded-full bg-[#F1F3F5]">
        <div
          className="h-2 rounded-full bg-[#5EADD3]"
          style={{ width: `${Math.min(100, (progress / shootingStages.length) * 100)}%` }}
        />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#596A76]">{shooting.objective}</p>
    </button>
  );
}

function ShootingDetail({
  shooting,
  onStatus,
  onCreatePublication,
}: {
  shooting: Shooting;
  onStatus: (status: ShootingStatus, message: string) => void;
  onCreatePublication: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge config={shootingStatusConfig[shooting.status]} />
        <Badge config={priorityConfig[shooting.priority]} />
        {shooting.platforms.map((platform) => (
          <Badge key={platform} config={platformConfig[platform]} />
        ))}
      </div>
      <div className="rounded-lg bg-[#FBFAF2] p-4">
        <p className="text-xs font-black uppercase text-[#596A76]">Timeline</p>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {shootingStages.slice(0, 5).map((stage) => {
            const active = shootingStages.indexOf(stage) <= shootingStages.indexOf(shooting.status);
            return (
              <div key={stage} className={cn("h-2 rounded-full", active ? "bg-[#5EADD3]" : "bg-[#D8E5EC]")} />
            );
          })}
        </div>
      </div>
      <Info label="Date et heure" value={`${formatDate(shooting.date)} · ${formatTimeRange(shooting.startTime, shooting.endTime)}`} />
      <Info label="Lieu" value={shooting.location} />
      <Info label="Contact sur place" value={`${shooting.contactName} · ${shooting.contactPhone}`} />
      <Info label="Brief créatif" value={shooting.creativeBrief} />
      <Info label="Objectif" value={shooting.objective} />
      <Info label="Matériel" value={shooting.equipment.join(", ")} />
      <Info label="Notes internes" value={shooting.notes} />

      <div className="grid gap-2">
        <Button onClick={() => onStatus("shot", "Tournage marqué comme tourné.")}>
          <CheckCircle2 className="h-4 w-4" />
          Marquer comme tourné
        </Button>
        <Button variant="secondary" onClick={() => onStatus("editing", "Tournage passé en montage.")}>
          <Clapperboard className="h-4 w-4" />
          Passer en montage
        </Button>
        <Button variant="secondary" onClick={() => onStatus("sent_to_client", "Validation client demandée.")}>
          <Send className="h-4 w-4" />
          Demander validation client
        </Button>
        <Button variant="secondary" onClick={onCreatePublication}>
          <FilePlus2 className="h-4 w-4" />
          Créer une publication associée
        </Button>
        <Button variant="danger" onClick={() => onStatus("archived", "Tournage archivé et sauvegardé.")}>
          <Archive className="h-4 w-4" />
          Archiver
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
