export const up = (pgm) => pgm.sql(`
  CREATE TABLE member_accounts (
    person_id bigint PRIMARY KEY REFERENCES pilot_people(id), email text UNIQUE NOT NULL,
    password_hash text NOT NULL
  );
  CREATE TABLE member_sessions (
    token_hash text PRIMARY KEY, person_id bigint NOT NULL REFERENCES member_accounts,
    expires_at timestamptz NOT NULL
  );
  CREATE TABLE member_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), person_id bigint NOT NULL REFERENCES member_accounts,
    kind text NOT NULL CHECK(kind IN ('trial','package','renewal','help')),
    note text NOT NULL, state text NOT NULL DEFAULT 'pending', response text,
    created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz, actor uuid REFERENCES users(id)
  );
  CREATE UNIQUE INDEX member_open_request ON member_requests(person_id,kind) WHERE state='pending';
`);
export const down = (pgm) => pgm.sql('DROP TABLE member_requests,member_sessions,member_accounts');
