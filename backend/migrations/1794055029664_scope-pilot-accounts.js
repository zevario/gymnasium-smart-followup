export const up = (pgm) =>
  pgm.sql(`
  ALTER TABLE users ADD COLUMN pilot_location text CHECK (pilot_location='bintaro');
  UPDATE users SET pilot_location='bintaro' WHERE role='admin' AND is_active;
`);
export const down = (pgm) => pgm.sql('ALTER TABLE users DROP COLUMN pilot_location');
