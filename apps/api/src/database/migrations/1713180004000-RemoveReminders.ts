import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveReminders1713180004000 implements MigrationInterface {
  name = 'RemoveReminders1713180004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_reminder_dispatches_status_scheduled_for"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "reminder_dispatches"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reminder_dispatch_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reminder_kind_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "reminder_kind_enum" AS ENUM ('precharge_d3', 'precharge_d1', 'failure_notice')`,
    );
    await queryRunner.query(
      `CREATE TYPE "reminder_dispatch_status_enum" AS ENUM ('pending', 'sent', 'failed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "reminder_dispatches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscription_id" uuid NOT NULL,
        "billing_period_key" character varying(100) NOT NULL,
        "kind" "reminder_kind_enum" NOT NULL,
        "scheduled_for" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "reminder_dispatch_status_enum" NOT NULL DEFAULT 'pending',
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "error_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reminder_dispatches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reminder_dispatches_subscription_period_kind" UNIQUE ("subscription_id", "billing_period_key", "kind"),
        CONSTRAINT "FK_reminder_dispatches_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_reminder_dispatches_status_scheduled_for" ON "reminder_dispatches" ("status", "scheduled_for")`,
    );
  }
}
