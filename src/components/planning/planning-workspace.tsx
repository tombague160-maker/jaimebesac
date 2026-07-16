"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { eventTypeConfig, priorityConfig } from "@/lib/constants";
import { todayIso } from "@/lib/dates";
import { getCalendarEventColor } from "@/lib/theme";
import { cn, formatDate, formatTimeRange, getClientName } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType, Priority } from "@/types";

const PlanningCalendar = dynamic(() => import("@/components/planning/planning-calendar"), {
  ssr: false,
});

const eventTypeOptions = Object.keys(eventTypeConfig) as CalendarEventType[];
const priorityOptions: Priority[] = ["low", "medium", "high", "urgent"];

export function PlanningWorkspace() {
  const [events, setEvents] = useWorkspaceValue("calendarEvents");
  const { data } = useWorkspace();
  const clients = data.clients;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CalendarEventType>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [notice, setNotice] = useState("Glissez un événement pour modifier sa date dans le planning.");

  const filteredEvents = useMemo(() => {
    const lowered = query.toLowerCase();
    return events.filter((event) => {
      const matchesQuery = `${event.title} ${event.location} ${event.description} ${getClientName(event.clientId, clients)}`
        .toLowerCase()
        .includes(lowered);
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      const matchesClient = clientFilter === "all" || event.clientId === clientFilter;
      return matchesQuery && matchesType && matchesClient;
    });
  }, [clientFilter, clients, events, query, typeFilter]);

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;

  function markDone(eventId: string) {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId ? { ...event, status: "done", color: getCalendarEventColor(event.type, "done") } : event,
      ),
    );
    setNotice("Événement terminé et sauvegardé.");
  }

  function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = form.get("type") as CalendarEventType;
    const priority = form.get("priority") as Priority;
    const newEvent: CalendarEvent = {
      id: `event-local-${Date.now()}`,
      title: String(form.get("title") || "Nouvel événement"),
      type,
      clientId: String(form.get("clientId") || "") || undefined,
      date: String(form.get("date") || selectedDate),
      startTime: String(form.get("startTime") || "09:00"),
      endTime: String(form.get("endTime") || "10:00"),
      location: String(form.get("location") || "À préciser"),
      description: String(form.get("description") || ""),
      status: "to_plan",
      priority,
      color: getCalendarEventColor(type),
      notes: String(form.get("notes") || ""),
    };
    setEvents((current) => [newEvent, ...current]);
    setSelectedId(newEvent.id);
    setModalOpen(false);
    setNotice("Événement créé et sauvegardé dans le planning.");
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase text-[#5EADD3]">Planning interactif</p>
              <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
                Production, rendez-vous, publications et relances.
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
                Vue mois, semaine, jour et liste avec filtres métier, panneau latéral et édition locale.
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedDate(todayIso());
                setModalOpen(true);
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Créer un événement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596A76]" />
            <TextInput
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un titre, lieu, client..."
            />
          </div>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | CalendarEventType)}>
            <option value="all">Tous les types</option>
            {eventTypeOptions.map((type) => (
              <option key={type} value={type}>
                {eventTypeConfig[type].label}
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
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <SectionHeading title="Calendrier opérationnel" eyebrow={`${filteredEvents.length} événements visibles`} />
          </CardHeader>
          <CardContent>
            <PlanningCalendar
              events={filteredEvents}
              initialDate={selectedDate}
              onEventClick={(eventId) => setSelectedId(eventId)}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setModalOpen(true);
              }}
              onEventChange={(eventId, patch) => {
                setEvents((current) =>
                  current.map((event) => (event.id === eventId ? { ...event, ...patch } : event)),
                );
                setNotice(`Créneau mis à jour : ${formatDate(patch.date)} · ${formatTimeRange(patch.startTime, patch.endTime)}.`);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Liste rapide" eyebrow={notice} />
          </CardHeader>
          <CardContent className="premium-scrollbar max-h-[720px] space-y-3 overflow-y-auto">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition",
                  selectedId === event.id
                    ? "border-[#5EADD3] bg-[#E7F5FA]"
                    : "border-[#D8E5EC] bg-white hover:border-[#9FD8F3] hover:bg-[#F4FBFD]",
                )}
                onClick={() => setSelectedId(event.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-[#18232B]">{event.title}</p>
                  <Badge config={eventTypeConfig[event.type]} />
                </div>
                <p className="mt-2 text-sm text-[#596A76]">
                  {formatDate(event.date)} · {formatTimeRange(event.startTime, event.endTime)}
                </p>
                <p className="mt-1 text-xs font-bold text-[#596A76]">{getClientName(event.clientId, clients)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Drawer
        open={Boolean(selectedEvent)}
        title={selectedEvent?.title ?? ""}
        subtitle={selectedEvent ? `${formatDate(selectedEvent.date)} · ${selectedEvent.location}` : undefined}
        onClose={() => setSelectedId(null)}
      >
        {selectedEvent ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge config={eventTypeConfig[selectedEvent.type]} />
              <Badge config={priorityConfig[selectedEvent.priority]} />
              <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
                {formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}
              </span>
            </div>
            <div className="rounded-lg bg-[#FBFAF2] p-4">
              <p className="text-xs font-black uppercase text-[#596A76]">Description</p>
              <p className="mt-2 text-sm leading-6 text-[#18232B]">{selectedEvent.description}</p>
            </div>
            <div className="grid gap-3 text-sm">
              <Info label="Client" value={getClientName(selectedEvent.clientId, clients)} />
              <Info label="Lieu" value={selectedEvent.location} />
              <Info label="Contact" value={selectedEvent.contact ?? "À compléter"} />
              <Info label="Téléphone" value={selectedEvent.phone ?? "À compléter"} />
              <Info label="Plateformes" value={selectedEvent.platforms?.join(", ") ?? "Non défini"} />
              <Info label="Notes internes" value={selectedEvent.notes ?? "Aucune note"} />
            </div>
            <div className="grid gap-2">
              <Button onClick={() => markDone(selectedEvent.id)}>
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme terminé
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={modalOpen}
        title="Nouvel événement"
        subtitle="Création rapide dans le planning."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={createEvent}>
          <div className="grid gap-2">
            <Label>Titre</Label>
            <TextInput name="title" placeholder="Ex. Tournage restaurant" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select name="type" defaultValue="shooting">
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {eventTypeConfig[type].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priorité</Label>
              <Select name="priority" defaultValue="medium">
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityConfig[priority].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Date</Label>
              <TextInput name="date" type="date" defaultValue={selectedDate} />
            </div>
            <div className="grid gap-2">
              <Label>Début</Label>
              <TextInput name="startTime" type="time" defaultValue="09:00" />
            </div>
            <div className="grid gap-2">
              <Label>Fin</Label>
              <TextInput name="endTime" type="time" defaultValue="10:00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Lieu</Label>
            <TextInput name="location" placeholder="Adresse, plateforme ou lieu" />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <TextArea name="description" placeholder="Objectif, contexte, éléments utiles..." />
          </div>
          <div className="grid gap-2">
            <Label>Notes internes</Label>
            <TextArea name="notes" placeholder="Matériel, angles, contraintes..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter au planning</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <p className="text-xs font-black uppercase text-[#596A76]">{label}</p>
      <p className="mt-1 font-bold text-[#18232B]">{value}</p>
    </div>
  );
}
