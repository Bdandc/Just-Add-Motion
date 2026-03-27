/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface Generation {
  id: string;
  user_id: string;
  prompt: string;
  model_id: string;
  duration: string;
  video_url: string | null;
  status: 'complete' | 'failed';
  created_at: string;
}
