export const up=pgm=>pgm.sql(`
ALTER TABLE member_accounts ADD COLUMN settings jsonb NOT NULL DEFAULT '{}', ADD COLUMN joined_at timestamptz, ADD COLUMN acknowledged_at timestamptz;
ALTER TABLE member_accounts ALTER COLUMN joined_at SET DEFAULT now();
ALTER TABLE member_requests DROP CONSTRAINT member_requests_kind_check,
 ADD CHECK(kind IN ('trial','package','renewal','help','booking','course','membership')),
 ADD COLUMN starts_at timestamptz, ADD COLUMN ends_at timestamptz, ADD COLUMN amount integer CHECK(amount>=0), ADD COLUMN paid_at timestamptz;
`);
