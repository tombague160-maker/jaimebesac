"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock3, MessageSquarePlus, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { channelLabels, priorityConfig, reminderStatusConfig, reminderTypeLabels } from "@/lib/constants";
import { addDaysIso, todayIso } from "@/lib/dates";
import { formatDate, getClientName } from "@/lib/utils";
import type { Priority, Reminder, ReminderChannel, ReminderStatus, ReminderType } from "@/types";

const today = todayIso();
const reminderTypes = Object.keys(reminderTypeLabels) as ReminderType[];
const channels = Object.keys(channelLabels) as ReminderChannel[];

export function RemindersWorkspace() {
  const [reminders, setReminders] = useWorkspaceValue("reminders");
  const { data } = useWorkspace();
  const clients = data.clients;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("Les changements de statut sont sauvegardés automatiquement.");

  const filteredReminders = useMemo(() => {
    const lowered = query.toLowerCase();
    return reminders.filter((reminder) =>
      `${reminder.title} ${reminder.notes} ${getClientName(reminder.clientId, clients)}`
        .toLowerCase()
        .includes(lowered),
    );
  }, [clients, query, reminders]);

  const grouped = {
    overdue: filteredReminders.filter((item) => item.status === "overdue"),
    today: filteredReminders.filter((item) => item.dueDate === today && item.status === "todo"),
    upcoming: filteredReminders.filter((item) => item.dueDate > today && ["todo", "postponed"].includes(item.status)),
    done: filteredReminders.filter((item) => item.status === "done"),
  };

  const selectedReminder = reminders.find((reminder) => reminder.id === selectedId) ?? null;

  function updateStatus(id: string, status: ReminderStatus, message: string) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              status,
              dueDate: status === "postponed" ? addDaysIso(7) : reminder.dueDate,
              history: [`${message} · ${formatDate(today)}`, ...reminder.history],
            }
          : reminder,
      ),
    );
    setNotice(message);
  }

  function createReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newReminder: Reminder = {
      id: `reminder-local-${Date.now()}`,
      title: String(form.get("title") || "Nouvelle relance"),
      clientId: String(form.get("clientId") || ""),
      relatedType: "client",
      relatedId: String(form.get("clientId") || ""),
      type: form.get("type") as ReminderType,
      dueDate: String(form.get("dueDate") || addDaysIso(3)),
      priority: form.get("priority") as Priority,
      channel: form.get("channel") as ReminderChannel,
      status: "todo",
      notes: String(form.get("notes") || ""),
      history: [`Relance créée le ${formatDate(today)}`],
    };
    setReminders((current) => [newReminder, ...current]);
    setSelectedId(newReminder.id);
    setModalOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">Relances</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Priorités commerciales et validations à ne pas manquer.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Prospects, clients, validations vidéo, paiements, devis, partenariats et renouvellements.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter une relance
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="En retard" value={String(grouped.overdue.length)} />
        <Metric label="Aujourd'hui" value={String(grouped.today.length)} />
        <Metric label="À venir" value={String(grouped.upcoming.length)} />
        <Metric label="Terminées" value={String(grouped.done.length)} />
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher client, type, note..."
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">{notice}</p>

      <section className="grid gap-4 xl:grid-cols-4">
        <ReminderColumn title="En retard" items={grouped.overdue} clients={clients} onOpen={setSelectedId} onDone={updateStatus} />
        <ReminderColumn title="Aujourd'hui" items={grouped.today} clients={clients} onOpen={setSelectedId} onDone={updateStatus} />
        <ReminderColumn title="À venir" items={grouped.upcoming} clients={clients} onOpen={setSelectedId} onDone={updateStatus} />
        <ReminderColumn title="Terminées" items={grouped.done} clients={clients} onOpen={setSelectedId} onDone={updateStatus} />
      </section>

      <Drawer
        open={Boolean(selectedReminder)}
        title={selectedReminder?.title ?? ""}
        subtitle={selectedReminder ? `${getClientName(selectedReminder.clientId, clients)} · ${formatDate(selectedReminder.dueDate)}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedReminder ? (
          <ReminderDetail
            reminder={selectedReminder}
            clientName={getClientName(selectedReminder.clientId, clients)}
            onStatus={(status, message) => updateStatus(selectedReminder.id, status, message)}
          />
        ) : null}
      </Drawer>

      <Modal open={modalOpen} title="Nouvelle relance" subtitle="Action commerciale ou validation à suivre." onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={createReminder}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" placeholder="Ex. Relancer validation reel" required />
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
              <Label>Type</Label>
              <Select name="type" defaultValue="prospect">
                {reminderTypes.map((type) => (
                  <option key={type} value={type}>
                    {reminderTypeLabels[type]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Date prévue</Label>
              <TextInput name="dueDate" type="date" defaultValue={addDaysIso(3)} />
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
            <div className="grid gap-2">
              <Label>Canal</Label>
              <Select name="channel" defaultValue="phone">
                {channels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channelLabels[channel]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Note</Label>
            <TextArea name="notes" placeholder="Contexte, prochaine phrase, objectif..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer la relance</Button>
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
        <Bell className="h-5 w-5 text-[#5EADD3]" />
      </CardContent>
    </Card>
  );
}

function ReminderColumn({
  title,
  items,
  clients,
  onOpen,
  onDone,
}: {
  title: string;
  items: Reminder[];
  clients: import("@/types").Client[];
  onOpen: (id: string) => void;
  onDone: (id: string, status: ReminderStatus, message: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <SectionHeading title={title} eyebrow={`${items.length} relances`} />
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((reminder) => (
            <div key={reminder.id} className="rounded-lg border border-[#D8E5EC] bg-white p-3">
              <button className="w-full text-left" onClick={() => onOpen(reminder.id)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-[#18232B]">{reminder.title}</p>
                  <Badge config={reminderStatusConfig[reminder.status]} />
                </div>
                <p className="mt-2 text-sm text-[#596A76]">{getClientName(reminder.clientId, clients)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge config={priorityConfig[reminder.priority]} />
                  <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
                    {channelLabels[reminder.channel]}
                  </span>
                </div>
              </button>
              {reminder.status !== "done" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onDone(reminder.id, "done", "Relance marquée comme faite.")}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Faite
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDone(reminder.id, "postponed", "Relance reportée.")}>
                    <Clock3 className="h-3.5 w-3.5" />
                    Reporter
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-6 text-center text-sm font-bold text-[#8697A2]">
            Rien dans cette section
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReminderDetail({
  reminder,
  clientName,
  onStatus,
}: {
  reminder: Reminder;
  clientName: string;
  onStatus: (status: ReminderStatus, message: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge config={reminderStatusConfig[reminder.status]} />
        <Badge config={priorityConfig[reminder.priority]} />
        <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
          {reminderTypeLabels[reminder.type]}
        </span>
        <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
          {channelLabels[reminder.channel]}
        </span>
      </div>
      <Info label="Client" value={clientName} />
      <Info label="Date prévue" value={formatDate(reminder.dueDate)} />
      <Info label="Note" value={reminder.notes || "Aucune note"} />
      <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
        <p className="text-xs font-black uppercase text-[#596A76]">Historique</p>
        <div className="mt-2 space-y-2">
          {reminder.history.map((entry) => (
            <p key={entry} className="text-sm font-bold text-[#18232B]">
              {entry}
            </p>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Button onClick={() => onStatus("done", "Relance marquée comme faite.")}>
          <CheckCircle2 className="h-4 w-4" />
          Marquer comme faite
        </Button>
        <Button variant="secondary" onClick={() => onStatus("postponed", "Relance reportée.")}>
          <Clock3 className="h-4 w-4" />
          Reporter
        </Button>
        <Button variant="secondary" onClick={() => onStatus("todo", "Note ajoutée à l'historique.")}>
          <MessageSquarePlus className="h-4 w-4" />
          Ajouter une note après relance
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
