# FixMotion.ai — Just Add Motion

Upload an image, describe the motion, and generate a video using AI.

GitHub: [Bdandc/Just-Add-Motion](https://github.com/Bdandc/Just-Add-Motion)

## Stack

- Vite + React + TypeScript + Tailwind
- FAL.ai for video generation (Wan 2.1, Kling 1.6, Veo 3 Fast)
- Supabase for auth and saving generations

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   VITE_FAL_KEY=       # from fal.ai dashboard
   VITE_SUPABASE_URL=  # your Supabase project URL
   VITE_SUPABASE_ANON_KEY=  # your Supabase anon key
   ```

3. Run the dev server:
   ```
   npm run dev
   ```

## Notes

- `@/` alias maps to the repo root (not `src/`)
- Shared libs live in `lib/`, pages in `src/pages/`
- Protected routes (`/create`, `/account`) require auth
