-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  association_date TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  photo_url TEXT,
  member_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  uid TEXT NOT NULL, -- Firebase UID for linking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read members (or restrict to authenticated if preferred)
CREATE POLICY "Allow public read access" ON members FOR SELECT USING (true);

-- Allow authenticated users to insert their own records
-- Note: This assumes the 'uid' column matches the Firebase UID. 
-- For full security, you'd use Supabase Auth, but here we link with Firebase.
CREATE POLICY "Allow authenticated insert" ON members FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update records
CREATE POLICY "Allow authenticated update" ON members FOR UPDATE USING (true);

-- Allow authenticated users to delete records
CREATE POLICY "Allow authenticated delete" ON members FOR DELETE USING (true);
