import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalBillingLinks1713180005000
  implements MigrationInterface
{
  name = 'PersonalBillingLinks1713180005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "personal_billing_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token_hash" character varying(128) NOT NULL,
        "plan_code" character varying(100) NOT NULL,
        "customer_name" character varying(160) NOT NULL,
        "customer_email" character varying(320) NOT NULL,
        "company_name" character varying(160),
        "timezone" character varying(64),
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_personal_billing_links_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_personal_billing_links_token_hash" ON "personal_billing_links" ("token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_personal_billing_links_token_hash"`,
    );
    await queryRunner.query(`DROP TABLE "personal_billing_links"`);
  }
}
