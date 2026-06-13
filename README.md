# पाण्डे वंशावली — Pandey Family Heritage

A production React app for preserving and exploring family history — family tree, stories, documents, photos, and relationship finder.

## Tech Stack

- **React 18** + Vite
- **Supabase** — authentication, database, and file storage
- **TanStack Query** — server state
- **Tailwind CSS** + Radix UI — styling and components
- **React Router** — client-side routing

## Project Structure

```
src/
├── components/       # UI and feature components
│   ├── common/       # Reusable LoadingSpinner, PageHeader, StatCard
│   ├── relationship/ # Relationship finder dialogs
│   ├── submissions/  # Edit/verify submission dialogs
│   └── ui/           # Radix/shadcn primitives
├── config/           # Environment configuration
├── hooks/            # Custom React hooks
├── lib/              # Auth context, utilities, relationship engine
├── pages/            # Route page components
├── routes/           # Route definitions and nav config
└── services/         # Supabase data access layer
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Set up the database

Run `supabase/schema.sql` in your Supabase SQL editor. Create a public storage bucket named `uploads`.

### 4. Run the dev server

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Authentication

Users sign in via Supabase Auth at `/login`. Set admin role in user metadata:

```json
{ "role": "admin", "full_name": "Your Name" }
```

## Optional Integrations

Configure `VITE_FUNCTIONS_URL` to enable:

- **Email invitations** — `POST /send-email`
- **LLM relationship labels** — `POST /invoke-llm` (falls back to local kinship engine)
