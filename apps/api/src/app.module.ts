import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillingModule } from './billing/billing.module';
import { validateEnv } from './config/env.validation';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { HealthModule } from './health/health.module';

function isSslEnabled() {
  return process.env.DB_SSL === 'true';
}

function isSynchronizeEnabled() {
  if (process.env.TYPEORM_SYNCHRONIZE !== undefined) {
    return process.env.TYPEORM_SYNCHRONIZE === 'true';
  }

  return (process.env.APP_ENV ?? 'local') === 'local';
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'avia',
        password: process.env.DB_PASSWORD ?? 'avia',
        database: process.env.DB_NAME ?? 'avia_agro',
        autoLoadEntities: true,
        synchronize: isSynchronizeEnabled(),
        ssl: isSslEnabled() ? { rejectUnauthorized: false } : false,
      }),
    }),
    HealthModule,
    BillingModule,
    ContactRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
