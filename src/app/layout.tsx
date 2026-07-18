import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { isAuthenticated } from "@/lib/auth-session";
import { readWorkspaceWithVersions } from "@/lib/workspace-store";
import type { WorkspaceData, WorkspaceKey } from "@/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "J'aime Besac Studio",
  description:
    "Studio de pilotage éditorial, planning, CRM et contenus pour J'aime Besac.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed the workspace on the server so authenticated pages render WITH their data
  // (no empty-then-fetch flash). Only for authenticated requests: the login page
  // shares this root layout, and reading data there would embed it in the login
  // HTML. If the read fails (e.g. a SQLite permission issue), fall back to null so
  // the client provider fetches and surfaces the real error + retry banner.
  let initialData: WorkspaceData | null = null;
  let initialVersions: Record<WorkspaceKey, string> | null = null;
  if (await isAuthenticated()) {
    try {
      const seed = await readWorkspaceWithVersions();
      initialData = seed.data;
      initialVersions = seed.versions;
    } catch {
      initialData = null;
      initialVersions = null;
    }
  }

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full">
        <WorkspaceProvider initialData={initialData} initialVersions={initialVersions}>
          <AppShell>{children}</AppShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
