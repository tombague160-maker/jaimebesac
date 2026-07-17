"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Euro, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace } from "@/components/workspace-provider";
import { clientStatusConfig } from "@/lib/constants";
import { todayIso } from "@/lib/dates";
import { countOverdue } from "@/lib/reminders";
import { brandColors, chartPalette, pastelColors } from "@/lib/theme";
import { formatCurrency } from "@/lib/utils";
import { Metric } from "@/components/ui/metric";

const chartTooltipStyle = {
  borderRadius: 8,
  border: `1px solid ${brandColors.line}`,
  boxShadow: "0 14px 36px rgba(24, 35, 43, 0.1)",
};

export function StatisticsWorkspace() {
  const { data } = useWorkspace();
  const { clients, newsItems, publications, reminders, serviceOffers, shootings } = data;
  const [period, setPeriod] = useState("6m");
  const [mounted, setMounted] = useState(false);
  const monthsCount = period === "30d" ? 1 : period === "3m" ? 3 : period === "year" ? 12 : 6;
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: monthsCount }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - index - 1), 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(monthDate),
        tournages: shootings.filter((item) => item.date.startsWith(key)).length,
        publications: publications.filter((item) => item.date.startsWith(key)).length,
        relances: reminders.filter((item) => item.dueDate.startsWith(key)).length,
        revenue: clients
          .filter((client) => (client.createdAt || client.updatedAt).startsWith(key))
          .reduce((sum, client) => sum + client.actualRevenue, 0),
      };
    });
  }, [clients, monthsCount, publications, reminders, shootings]);
  const platformDistribution = useMemo(
    () =>
      Object.entries(
        publications.reduce<Record<string, number>>((totals, publication) => {
          totals[publication.platform] = (totals[publication.platform] ?? 0) + 1;
          return totals;
        }, {}),
      ).map(([name, value]) => ({ name, value })),
    [publications],
  );
  const totalOfferValue = serviceOffers.reduce((sum, offer) => sum + offer.price, 0);
  const serviceDistribution = serviceOffers.map((offer) => ({
    name: offer.name,
    value: totalOfferValue ? Math.round((offer.price / totalOfferValue) * 100) : 0,
  }));
  const validatedPublications = publications.filter((item) => ["approved", "scheduled", "published"].includes(item.status)).length;
  const validationRate = publications.length ? Math.round((validatedPublications / publications.length) * 100) : 0;
  const clientStatusData = Object.keys(clientStatusConfig).map((status) => ({
    status: clientStatusConfig[status as keyof typeof clientStatusConfig].label,
    count: clients.filter((client) => client.status === status).length,
  }));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-eyebrow">Statistiques</p>
            <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
              Vision claire de l&apos;activité média et commerciale.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Tournages, publications, relances, chiffre d&apos;affaires, plateformes et veille éditoriale.
            </p>
          </div>
          <div className="w-full sm:w-[220px]">
            <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="30d">Ce mois-ci</option>
              <option value="3m">3 mois</option>
              <option value="6m">6 mois</option>
              <option value="year">Année</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Clients actifs" value={String(clients.filter((client) => client.status === "active").length)} />
        <Metric icon={CalendarDays} label="Tournages" value={String(shootings.length)} />
        <Metric icon={FileText} label="Publications" value={String(publications.length)} />
        <Metric icon={Euro} label="CA réalisé" value={formatCurrency(clients.reduce((sum, client) => sum + client.actualRevenue, 0))} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <SectionHeading title="Évolution de l'activité" eyebrow={`Période ${period}`} />
          </CardHeader>
          <CardContent className="h-[340px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivity}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandColors.blue} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={brandColors.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={brandColors.line} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="publications" stroke={brandColors.blue} fill="url(#activityFill)" strokeWidth={3} />
                  <Line type="monotone" dataKey="tournages" stroke={pastelColors.orangeText} strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Plateformes utilisées" />
          </CardHeader>
          <CardContent className="h-[340px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={4}>
                    {platformDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <SectionHeading title="CA estimé mensuel" />
          </CardHeader>
          <CardContent className="h-[280px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyActivity}>
                  <CartesianGrid stroke={brandColors.line} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {monthlyActivity.map((entry, index) => (
                      <Cell key={entry.month} fill={chartPalette[(index + 1) % chartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Types de prestations" />
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceDistribution.map((item, index) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-ink">{item.name}</span>
                  <span className="text-muted">{item.value}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-track">
                  <div className="h-2 rounded-full" style={{ width: `${item.value}%`, backgroundColor: chartPalette[index % chartPalette.length] }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Signal éditorial" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Insight label="Sources d'actualité utiles" value={String(new Set(newsItems.map((item) => item.sourceName)).size)} />
            <Insight label="Catégories fréquentes" value={String(new Set(newsItems.map((item) => item.category)).size)} />
            <Insight label="Relances effectuées" value={String(reminders.filter((item) => item.status === "done").length)} />
            <Insight label="Relances en retard" value={String(countOverdue(reminders, todayIso()))} />
            <Insight
              label="Taux validation publications"
              value={`${validationRate}%`}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <SectionHeading title="Répartition par statut client" />
        </CardHeader>
        <CardContent className="h-[300px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientStatusData.filter((item) => item.count > 0)}>
                <CartesianGrid stroke={brandColors.line} strokeDasharray="3 3" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} interval={0} height={80} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {clientStatusData.filter((item) => item.count > 0).map((item, index) => (
                    <Cell key={item.status} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartPlaceholder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


function ChartPlaceholder() {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed border-line-strong bg-surface text-sm font-bold text-muted-soft">
      Chargement du graphique
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface p-3">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="text-lg font-black text-ink">{value}</p>
    </div>
  );
}
