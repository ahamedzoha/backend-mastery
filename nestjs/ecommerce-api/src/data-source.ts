import './env.js';
import { join } from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';

// One config for both the app (TypeOrmModule) and the typeorm CLI (migrations).
// The globs match compiled .js files, because both run from dist/ after `nest build`.
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(import.meta.dirname, '**/*.entity.js')],
  migrations: [join(import.meta.dirname, 'migrations/*.js')],
  // Never let TypeORM change tables by itself: every change goes through a migration.
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
