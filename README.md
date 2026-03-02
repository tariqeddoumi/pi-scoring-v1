# PI Scoring Web App (Next.js) — Banque-ready, DB portable

Pack livré:
- Frontend Next.js (App Router) + pages Projet / Evaluation / Résultats
- Backend API (Route Handlers) + Prisma (portable: Postgres/MySQL/SQLServer/SQLite)
- Moteur de scoring TypeScript (indépendant DB)
- SQL brut (création + seed) pour Postgres

## 1) Démarrage (mode Prisma + Postgres/Supabase)
```bash
pnpm i
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

## 2) DB portable
Par défaut Prisma. Changer de base = changer `DATABASE_URL` + provider Prisma.

## 3) Modèle
Poids domaines (D1..D4): 22/18/28/22, D5 = malus.
Formule: S_eco = Σ Wi * S_Di ; S_adj = S_eco*(1+αSeg+βZone) ; S_final = S_adj - M.

## 4) Extensibilité (KPI)
Les KPI + seuils sont dans la table `kpi_threshold`.
Ajouter un KPI = insérer `kpi` + ses thresholds (OK/VIG/CRIT) + poids.

## 5) ⚠️ Auth / workflow
Ce kit est prêt pour brancher Auth (Supabase Auth ou Auth.js).
Voir TODO dans `src/app/login/page.tsx`.
