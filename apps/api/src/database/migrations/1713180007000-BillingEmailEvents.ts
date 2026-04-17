import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillingEmailEvents1713180007000 implements MigrationInterface {
  name = 'BillingEmailEvents1713180007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "billing_email_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_key" character varying(180) NOT NULL,
        "recipient_email" character varying(320) NOT NULL,
        "kind" character varying(120) NOT NULL,
        "status" character varying(24) NOT NULL DEFAULT 'pending',
        "error_message" text,
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_billing_email_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_billing_email_events_event_recipient" ON "billing_email_events" ("event_key", "recipient_email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_billing_email_events_event_recipient"`,
    );
    await queryRunner.query(`DROP TABLE "billing_email_events"`);
  }
}
