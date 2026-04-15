import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1CWebhooks1713180001000 implements MigrationInterface {
  name = 'Phase1CWebhooks1713180001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "payment_method_status_enum" AS ENUM ('active', 'disabled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "webhook_processing_status_enum" AS ENUM ('pending', 'processed', 'failed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "payment_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_id" uuid NOT NULL,
        "provider" character varying(32) NOT NULL,
        "card_token_encrypted" text NOT NULL,
        "masked_pan" character varying(32),
        "exp_month" smallint,
        "exp_year" smallint,
        "is_default" boolean NOT NULL DEFAULT true,
        "status" "payment_method_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "disabled_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_payment_methods_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_methods_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_payment_methods_client_status" ON "payment_methods" ("client_id", "status")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payment_methods_client_default_active" ON "payment_methods" ("client_id") WHERE ("is_default" = true AND "status" = 'active')`,
    );

    await queryRunner.query(`
      CREATE TABLE "webhook_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" character varying(32) NOT NULL,
        "event_key" character varying(160) NOT NULL,
        "event_type" character varying(80) NOT NULL,
        "signature_valid" boolean NOT NULL DEFAULT false,
        "payload_json" jsonb NOT NULL,
        "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "processing_status" "webhook_processing_status_enum" NOT NULL,
        "error_message" text,
        CONSTRAINT "PK_webhook_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_webhook_events_provider_event_key" UNIQUE ("provider", "event_key")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_webhook_events_processing_status_received_at" ON "webhook_events" ("processing_status", "received_at")`,
    );

    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_payment_method_id" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_payment_method_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_webhook_events_processing_status_received_at"`,
    );
    await queryRunner.query(`DROP TABLE "webhook_events"`);

    await queryRunner.query(
      `DROP INDEX "public"."UQ_payment_methods_client_default_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_methods_client_status"`,
    );
    await queryRunner.query(`DROP TABLE "payment_methods"`);

    await queryRunner.query(`DROP TYPE "webhook_processing_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_method_status_enum"`);
  }
}
