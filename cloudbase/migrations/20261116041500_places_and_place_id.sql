CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'other',
  photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_household_id_idx ON places(household_id);

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS place_id uuid REFERENCES places(id) ON DELETE SET NULL;

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS places_auth_all ON places;
CREATE POLICY places_auth_all ON places
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON places TO authenticated;
