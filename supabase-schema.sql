-- ==============================================
-- UNSCROLL - Database Schema & RLS Policies
-- ==============================================
-- Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- ENUMS
-- ==============================================

CREATE TYPE media_format AS ENUM ('movie', 'series', 'documentary', 'anime');
CREATE TYPE media_status AS ENUM ('unwatched', 'watching', 'watched');

-- ==============================================
-- TABLES
-- ==============================================

-- Media Items Table
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT,
  plot TEXT,
  cast TEXT[] DEFAULT '{}',
  duration TEXT,
  format media_format DEFAULT 'movie',
  status media_status DEFAULT 'unwatched',
  poster_url TEXT,
  year INTEGER CHECK (year >= 1800 AND year <= 2100),
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_format ON media_items(format);

-- ==============================================
-- REALTIME - Enable for media_items
-- ==============================================
-- Go to Database > Replication in Supabase Dashboard
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE media_items;

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own media items
-- OR demo user's items if they're in demo mode
CREATE POLICY "Users can view own media items"
  ON media_items
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      -- Demo mode: allow viewing demo user's data
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = current_setting('app.demo_email', true)
      )
      AND user_id = (
        SELECT id FROM auth.users 
        WHERE email = current_setting('app.demo_email', true)
        LIMIT 1
      )
    )
  );

-- Policy: Users can insert their own media items
CREATE POLICY "Users can insert own media items"
  ON media_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own media items
CREATE POLICY "Users can update own media items"
  ON media_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own media items
CREATE POLICY "Users can delete own media items"
  ON media_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get random unwatched media
CREATE OR REPLACE FUNCTION get_random_unwatched_media(p_user_id UUID)
RETURNS SETOF media_items AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM media_items
  WHERE user_id = p_user_id
    AND status = 'unwatched'
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- DEMO DATA (Optional - for demo mode)
-- ==============================================
-- Replace 'DEMO_USER_UUID' with actual demo user ID after creating the account

-- INSERT INTO media_items (user_id, title, genre, plot, cast, duration, format, year, rating) VALUES
-- ('DEMO_USER_UUID', 'Inception', 'Sci-Fi, Thriller', 'A thief who enters the dreams of others to steal secrets from their subconscious.', ARRAY['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'], '2h 28m', 'movie', 2010, 8.8),
-- ('DEMO_USER_UUID', 'Breaking Bad', 'Drama, Crime', 'A high school chemistry teacher turned methamphetamine manufacturer.', ARRAY['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'], '5 Seasons', 'series', 2008, 9.5),
-- ('DEMO_USER_UUID', 'Planet Earth II', 'Nature, Documentary', 'David Attenborough returns with a new wildlife documentary.', ARRAY['David Attenborough'], '6 Episodes', 'documentary', 2016, 9.5),
-- ('DEMO_USER_UUID', 'Spirited Away', 'Animation, Fantasy', 'A young girl becomes trapped in a strange spirit world.', ARRAY['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'], '2h 5m', 'anime', 2001, 8.6);

-- ==============================================
-- INSTRUCTIONS
-- ==============================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Enable Realtime: Dashboard > Database > Replication > Enable for media_items
-- 3. Create demo user: Dashboard > Authentication > Users > Add User
-- 4. Note the demo user's UUID and update the INSERT statements above
-- 5. Set DEMO_USER_EMAIL in your .env.local
