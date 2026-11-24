import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "gender" DROP NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "professional_title" DROP NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "bio" DROP NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" ADD COLUMN "legacy_psychologist_id" numeric;
  ALTER TABLE "payload"."therapist_profiles" ADD COLUMN "legacy_focus" varchar;
  CREATE UNIQUE INDEX "therapist_profiles_legacy_psychologist_id_idx" ON "payload"."therapist_profiles" USING btree ("legacy_psychologist_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."therapist_profiles_legacy_psychologist_id_idx";
  ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "gender" SET NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "professional_title" SET NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" ALTER COLUMN "bio" SET NOT NULL;
  ALTER TABLE "payload"."therapist_profiles" DROP COLUMN "legacy_psychologist_id";
  ALTER TABLE "payload"."therapist_profiles" DROP COLUMN "legacy_focus";`)
}
