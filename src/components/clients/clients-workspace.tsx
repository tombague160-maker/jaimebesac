"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarPlus, FileText, LayoutGrid, List, Plus, Search, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { clientStatusConfig, priorityConfig } from "@/lib/constants";
import { addDaysIso, todayIso } from "@/lib/dates";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Client, ClientStatus, Priority } from "@/types";

const clientStages: ClientStatus[] = [
  "prospect",
  "contacted",
  "meeting_scheduled",
  "proposal_sent",
  "active",
  "to_follow_up",
  "partner",
  "former",
  "lost",
];

type ViewMode = "cards" | "pipeline" | "table";

export function ClientsWorkspace() {
  const [clients, setClients] = useWorkspaceValue("clients");
  const { data, isLoading } = useWorkspace();
  const { publications, reminders, shootings } = data;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [view, setView] = useState<ViewMode>("cards");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("Chaque modification du CRM est sauvegardee automatiquement.");

  const filteredClients = useMemo(() => {
    const lowered = query.toLowerCase();
    return clients.filter((client) => {
      const matchesQuery = `${client.name} ${client.sector} ${client.contactName} ${client.city}`
        .toLowerCase()
        .includes(lowered);
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, statusFilter]);

  const selectedClient = clients.find((client) => client.id === selectedId) ?? null;

  function updateClientStatus(clientId: string, status: ClientStatus) {
    const today = todayIso();

    setClients((current) =>
      current.map((client) =>
        client.id === clientId ? { ...client, status, updatedAt: today } : client,
      ),
    );

    setNotice("Statut client sauvegarde.");
  }

  function createClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "Nouveau client");
    const today = todayIso();
    const newClient: Client = {
      id: `client-local-${Date.now()}`,
      name,
      logo: name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(""),
      sector: String(form.get("sector") || "Commerce local"),
      address: String(form.get("address") || "Adresse à compléter"),
      city: "Besançon",
      contactName: String(form.get("contactName") || "Contact à compléter"),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      instagram: String(form.get("instagram") || ""),
      facebook: "",
      tiktok: "",
      linkedin: "",
      website: "",
      status: form.get("status") as ClientStatus,
      priority: form.get("priority") as Priority,
      estimatedRevenue: Number(form.get("estimatedRevenue") || 0),
      actualRevenue: 0,
      lastContactDate: today,
      nextFollowUpDate: String(form.get("nextFollowUpDate") || addDaysIso(7)),
      notes: String(form.get("notes") || ""),
      createdAt: today,
      updatedAt: today,
    };

    setClients((current) => [newClient, ...current]);
    setSelectedId(newClient.id);
    setNotice("Client cree et sauvegarde.");
    formElement.reset();
    setModalOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">CRM local</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Clients, prospects et partenaires.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Fiches complètes, pipeline commercial, relances et liens directs vers tournages et publications.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="CA réalisé" value={formatCurrency(clients.reduce((sum, client) => sum + client.actualRevenue, 0))} />
        <Metric label="CA estimé" value={formatCurrency(clients.reduce((sum, client) => sum + client.estimatedRevenue, 0))} />
        <Metric label="Clients actifs" value={String(clients.filter((client) => client.status === "active").length)} />
        <Metric label="À relancer" value={String(clients.filter((client) => client.status === "to_follow_up").length)} />
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              placeholder="Rechercher entreprise, secteur, contact..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | ClientStatus)}
          >
            <option value="all">Tous les statuts</option>
            {clientStages.map((status) => (
              <option key={status} value={status}>
                {clientStatusConfig[status].label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <ViewButton active={view === "cards"} onClick={() => setView("cards")} icon={LayoutGrid} label="Cartes" />
            <ViewButton active={view === "pipeline"} onClick={() => setView("pipeline")} icon={List} label="Pipeline" />
            <ViewButton active={view === "table"} onClick={() => setView("table")} icon={Table2} label="Table" />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">
        {isLoading ? "Chargement des donnees persistantes..." : notice}
      </p>

      {view === "cards" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} onOpen={() => setSelectedId(client.id)} />
          ))}
        </section>
      ) : null}

      {view === "pipeline" ? (
        <section className="premium-scrollbar grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
          {clientStages.slice(0, 5).map((stage) => (
            <Card key={stage} className="min-w-[260px]">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge config={clientStatusConfig[stage]} />
                  <span className="text-sm font-black text-[#18232B]">
                    {filteredClients.filter((client) => client.status === stage).length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredClients
                  .filter((client) => client.status === stage)
                  .map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedId(client.id)}
                      className="w-full rounded-lg border border-[#D8E5EC] bg-white p-3 text-left transition hover:border-[#9FD8F3]"
                    >
                      <p className="font-black text-[#18232B]">{client.name}</p>
                      <p className="mt-1 text-xs font-bold text-[#596A76]">{client.sector}</p>
                      <p className="mt-2 text-sm text-[#596A76]">{formatCurrency(client.estimatedRevenue)}</p>
                    </button>
                  ))}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {view === "table" ? (
        <Card className="overflow-hidden">
          <div className="premium-scrollbar overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#FBFAF2] text-xs font-black uppercase text-[#596A76]">
                <tr>
                  <th className="px-4 py-3">Entreprise</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Priorité</th>
                  <th className="px-4 py-3">Prochaine relance</th>
                  <th className="px-4 py-3">CA réalisé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E5EC] bg-white">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="cursor-pointer hover:bg-[#F4FBFD]" onClick={() => setSelectedId(client.id)}>
                    <td className="px-4 py-3 font-black text-[#18232B]">{client.name}</td>
                    <td className="px-4 py-3 text-[#596A76]">{client.contactName}</td>
                    <td className="px-4 py-3">
                      <Badge config={clientStatusConfig[client.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge config={priorityConfig[client.priority]} />
                    </td>
                    <td className="px-4 py-3 text-[#596A76]">{formatDate(client.nextFollowUpDate)}</td>
                    <td className="px-4 py-3 font-bold text-[#18232B]">{formatCurrency(client.actualRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Drawer
        open={Boolean(selectedClient)}
        title={selectedClient?.name ?? ""}
        subtitle={selectedClient ? `${selectedClient.sector} · ${selectedClient.city}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedClient ? (
          <ClientDetail
            client={selectedClient}
            linkedShootings={shootings.filter((shooting) => shooting.clientId === selectedClient.id).map((item) => item.title)}
            linkedPublications={publications.filter((publication) => publication.clientId === selectedClient.id).map((item) => item.title)}
            linkedReminders={reminders.filter((reminder) => reminder.clientId === selectedClient.id).map((item) => item.title)}
            onStatusChange={(status) => updateClientStatus(selectedClient.id, status)}
          />
        ) : null}
      </Drawer>

      <Modal open={modalOpen} title="Nouveau client" subtitle="Fiche CRM prête à enrichir." onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createClient}>
          <div className="grid gap-2">
            <Label>Entreprise</Label>
            <TextInput name="name" placeholder="Ex. Boulangerie Battant" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Secteur</Label>
              <TextInput name="sector" placeholder="Restaurant, commerce, association..." />
            </div>
            <div className="grid gap-2">
              <Label>Contact principal</Label>
              <TextInput name="contactName" placeholder="Nom du contact" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <TextInput name="phone" placeholder="06 ..." />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <TextInput name="email" type="email" placeholder="contact@..." />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select name="status" defaultValue="prospect">
                {clientStages.map((status) => (
                  <option key={status} value={status}>
                    {clientStatusConfig[status].label}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>CA estimé</Label>
              <TextInput name="estimatedRevenue" type="number" defaultValue="1200" />
            </div>
            <div className="grid gap-2">
              <Label>Prochaine relance</Label>
              <TextInput name="nextFollowUpDate" type="date" defaultValue={addDaysIso(7)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Instagram</Label>
            <TextInput name="instagram" placeholder="@..." />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <TextArea name="notes" placeholder="Contexte, besoin, offre envisagée..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer la fiche</Button>
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
        <Building2 className="h-5 w-5 text-[#5EADD3]" />
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

function ClientCard({ client, onOpen }: { client: Client; onOpen: () => void }) {
  return (
    <button
      className="group rounded-lg border border-[#D8E5EC] bg-white p-4 text-left shadow-[0_10px_26px_rgba(24,35,43,0.04)] transition hover:-translate-y-0.5 hover:border-[#9FD8F3] hover:shadow-[0_18px_42px_rgba(24,35,43,0.08)]"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#E7F5FA] text-sm font-black text-[#18232B]">
            {client.logo}
          </div>
          <div className="min-w-0">
            <p className="truncate font-black text-[#18232B]">{client.name}</p>
            <p className="mt-1 truncate text-sm text-[#596A76]">{client.sector}</p>
          </div>
        </div>
        <Badge config={priorityConfig[client.priority]} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge config={clientStatusConfig[client.status]} />
        <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
          {formatDate(client.nextFollowUpDate)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[#FBFAF2] p-3">
          <p className="text-xs font-bold text-[#596A76]">CA réalisé</p>
          <p className="mt-1 font-black text-[#18232B]">{formatCurrency(client.actualRevenue)}</p>
        </div>
        <div className="rounded-lg bg-[#FBFAF2] p-3">
          <p className="text-xs font-bold text-[#596A76]">Potentiel</p>
          <p className="mt-1 font-black text-[#18232B]">{formatCurrency(client.estimatedRevenue)}</p>
        </div>
      </div>
    </button>
  );
}

function ClientDetail({
  client,
  linkedShootings,
  linkedPublications,
  linkedReminders,
  onStatusChange,
}: {
  client: Client;
  linkedShootings: string[];
  linkedPublications: string[];
  linkedReminders: string[];
  onStatusChange: (status: ClientStatus) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-[#FBFAF2] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#E7F5FA] text-lg font-black text-[#18232B]">
            {client.logo}
          </div>
          <div>
            <Badge config={clientStatusConfig[client.status]} />
            <p className="mt-2 text-sm text-[#596A76]">{client.notes}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <Info label="Contact" value={client.contactName} />
        <Info label="Téléphone" value={client.phone || "À compléter"} />
        <Info label="Email" value={client.email || "À compléter"} />
        <Info label="Adresse" value={`${client.address}, ${client.city}`} />
        <Info label="Réseaux" value={[client.instagram, client.facebook, client.tiktok, client.linkedin].filter(Boolean).join(" · ") || "À compléter"} />
        <Info label="Dernier contact" value={formatDate(client.lastContactDate)} />
        <Info label="Prochaine relance" value={formatDate(client.nextFollowUpDate)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Info label="CA estimé" value={formatCurrency(client.estimatedRevenue)} />
        <Info label="CA réalisé" value={formatCurrency(client.actualRevenue)} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black uppercase text-[#596A76]">Changer le statut</p>
        <div className="grid gap-2">
          {clientStages.slice(0, 6).map((status) => (
            <button
              key={status}
              className="rounded-lg border border-[#D8E5EC] bg-white p-3 text-left transition hover:border-[#9FD8F3]"
              onClick={() => onStatusChange(status)}
            >
              <Badge config={clientStatusConfig[status]} />
            </button>
          ))}
        </div>
      </div>

      <SectionHeading title="Activité liée" />
      <div className="grid gap-3">
        <LinkedList icon={CalendarPlus} title="Tournages" items={linkedShootings} />
        <LinkedList icon={FileText} title="Publications" items={linkedPublications} />
        <LinkedList icon={Plus} title="Relances" items={linkedReminders} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <p className="text-xs font-black uppercase text-[#596A76]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#18232B]">{value}</p>
    </div>
  );
}

function LinkedList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof CalendarPlus;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <div className="flex items-center gap-2 text-sm font-black text-[#18232B]">
        <Icon className="h-4 w-4 text-[#5EADD3]" />
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {items.length ? (
          items.map((item) => (
            <p key={item} className="text-sm text-[#596A76]">
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#8697A2]">Aucun élément lié</p>
        )}
      </div>
    </div>
  );
}
