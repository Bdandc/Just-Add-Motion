# FixMotion.ai (Just Add Motion)

- GitHub: `Bdandc/Just-Add-Motion`
- Stack: Vite + React + TypeScript + Tailwind + shadcn/ui + FAL.ai
- FAL key: `FAL_TOKEN` in root `.env`, exposed as `VITE_FAL_KEY` in project `.env`
- **`@/` alias maps to repo root (not `src/`)** — shared libs go in `lib/`, pages in `src/pages/`
- Models: `fal-ai/veo3.1/image-to-video` (premium, 1080p, audio off), `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` (balanced, duration enum "5"/"10"), `fal-ai/wan/v2.2-5b/image-to-video` (budget, length via num_frames/fps)
- FAL lib: `lib/fal.ts` — storage upload + generation pipeline with progress callbacks
- Quality pipeline (`lib/fal.ts` `generateVideo`): input upscale pre-pass (`fal-ai/clarity-upscaler`, auto-skips inputs already >=1536px), auto aspect-ratio from source (16:9/9:16/1:1, per-model), client seed (Veo+Wan) for reroll/lock, Veo `generate_audio` toggle, optional polish post-pass (`fal-ai/topaz/upscale/video`, 2x + 60fps). Upscale/polish failures are non-fatal (fall through to base video). UI toggles on CreatePage; reroll/lock on PreviewPage.
- Auth: Supabase email + Google OAuth — `lib/supabase.ts`, `lib/auth-context.tsx`
- Supabase table: `generations` (id, user_id, prompt, model_id, duration, video_url, status, created_at) with RLS
- **PENDING MIGRATION:** `generations.seed` (bigint) + `generations.aspect_ratio` (text) are NOT yet added. The Supabase project `aydatebrievbmmaxegsp` ("Lead gen pipeline") is paused and the org is at the free-tier 2-active-project cap. Inserts intentionally omit these columns. When the project is resumed, run `ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS seed bigint, ADD COLUMN IF NOT EXISTS aspect_ratio text;` then re-add `seed: result.seed` + `aspect_ratio: result.aspectRatio` to the inserts in CreatePage/PreviewPage.
- Protected routes: `/create` and `/account` require auth → redirect to `/login`
