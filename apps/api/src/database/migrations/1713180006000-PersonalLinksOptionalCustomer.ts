import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalLinksOptionalCustomer1713180006000
  implements MigrationInterface
{
  name = 'PersonalLinksOptionalCustomer1713180006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_billing_links" ALTER COLUMN "customer_name" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_billing_links" ALTER COLUMN "customer_email" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_billing_links" ALTER COLUMN "customer_email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_billing_links" ALTER COLUMN "customer_name" SET NOT NULL`,
    );
  }
}
