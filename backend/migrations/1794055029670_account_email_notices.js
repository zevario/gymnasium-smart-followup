export const up = (pgm) => pgm.sql(`
  CREATE TABLE account_email_notices (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id bigint NOT NULL REFERENCES member_accounts(person_id) ON DELETE CASCADE,
    email text NOT NULL,
    new_email text NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    next_attempt_at timestamptz DEFAULT now(),
    attempts integer NOT NULL DEFAULT 0,
    sent_at timestamptz,
    UNIQUE(member_id, new_email, requested_at)
  );
  CREATE INDEX account_email_notices_due ON account_email_notices(next_attempt_at)
    WHERE next_attempt_at IS NOT NULL;
`);
export const down = (pgm) => pgm.sql('DROP TABLE account_email_notices;');
