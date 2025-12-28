-- Run this in your Supabase SQL Editor to add the missing columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer default 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
