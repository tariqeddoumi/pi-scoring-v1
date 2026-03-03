import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PI Scoring",
  description: "Scoring Promotion Immobilière — web app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/" style={{ fontWeight: 700, textDecoration: "none", color: "#111" }}>PI Scoring</a>
          <nav style={{ display: "flex", gap: 12 }}>
            <a href="/projects">Projets</a>
            <a href="/evaluations">Évaluations</a>
          </nav>
        </div>
        <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
