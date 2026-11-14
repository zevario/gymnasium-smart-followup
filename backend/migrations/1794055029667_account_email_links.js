export const up = (pgm) => pgm.sql(`
  ALTER TABLE member_accounts ADD COLUMN activation_pending boolean NOT NULL DEFAULT false;
  ALTER TABLE member_accounts ALTER COLUMN activation_pending SET DEFAULT true;

  CREATE TABLE account_email_links (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id bigint REFERENCES member_accounts(person_id) ON DELETE CASCADE,
    employee_id uuid REFERENCES users(id) ON DELETE CASCADE,
    purpose text NOT NULL CHECK (purpose IN ('activate', 'reset', 'change-email')),
    email text NOT NULL,
    credential_binding text NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    next_attempt_at timestamptz DEFAULT now(),
    attempts integer NOT NULL DEFAULT 0,
    token_hash text UNIQUE,
    expires_at timestamptz,
    CHECK (num_nonnulls(member_id, employee_id) = 1),
    CHECK (employee_id IS NULL OR purpose = 'reset'),
    UNIQUE (member_id, purpose),
    UNIQUE (employee_id, purpose)
  );
  CREATE INDEX account_email_delivery_due ON account_email_links(next_attempt_at)
    WHERE next_attempt_at IS NOT NULL;
`);

export const down = (pgm) => pgm.sql(`
  DROP TABLE account_email_links;
  ALTER TABLE member_accounts DROP COLUMN activation_pending;
`);
