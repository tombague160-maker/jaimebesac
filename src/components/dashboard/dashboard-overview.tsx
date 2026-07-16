"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  FileText,
  Lightbulb,
  Newspaper,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace } from "@/components/workspace-provider";
import {
  clientStatusConfig,
  eventTypeConfig,
  newsStatusConfig,
  platformConfig,
  priorityConfig,
  publicationStatusConfig,
  reminderStatusConfig,
  shootingStatusConfig,
} from "@/lib/constants";
import { todayIso } from "@/lib/dates";
import { formatCurrency, formatDate, getClientName } from "@/lib/utils";
import type { WorkspaceData } from "@/types";

const today = todayIso();

function getStatCards(data: WorkspaceData) {
  const { clients, contentIdeas, newsItems, publications, reminders, shootings } = data;
  return [
  {
    label: "Tournages ce mois-ci",
    value: shootings.length,
    icon: Clapperboard,
    helper: "dont 3 à forte priorité",
  },
  {
    label: "Publications programmées",
    value: publications.filter((item) => ["scheduled", "approved"].includes(item.status)).length,
    icon: FileText,
    helper: "sur les 10 prochains jours",
  },
  {
    label: "Clients actifs",
    value: clients.filter((client) => client.status === "active").length,
    icon: Users,
    helper: formatCurrency(clients.reduce((sum, client) => sum + client.actualRevenue, 0)),
  },
  {
    label: "Prospects à relancer",
    value: clients.filter((client) => ["to_follow_up", "proposal_sent"].includes(client.status)).length,
    icon: Bell,
    helper: "priorisés par date",
  },
  {
    label: "Relances en retard",
    value: reminders.filter((reminder) => reminder.status === "overdue").length,
    icon: CalendarClock,
    helper: "à traiter aujourd'hui",
  },
  {
    label: "Actus détectées",
    value: newsItems.filter((item) => item.publishedAt === today).length,
    icon: Newspaper,
    helper: "veille éditoriale",
  },
  {
    label: "Validations en attente",
    value: publications.filter((item) => item.clientValidationStatus === "pending").length,
    icon: CheckCircle2,
    helper: "client ou média",
  },
  {
    label: "Idées prêtes",
    value: contentIdeas.filter((idea) => ["validated", "planned"].includes(idea.status)).length,
    icon: Lightbulb,
    helper: "transformables en production",
  },
  ];
}

export function DashboardOverview() {
  const { data } = useWorkspace();
  const { calendarEvents, clients, newsItems, publications, reminders, shootings } = data;
  const statCards = getStatCards(data);
  const todayEvents = calendarEvents.filter((event) => event.date === today);
  const nextShootings = [...shootings].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const upcomingPublications = [...publications].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const urgentReminders = reminders.filter((reminder) => ["overdue", "todo"].includes(reminder.status)).slice(0, 4);
  const importantNews = [...newsItems]
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#9FD8F3] bg-[#E7F5FA] px-3 py-1 text-xs font-black text-[#18232B]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Studio opérationnel · activité du jour
                </div>
                <h1 className="text-3xl font-black text-[#18232B] sm:text-4xl">
                  Piloter J&apos;aime Besac comme un média local premium.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#596A76] sm:text-base">
                  Planning, tournages, publications, clients, relances et veille éditoriale réunis dans un
                  cockpit pensé pour décider vite et produire mieux.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Ajouter un client", "/clients"],
                  ["Planifier un tournage", "/shootings"],
                  ["Créer une publication", "/publications"],
                  ["Ajouter une actu", "/news"],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="inline-flex min-h-10 min-w-0 items-center justify-start gap-2 rounded-lg border border-[#9FD8F3] bg-[#E7F5FA] px-3 py-2 text-sm font-semibold leading-5 text-[#18232B] transition hover:bg-[#D7EDF7]"
                  >
                    <Plus className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm font-black text-[#18232B]">Pipeline commercial rapide</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {["prospect", "proposal_sent", "active", "to_follow_up"].map((status) => {
              const config = clientStatusConfig[status as keyof typeof clientStatusConfig];
              const count = clients.filter((client) => client.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between rounded-lg bg-[#FBFAF2] p-3">
                  <Badge config={config} />
                  <span className="text-lg font-black text-[#18232B]">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
            >
              <Card>
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#596A76]">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black text-[#18232B]">{stat.value}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#596A76]">{stat.helper}</p>
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E7F5FA] text-[#18232B]">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <SectionHeading title="Planning du jour" eyebrow={formatDate(today)} />
          </CardHeader>
          <CardContent className="space-y-3">
            {todayEvents.length ? (
              todayEvents.map((event) => (
                <div key={event.id} className="flex gap-3 rounded-lg border border-[#D8E5EC] bg-white p-3">
                  <div className="w-16 shrink-0 text-sm font-black text-[#18232B]">{event.startTime}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#18232B]">{event.title}</p>
                      <Badge config={eventTypeConfig[event.type]} />
                    </div>
                    <p className="mt-1 text-sm text-[#596A76]">{event.location}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-6 text-center text-sm font-bold text-[#596A76]">
                Aucun événement prévu aujourd&apos;hui.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Relances urgentes" eyebrow="Priorité commerciale" />
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentReminders.length ? urgentReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-lg border border-[#D8E5EC] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-[#18232B]">{reminder.title}</p>
                    <p className="mt-1 text-sm text-[#596A76]">{getClientName(reminder.clientId, clients)}</p>
                  </div>
                  <Badge config={reminderStatusConfig[reminder.status]} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge config={priorityConfig[reminder.priority]} />
                  <span className="rounded-full bg-[#FBFAF2] px-2.5 py-1 text-xs font-bold text-[#596A76]">
                    {formatDate(reminder.dueDate)}
                  </span>
                </div>
              </div>
            )) : <EmptyMessage>Aucune relance urgente.</EmptyMessage>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <SectionHeading title="Prochains tournages" />
          </CardHeader>
          <CardContent className="space-y-3">
            {nextShootings.length ? nextShootings.map((shooting) => (
              <div key={shooting.id} className="rounded-lg bg-[#FBFAF2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-[#18232B]">{shooting.title}</p>
                  <Badge config={shootingStatusConfig[shooting.status]} />
                </div>
                <p className="mt-2 text-sm text-[#596A76]">
                  {getClientName(shooting.clientId, clients)} · {formatDate(shooting.date)} · {shooting.startTime}
                </p>
              </div>
            )) : <EmptyMessage>Aucun tournage planifié.</EmptyMessage>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Publications à venir" />
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingPublications.length ? upcomingPublications.map((publication) => (
              <div key={publication.id} className="rounded-lg bg-[#FBFAF2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-[#18232B]">{publication.title}</p>
                  <Badge config={platformConfig[publication.platform]} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge config={publicationStatusConfig[publication.status]} />
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#596A76]">
                    {formatDate(publication.date)} · {publication.time}
                  </span>
                </div>
              </div>
            )) : <EmptyMessage>Aucune publication programmée.</EmptyMessage>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Actualités importantes" />
          </CardHeader>
          <CardContent className="space-y-3">
            {importantNews.length ? importantNews.map((item) => (
              <div key={item.id} className="rounded-lg bg-[#FBFAF2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-[#18232B]">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#18232B]">
                    {item.importanceScore}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[#596A76]">{item.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge config={newsStatusConfig[item.status]} />
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#596A76]">
                    {item.sourceName}
                  </span>
                </div>
              </div>
            )) : <EmptyMessage>Aucune actualité enregistrée.</EmptyMessage>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-5 text-center text-sm font-bold text-[#596A76]">
      {children}
    </p>
  );
}
