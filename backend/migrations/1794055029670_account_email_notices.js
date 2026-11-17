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
  -- Preserve warnings for change requests queued before this migration.
  INSERT INTO account_email_notices(member_id,email,new_email,requested_at)
    SELECT link.member_id,account.email,link.email,link.requested_at
    FROM account_email_links link
    JOIN member_accounts account ON account.person_id=link.member_id
    WHERE link.purpose='change-email' AND link.next_attempt_at IS NOT NULL
      AND account.email<>link.email
      AND link.requested_at>now()-interval '24 hours';
  CREATE INDEX account_email_notices_due ON account_email_notices(next_attempt_at)
    WHERE next_attempt_at IS NOT NULL;
`);
export const down = (pgm) => pgm.sql('DROP TABLE account_email_notices;');
