# FixMotion.ai (Just Add Motion)

- GitHub: `Bdandc/Just-Add-Motion`
- Stack: Vite + React + TypeScript + Tailwind + shadcn/ui + FAL.ai
- FAL key: `FAL_TOKEN` in root `.env`, exposed as `VITE_FAL_KEY` in project `.env`
- **`@/` alias maps to repo root (not `src/`)** — shared libs go in `lib/`, pages in `src/pages/`
- Models: `fal-ai/veo3/fast/image-to-video` (premium), `fal-ai/kling-video/v1.6/standard/image-to-video` (balanced), `fal-ai/stable-video` (budget)
- FAL lib: `lib/fal.ts` — handles storage upload + generation with progress callbacks
- Auth: Supabase email + Google OAuth — `lib/supabase.ts`, `lib/auth-context.tsx`
- Supabase table: `generations` (id, user_id, prompt, model_id, duration, video_url, status, created_at) with RLS
- Protected routes: `/create` and `/account` require auth → redirect to `/login`
