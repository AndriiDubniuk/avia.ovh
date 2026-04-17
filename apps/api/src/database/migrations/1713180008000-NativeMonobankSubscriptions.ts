import { MigrationInterface, QueryRunner } from 'typeorm';

export class NativeMonobankSubscriptions1713180008000
  implements MigrationInterface
{
  name = 'NativeMonobankSubscriptions1713180008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN "provider_subscription_id" character varying(128)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_subscriptions_provider_subscription_id" ON "subscriptions" ("provider_subscription_id") WHERE "provider_subscription_id" IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ADD COLUMN "provider_subscription_id" character varying(128)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_provider_subscription_id" ON "checkout_sessions" ("provider_subscription_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_checkout_sessions_provider_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" DROP COLUMN "provider_subscription_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscriptions_provider_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "provider_subscription_id"`,
    );
  }
}

