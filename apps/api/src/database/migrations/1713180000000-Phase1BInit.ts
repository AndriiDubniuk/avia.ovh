import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1BInit1713180000000 implements MigrationInterface {
  name = 'Phase1BInit1713180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "subscription_status_enum" AS ENUM ('pending_initial_payment', 'active', 'past_due', 'failed_initial_payment', 'suspended', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "subscription_interval_enum" AS ENUM ('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "checkout_status_enum" AS ENUM ('created', 'paid', 'failed', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_attempt_type_enum" AS ENUM ('initial', 'recurring')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_attempt_status_enum" AS ENUM ('pending', 'success', 'failed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "external_ref" character varying(120) NOT NULL,
        "name" character varying(160) NOT NULL,
        "email" character varying(160) NOT NULL,
        "phone" character varying(40),
        "timezone" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clients_external_ref" UNIQUE ("external_ref")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "payment_method_id" uuid,
        "status" "subscription_status_enum" NOT NULL,
        "amount_minor" integer NOT NULL,
        "currency" character(3) NOT NULL,
        "interval" "subscription_interval_enum" NOT NULL,
        "anchor_day" smallint NOT NULL,
        "client_timezone" character varying(64) NOT NULL,
        "next_charge_at" TIMESTAMP WITH TIME ZONE,
        "period_end_at" TIMESTAMP WITH TIME ZONE,
        "cancel_requested_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "retry_count" smallint NOT NULL DEFAULT 0,
        "max_retries" smallint NOT NULL DEFAULT 3,
        "last_failure_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_subscriptions_amount_minor" CHECK ("amount_minor" >= 100),
        CONSTRAINT "CHK_subscriptions_currency" CHECK ("currency" = 'UAH'),
        CONSTRAINT "CHK_subscriptions_anchor_day" CHECK ("anchor_day" >= 1 AND "anchor_day" <= 31),
        CONSTRAINT "FK_subscriptions_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_status_next_charge_at" ON "subscriptions" ("status", "next_charge_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_client_status" ON "subscriptions" ("client_id", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "checkout_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "provider_invoice_id" character varying(128) NOT NULL,
        "checkout_url" text NOT NULL,
        "status" "checkout_status_enum" NOT NULL,
        "tokenization_requested" boolean NOT NULL DEFAULT true,
        "return_url" text NOT NULL,
        "provider_payload_json" jsonb,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checkout_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_checkout_sessions_provider_invoice_id" UNIQUE ("provider_invoice_id"),
        CONSTRAINT "FK_checkout_sessions_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_checkout_sessions_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_subscription_status" ON "checkout_sessions" ("subscription_id", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "payment_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "payment_method_id" uuid,
        "checkout_session_id" uuid,
        "type" "payment_attempt_type_enum" NOT NULL,
        "status" "payment_attempt_status_enum" NOT NULL,
        "amount_minor" integer NOT NULL,
        "currency" character(3) NOT NULL,
        "billing_period_key" character varying(80) NOT NULL,
        "idempotency_key" character varying(128) NOT NULL,
        "provider_payment_id" character varying(128),
        "provider_invoice_id" character varying(128),
        "failure_code" character varying(64),
        "failure_message" text,
        "retry_no" smallint NOT NULL DEFAULT 0,
        "scheduled_for" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "finalized_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_payment_attempts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_attempts_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "UQ_payment_attempts_subscription_period_retry" UNIQUE ("subscription_id", "billing_period_key", "retry_no"),
        CONSTRAINT "FK_payment_attempts_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_payment_attempts_checkout_session_id" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_subscription_created_at" ON "payment_attempts" ("subscription_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_status_scheduled_for" ON "payment_attempts" ("status", "scheduled_for")`,
    );

    await queryRunner.query(`
      CREATE TABLE "api_idempotency" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "idempotency_key" character varying(128) NOT NULL,
        "route" character varying(120) NOT NULL,
        "request_hash" character(64) NOT NULL,
        "response_status" integer NOT NULL,
        "response_json" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_idempotency_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_api_idempotency_key_route" UNIQUE ("idempotency_key", "route")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "api_idempotency"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_payment_attempts_status_scheduled_for"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_attempts_subscription_created_at"`);
    await queryRunner.query(`DROP TABLE "payment_attempts"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_subscription_status"`);
    await queryRunner.query(`DROP TABLE "checkout_sessions"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_client_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_subscriptions_status_next_charge_at"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);

    await queryRunner.query(`DROP TABLE "clients"`);

    await queryRunner.query(`DROP TYPE "payment_attempt_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_attempt_type_enum"`);
    await queryRunner.query(`DROP TYPE "checkout_status_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_interval_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);
  }
}
