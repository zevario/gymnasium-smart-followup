export const up = (pgm) =>
  pgm.sql(`
  CREATE TABLE pilot_people (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location text NOT NULL CHECK (location = 'bintaro'),
    source_id text NOT NULL, name text NOT NULL, phone text NOT NULL,
    consent text NOT NULL, complaint boolean NOT NULL, observed_at timestamptz NOT NULL,
    opted_out_at timestamptz, UNIQUE(location, source_id)
  );
  CREATE TABLE pilot_cycles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id bigint NOT NULL REFERENCES pilot_people(id),
    goal text NOT NULL CHECK (goal IN ('trial','renewal')), source_cycle text NOT NULL,
    facts jsonb NOT NULL, observed_at timestamptz NOT NULL, opens_at timestamptz NOT NULL,
    due_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
    owner_id uuid REFERENCES users(id), status text NOT NULL DEFAULT 'open',
    next_at timestamptz, reason text, draft text, draft_kind text,
    version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(person_id,goal,source_cycle)
  );
  CREATE TABLE pilot_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cycle_id uuid NOT NULL REFERENCES pilot_cycles(id), actor_id uuid REFERENCES users(id),
    action text NOT NULL, note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE pilot_attempts (
    id uuid PRIMARY KEY, cycle_id uuid NOT NULL REFERENCES pilot_cycles(id),
    actor_id uuid NOT NULL REFERENCES users(id), message text NOT NULL,
    verification text NOT NULL, state text NOT NULL CHECK(state IN ('unknown','accepted','failed')),
    created_at timestamptz NOT NULL DEFAULT now(), accepted_at timestamptz
  );
  CREATE INDEX pilot_events_cycle ON pilot_events(cycle_id,id);
  CREATE INDEX pilot_attempts_cycle ON pilot_attempts(cycle_id,state);
`);
export const down = (pgm) =>
  pgm.sql('DROP TABLE pilot_attempts, pilot_events, pilot_cycles, pilot_people');
