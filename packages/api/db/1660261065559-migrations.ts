import { MigrationInterface, QueryRunner } from "typeorm";

export class migrations1660261065559 implements MigrationInterface {
    name = 'migrations1660261065559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "job" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "location" varchar, "content" text, "isActive" boolean NOT NULL DEFAULT (1), "companyId" varchar)`);
        await queryRunner.query(`CREATE TABLE "company" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "location" varchar NOT NULL, "web" varchar, "linkedin" varchar, "twitter" varchar, "instagram" varchar, "youtube" varchar, "github" varchar, "isActive" boolean NOT NULL DEFAULT (1))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "password" varchar NOT NULL, "roles" text NOT NULL DEFAULT (''))`);
        await queryRunner.query(`CREATE TABLE "temporary_job" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "location" varchar, "content" text, "isActive" boolean NOT NULL DEFAULT (1), "companyId" varchar, CONSTRAINT "FK_e66170573cabd565dab1132727d" FOREIGN KEY ("companyId") REFERENCES "company" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_job"("id", "title", "location", "content", "isActive", "companyId") SELECT "id", "title", "location", "content", "isActive", "companyId" FROM "job"`);
        await queryRunner.query(`DROP TABLE "job"`);
        await queryRunner.query(`ALTER TABLE "temporary_job" RENAME TO "job"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" RENAME TO "temporary_job"`);
        await queryRunner.query(`CREATE TABLE "job" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "location" varchar, "content" text, "isActive" boolean NOT NULL DEFAULT (1), "companyId" varchar)`);
        await queryRunner.query(`INSERT INTO "job"("id", "title", "location", "content", "isActive", "companyId") SELECT "id", "title", "location", "content", "isActive", "companyId" FROM "temporary_job"`);
        await queryRunner.query(`DROP TABLE "temporary_job"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TABLE "job"`);
    }

}
