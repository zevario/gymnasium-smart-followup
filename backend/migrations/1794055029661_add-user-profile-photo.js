/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns('users', {
    profile_photo: {
      type: 'bytea',
    },
    profile_photo_mime_type: {
      type: 'varchar(50)',
    },
  });

  pgm.addConstraint('users', 'users_profile_photo_metadata_check', {
    check: `(
      (profile_photo IS NULL AND profile_photo_mime_type IS NULL)
      OR
      (profile_photo IS NOT NULL AND profile_photo_mime_type IN ('image/jpeg', 'image/png', 'image/webp'))
    )`,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropConstraint('users', 'users_profile_photo_metadata_check');
  pgm.dropColumns('users', ['profile_photo', 'profile_photo_mime_type']);
};
