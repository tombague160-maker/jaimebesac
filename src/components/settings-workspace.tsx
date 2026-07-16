"use client";

import { useState } from "react";
import Image from "next/image";
import { Database, Download, Palette, Plus, Rss, Settings, ShieldCheck, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label, Select, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWorkspace, useWorkspaceValue } from "@/components/workspace-provider";
import { eventTypeConfig, newsCategories } from "@/lib/constants";
import { brandColors, chartPalette, pastelColors } from "@/lib/theme";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { NewsSource, NewsSourceType, ServiceOffer } from "@/types";

const integrations = [
  { name: "Sauvegarde automatique", status: "Active", icon: Database },
  { name: "Synchronisation RSS", status: "Active pour les sources configurées", icon: Rss },
];

export function SettingsWorkspace() {
  const { data } = useWorkspace();
  const [settings, setSettings] = useWorkspaceValue("settings");
  const [newsSources, setNewsSources] = useWorkspaceValue("newsSources");
  const [serviceOffers, setServiceOffers] = useWorkspaceValue("serviceOffers");
  const [notice, setNotice] = useState("Chaque réglage est sauvegardé automatiquement.");
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "source" | "offer"; id: string; name: string } | null
  >(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "source") {
      setNewsSources((current) => current.filter((item) => item.id !== pendingDelete.id));
      setNotice("Source supprimée.");
    } else {
      setServiceOffers((current) => current.filter((item) => item.id !== pendingDelete.id));
      setNotice("Prestation supprimée.");
    }
    setPendingDelete(null);
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jaime-besac-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Export JSON téléchargé.");
  }

  function createSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source: NewsSource = {
      id: `source-${crypto.randomUUID()}`,
      name: String(form.get("name") || "Nouvelle source"),
      type: form.get("type") as NewsSourceType,
      url: String(form.get("url") || ""),
      rssUrl: String(form.get("rssUrl") || "") || undefined,
      category: String(form.get("category") || "source locale"),
      reliabilityScore: Number(form.get("reliabilityScore") || 70),
      isActive: true,
    };
    setNewsSources((current) => [source, ...current]);
    setSourceModalOpen(false);
    setNotice("Source ajoutée et sauvegardée.");
  }

  function createOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const offer: ServiceOffer = {
      id: `offer-${crypto.randomUUID()}`,
      name: String(form.get("name") || "Nouvelle prestation"),
      description: String(form.get("description") || ""),
      category: String(form.get("category") || "Contenu"),
      price: Number(form.get("price") || 0),
    };
    setServiceOffers((current) => [offer, ...current]);
    setOfferModalOpen(false);
    setNotice("Prestation ajoutée et sauvegardée.");
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-[#5EADD3]">Paramètres</p>
            <h1 className="mt-1 text-2xl font-black text-[#18232B] sm:text-3xl">
              Configuration du studio et de sa mémoire.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596A76]">
              Identité, sources d&apos;actualités, prestations et export de vos données de travail.
            </p>
          </div>
          <Button onClick={exportWorkspace}>
            <Download className="h-4 w-4" />
            Exporter mes données
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm font-bold text-[#596A76]">{notice}</p>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <SectionHeading title="Profil utilisateur" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-[#E7F5FA] text-lg font-black text-[#18232B]">
              {getInitials(settings.displayName) || "JB"}
            </div>
            <Field
              label="Nom"
              value={settings.displayName}
              icon={User}
              onChange={(value) => setSettings((current) => ({ ...current, displayName: value }))}
            />
            <Field
              label="Email"
              value={settings.email}
              icon={ShieldCheck}
              onChange={(value) => setSettings((current) => ({ ...current, email: value }))}
            />
            <div className="grid gap-2">
              <Label>Préférence d&apos;affichage</Label>
              <Select
                value={settings.density}
                onChange={(event) => {
                  setSettings((current) => ({
                    ...current,
                    density: event.target.value as typeof current.density,
                  }));
                  setNotice("Préférence d'affichage sauvegardée.");
                }}
              >
                <option value="comfortable">Confortable</option>
                <option value="compact">Compact</option>
                <option value="large">Large</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Identité de l'application" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="relative min-h-36 overflow-hidden rounded-lg border-2 border-[#18232B] bg-white shadow-[6px_6px_0_rgba(24,35,43,0.12)] md:col-span-2">
              <Image
                src="/logo-jaime-besac.jpeg"
                alt="Logo J'aime Besac"
                fill
                sizes="680px"
                className="object-cover"
              />
            </div>
            <Field label="Nom" value="J'aime Besac Studio" icon={Settings} />
            <Field label="Univers" value="Média local, créatif, premium" icon={Palette} />
            <div className="rounded-lg border border-[#D8E5EC] bg-white p-3 md:col-span-2">
              <p className="text-xs font-black uppercase text-[#596A76]">Palette extraite du logo</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  brandColors.paper,
                  brandColors.white,
                  brandColors.ink,
                  brandColors.blue,
                  brandColors.blueSoft,
                  pastelColors.orange,
                  pastelColors.rose,
                  pastelColors.green,
                  pastelColors.yellow,
                ].map((color) => (
                  <span
                    key={color}
                    className="h-9 w-16 rounded-lg border border-[#D8E5EC]"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <SectionHeading title="Sources d'actualité" />
            <Button size="icon" variant="secondary" onClick={() => setSourceModalOpen(true)} aria-label="Ajouter une source">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {newsSources.length ? newsSources.map((source) => (
              <div key={source.id} className="rounded-lg border border-[#D8E5EC] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-[#18232B]">{source.name}</p>
                    <p className="mt-1 break-all text-xs font-bold text-[#596A76]">{source.rssUrl || source.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => setNewsSources((current) => current.map((item) => item.id === source.id ? { ...item, isActive: !item.isActive } : item))}
                      className="rounded-full"
                      aria-label={source.isActive ? "Désactiver la source" : "Activer la source"}
                    >
                      <Badge>{source.isActive ? "Actif" : "Inactif"}</Badge>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPendingDelete({ kind: "source", id: source.id, name: source.name })}
                      aria-label="Supprimer la source"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-5 text-center text-sm font-bold text-[#596A76]">
                Aucune source. Ajoutez un flux RSS pour démarrer la veille.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Catégories d'actualité" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {newsCategories.map((category) => (
              <span key={category} className="rounded-full bg-[#FBFAF2] px-3 py-1.5 text-xs font-bold text-[#596A76]">
                {category}
              </span>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <SectionHeading title="Types de prestations" />
            <Button size="icon" variant="secondary" onClick={() => setOfferModalOpen(true)} aria-label="Ajouter une prestation">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceOffers.length ? serviceOffers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-[#D8E5EC] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-[#18232B]">{offer.name}</p>
                    <p className="mt-1 text-sm text-[#596A76]">{offer.category} · {formatCurrency(offer.price)}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPendingDelete({ kind: "offer", id: offer.id, name: offer.name })}
                    aria-label="Supprimer la prestation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-[#C8D9E2] bg-[#FBFAF2] p-5 text-center text-sm font-bold text-[#596A76]">
                Aucune prestation enregistrée.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <SectionHeading title="Couleurs du planning" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(eventTypeConfig).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-[#D8E5EC] bg-white p-3">
                <span className="text-sm font-bold text-[#18232B]">{config.label}</span>
                <span className="h-6 w-10 rounded-lg border border-[#D8E5EC]" style={{ backgroundColor: config.bg }} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Notifications et intégrations" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.name} className="rounded-lg border border-[#D8E5EC] bg-white p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#5EADD3]" />
                    <p className="font-black text-[#18232B]">{integration.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-[#596A76]">{integration.status}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <SectionHeading title="Données de l'application" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Export" value="JSON complet disponible" icon={Download} />
          <Field label="Persistance" value="SQLite local · Upstash sur Vercel" icon={Database} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeading title="Palette de visualisation" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {chartPalette.map((color) => (
            <span
              key={color}
              className="h-10 w-20 rounded-lg border border-[#D8E5EC]"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </CardContent>
      </Card>

      <Modal
        open={sourceModalOpen}
        title="Ajouter une source"
        subtitle="Un flux RSS permet la récupération automatique des actualités."
        onClose={() => setSourceModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={createSource}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <TextInput name="name" required placeholder="Ex. Ville de Besançon" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select name="type" defaultValue="rss">
                <option value="rss">Flux RSS</option>
                <option value="manual_link">Lien manuel</option>
                <option value="press_release">Communiqué</option>
                <option value="official_api">API officielle</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Site source</Label>
            <TextInput name="url" type="url" required placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label>Adresse du flux RSS</Label>
            <TextInput name="rssUrl" type="url" placeholder="https://.../rss.xml" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <TextInput name="category" defaultValue="source locale" />
            </div>
            <div className="grid gap-2">
              <Label>Fiabilité sur 100</Label>
              <TextInput name="reliabilityScore" type="number" min="0" max="100" defaultValue="70" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSourceModalOpen(false)}>Annuler</Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={offerModalOpen}
        title="Ajouter une prestation"
        subtitle="Cette donnée alimente votre catalogue et vos statistiques."
        onClose={() => setOfferModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={createOffer}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <TextInput name="name" required placeholder="Ex. Reportage local" />
            </div>
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <TextInput name="category" defaultValue="Contenu" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <TextInput name="description" placeholder="Contenu de la prestation" />
          </div>
          <div className="grid gap-2">
            <Label>Prix en euros</Label>
            <TextInput name="price" type="number" min="0" step="1" defaultValue="0" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOfferModalOpen(false)}>Annuler</Button>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        title="Confirmer la suppression"
        subtitle={
          pendingDelete
            ? `« ${pendingDelete.name} » sera définitivement supprimé${pendingDelete.kind === "source" ? "e" : "e"}.`
            : undefined
        }
        onClose={() => setPendingDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#596A76]">
            Cette action est irréversible. La configuration (URL, fiabilité, catégorie) sera perdue.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: string;
  icon: typeof User;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#D8E5EC] bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#5EADD3]" />
        <p className="text-xs font-black uppercase text-[#596A76]">{label}</p>
      </div>
      <TextInput
        className="mt-2"
        value={value}
        readOnly={!onChange}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </div>
  );
}
