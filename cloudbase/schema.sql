CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '我们家',
  invite_code text NOT NULL UNIQUE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  nickname text NOT NULL DEFAULT '家人',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric,
  description text NOT NULL DEFAULT '',
  purchase_date date,
  expiry_date date,
  location text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  photo text,
  category text NOT NULL DEFAULT 'home',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_household_id_idx ON items(household_id);
CREATE INDEX IF NOT EXISTS members_user_id_idx ON members(user_id);
CREATE INDEX IF NOT EXISTS households_invite_code_idx ON households(invite_code);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY households_auth_all ON households
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY members_auth_all ON members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY items_auth_all ON items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON households TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO authenticated;
