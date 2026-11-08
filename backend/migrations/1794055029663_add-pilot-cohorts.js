export const up = (pgm) =>
  pgm.sql(`
  ALTER TABLE pilot_cycles ADD COLUMN eligible_at timestamptz;
  CREATE UNIQUE INDEX pilot_conversion_reference ON pilot_cycles ((facts->>'transaction'))
    WHERE facts->>'transaction' IS NOT NULL;
  CREATE TABLE pilot_runtime (
    location text PRIMARY KEY CHECK(location='bintaro'), paused boolean NOT NULL DEFAULT false,
    changed_at timestamptz NOT NULL DEFAULT now(), changed_by uuid REFERENCES users(id)
  );
  INSERT INTO pilot_runtime(location) VALUES('bintaro');
  CREATE TABLE pilot_rule_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid NOT NULL REFERENCES users(id),
    paused boolean NOT NULL, note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
  );
`);
export const down = (pgm) =>
  pgm.sql(
    'DROP TABLE pilot_rule_events,pilot_runtime; DROP INDEX pilot_conversion_reference; ALTER TABLE pilot_cycles DROP COLUMN eligible_at',
  );
