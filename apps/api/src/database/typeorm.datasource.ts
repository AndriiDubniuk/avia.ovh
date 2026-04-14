import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

const appEnv = process.env.APP_ENV ?? 'local';
const shouldSync =
  process.env.TYPEORM_SYNCHRONIZE !== undefined
    ? process.env.TYPEORM_SYNCHRONIZE === 'true'
    : appEnv === 'local';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'avia',
  password: process.env.DB_PASSWORD ?? 'avia',
  database: process.env.DB_NAME ?? 'avia_agro',
  synchronize: shouldSync,
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: ['src/database/migrations/*.ts', 'dist/database/migrations/*.js'],
});
