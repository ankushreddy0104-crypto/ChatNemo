# ChatNemo

ChatNemo is a Next.js + FastAPI AI workspace currently wired to NVIDIA's OpenAI-compatible API and Supabase.

## Project structure

- `frontend/` — Next.js 14 web application
- `backend/` — FastAPI API
- `backend/supabase_schema.sql` — Supabase database schema
- `docker-compose.yml` — local development

## Required services

1. NVIDIA API key
2. Supabase project
3. Node.js 20+ for frontend-only development, or Docker
4. Python 3.12+ for backend-only development

## Environment variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in:

- `SECRET_KEY`
- `NVIDIA_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Never commit `.env`.

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local`.

## Supabase

Run `backend/supabase_schema.sql` once in the Supabase SQL Editor.

## Local Docker run

From the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3000`.

Backend health check: `http://localhost:8000/health`.

The NVIDIA key and Supabase service key remain server-side in FastAPI.

## GitHub upload without Linux

If using GitHub's browser uploader, upload the contents of this repository (not the ZIP file) into the repository root. Keep `.env` and `.env.local` out of GitHub.

## Production deployment

### Backend — Railway

Create a Railway service from the GitHub repository and set its root directory to `backend`.

Set these variables:

```text
SECRET_KEY=<long random secret>
NVIDIA_API_KEY=<NVIDIA key>
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
SUPABASE_URL=<Supabase URL>
SUPABASE_SERVICE_KEY=<Supabase service-role key>
ALLOWED_ORIGINS=["https://YOUR-FRONTEND-DOMAIN"]
DEBUG=false
```

Railway should use the included `backend/Dockerfile`.

### Frontend — Vercel

Import the same GitHub repository into Vercel and set the root directory to `frontend`.

Set:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN
```

Deploy after the backend is live.

## NVIDIA models

The default Ultra model is `nvidia/llama-3.1-nemotron-ultra-253b-v1`. NVIDIA's current model page documents that identifier. The model catalog also provides `nvidia/nemotron-3-nano-30b-a3b` and the multimodal `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`; model availability can change, so the backend keeps the model registry in one place.

## Security notes

- NVIDIA and Supabase service credentials are never sent to the browser.
- CORS is restricted through `ALLOWED_ORIGINS`.
- The API rejects model IDs that are not in the server-side model registry.
- Do not put secrets in GitHub.
