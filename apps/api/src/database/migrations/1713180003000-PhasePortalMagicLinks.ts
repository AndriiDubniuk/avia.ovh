import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhasePortalMagicLinks1713180003000 implements MigrationInterface {
  name = 'PhasePortalMagicLinks1713180003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "portal_access_token_type_enum" AS ENUM ('magic_link', 'session')`,
    );

    await queryRunner.query(`
      CREATE TABLE "portal_access_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(320) NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "token_type" "portal_access_token_type_enum" NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portal_access_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_portal_access_tokens_token_hash" UNIQUE ("token_hash")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_portal_access_tokens_email_type" ON "portal_access_tokens" ("email", "token_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_portal_access_tokens_type_expires" ON "portal_access_tokens" ("token_type", "expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_portal_access_tokens_type_expires"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_portal_access_tokens_email_type"`,
    );
    await queryRunner.query(`DROP TABLE "portal_access_tokens"`);
    await queryRunner.query(`DROP TYPE "portal_access_token_type_enum"`);
  }
}
