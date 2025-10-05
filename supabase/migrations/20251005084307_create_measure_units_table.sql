/*
  # Create measure_units table

  1. New Tables
    - `measure_units`
      - `unit_id` (integer, primary key, auto-increment) - Unique identifier for each measure unit
      - `unit_name` (text, not null) - Name of the measure unit (e.g., "kg", "meter", "liter")
      - `unit_desc` (text) - Description of the measure unit
      - `created_at` (timestamptz) - Timestamp when the record was created
      - `updated_at` (timestamptz) - Timestamp when the record was last updated

  2. Security
    - Enable RLS on `measure_units` table
    - Add policy for authenticated users to read all measure units
    - Add policy for authenticated users to insert new measure units
    - Add policy for authenticated users to update measure units
    - Add policy for authenticated users to delete measure units

  3. Notes
    - The unit_id uses a sequence for auto-increment functionality
    - All authenticated users can perform CRUD operations on measure units
    - Timestamps are automatically managed with triggers
*/

-- Create measure_units table
CREATE TABLE IF NOT EXISTS measure_units (
  unit_id SERIAL PRIMARY KEY,
  unit_name TEXT NOT NULL,
  unit_desc TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on unit_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_measure_units_unit_name ON measure_units(unit_name);

-- Enable Row Level Security
ALTER TABLE measure_units ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all measure units
CREATE POLICY "Authenticated users can view all measure units"
  ON measure_units
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert measure units
CREATE POLICY "Authenticated users can insert measure units"
  ON measure_units
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update measure units
CREATE POLICY "Authenticated users can update measure units"
  ON measure_units
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to delete measure units
CREATE POLICY "Authenticated users can delete measure units"
  ON measure_units
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for measure_units table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_measure_units_updated_at'
  ) THEN
    CREATE TRIGGER update_measure_units_updated_at
      BEFORE UPDATE ON measure_units
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
