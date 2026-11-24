import * as migration_20261123_153023_init from './20261123_153023_init';
import * as migration_20261123_155032_relax_legacy_fields from './20261123_155032_relax_legacy_fields';

export const migrations = [
  {
    up: migration_20261123_153023_init.up,
    down: migration_20261123_153023_init.down,
    name: '20261123_153023_init',
  },
  {
    up: migration_20261123_155032_relax_legacy_fields.up,
    down: migration_20261123_155032_relax_legacy_fields.down,
    name: '20261123_155032_relax_legacy_fields'
  },
];
