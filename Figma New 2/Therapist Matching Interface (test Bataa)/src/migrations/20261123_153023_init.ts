import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."_locales" AS ENUM('en');
  CREATE TYPE "payload"."enum_users_account_type" AS ENUM('therapist', 'client');
  CREATE TYPE "payload"."enum_therapist_profiles_categories" AS ENUM('personal', 'couples', 'teen', 'family', 'other');
  CREATE TYPE "payload"."enum_therapist_profiles_specializations" AS ENUM('Харилцааны бэрхшээл', 'Амьдралын зорилго', 'Ганцаардал / Тусгаарлагдал', 'Өөрийгөө хайрлах', 'Нийгмийн түгшүүр ба фоби', 'Буруутгал ба ичгүүр', 'Гэмтлийн дараах стресс (PTSD)', 'Паник дарамт ба халдлага', 'Хяналтын асуудал', 'Уучлал', 'Асрагчийн стресс', 'Жирэмслэлт ба төрөлт', 'Гэрлэлт цуцлалт', 'Стресс ба сэтгэлийн зовниул', 'Донтолтоос гарах', 'ЛГБТК+ асуудал', 'Гэр бүлийн зөрчил', 'Гэмт хэрэг ба хүчирхийлэл', 'Алдагдал ба гашуудал', 'Дотно харилцааны асуудал', 'Хоол тэжээлийн эмгэг', 'Нойрны эмгэг', 'Эцэг эхийн асуудал', 'Урам зориг ба өөртөө итгэх', 'Уур хилэн удирдах', 'Ажил мэргэжлийн бэрхшээл', 'Хоёр туйлт эмгэг', 'Амьдралын өөрчлөлттэй зохицох', 'Гүйцэтгэлийн дасгалжуулалт', 'Энэрлийн ядаргаа', 'Анхаарал ба ADHD');
  CREATE TYPE "payload"."enum_therapist_profiles_format" AS ENUM('online', 'inperson');
  CREATE TYPE "payload"."enum_therapist_profiles_chat_availability_day" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TYPE "payload"."enum_therapist_profiles_status" AS ENUM('pending', 'needs-info', 'approved', 'rejected');
  CREATE TYPE "payload"."enum_therapist_profiles_gender" AS ENUM('female', 'male', 'other');
  CREATE TYPE "payload"."enum_therapist_profiles_age_group" AS ENUM('25-35', '35-45', '45-55', '55+');
  CREATE TYPE "payload"."enum_therapist_profiles_meeting_provider" AS ENUM('google-meet', 'zoom');
  CREATE TYPE "payload"."enum_bookings_format" AS ENUM('online', 'inperson');
  CREATE TYPE "payload"."enum_bookings_payment_method" AS ENUM('account-qr', 'socialpay', 'qpay', 'bank');
  CREATE TYPE "payload"."enum_bookings_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');
  CREATE TYPE "payload"."enum_chat_conversations_status" AS ENUM('open', 'closed');
  CREATE TYPE "payload"."enum_chat_messages_sender_role" AS ENUM('client', 'therapist');
  CREATE TYPE "payload"."enum_payload_llm_instructions_entity_type" AS ENUM('collection', 'global');
  CREATE TABLE "payload"."admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"refresh_count" numeric,
  	"refreshed_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."admins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"refresh_count" numeric,
  	"refreshed_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"phone" varchar,
  	"account_type" "payload"."enum_users_account_type" DEFAULT 'therapist' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."therapist_profiles_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"school" varchar NOT NULL,
  	"degree" varchar NOT NULL,
  	"graduation_year" numeric
  );
  
  CREATE TABLE "payload"."therapist_profiles_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_therapist_profiles_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."therapist_profiles_specializations" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_therapist_profiles_specializations",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."therapist_profiles_format" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_therapist_profiles_format",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."therapist_profiles_chat_availability" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "payload"."enum_therapist_profiles_chat_availability_day" NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."therapist_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_user_id" numeric,
  	"status" "payload"."enum_therapist_profiles_status" DEFAULT 'pending' NOT NULL,
  	"is_visible" boolean DEFAULT false,
  	"name" varchar NOT NULL,
  	"photo_id" integer,
  	"gender" "payload"."enum_therapist_profiles_gender" NOT NULL,
  	"age" numeric,
  	"age_group" "payload"."enum_therapist_profiles_age_group",
  	"professional_title" varchar NOT NULL,
  	"bio" varchar NOT NULL,
  	"license_has_license" boolean DEFAULT false,
  	"license_number" varchar,
  	"license_issuer" varchar,
  	"license_expires_at" timestamp(3) with time zone,
  	"calendly_u_r_l" varchar,
  	"meeting_provider" "payload"."enum_therapist_profiles_meeting_provider" DEFAULT 'google-meet',
  	"location_aimag" varchar,
  	"location_district" varchar,
  	"location_address" varchar,
  	"experience" numeric NOT NULL,
  	"price" numeric NOT NULL,
  	"session_length" numeric DEFAULT 60,
  	"approach" varchar,
  	"rating" numeric DEFAULT 0,
  	"sessions" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."therapist_profiles_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."therapist_profiles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"therapist_id" integer NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time" varchar NOT NULL,
  	"format" "payload"."enum_bookings_format" NOT NULL,
  	"note" varchar,
  	"payment_method" "payload"."enum_bookings_payment_method" NOT NULL,
  	"meeting_link" varchar,
  	"status" "payload"."enum_bookings_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."bookings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."chat_conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" integer NOT NULL,
  	"therapist_id" integer NOT NULL,
  	"status" "payload"."enum_chat_conversations_status" DEFAULT 'open' NOT NULL,
  	"last_message_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."chat_conversations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."chat_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"conversation_id" integer NOT NULL,
  	"sender_user_id" integer NOT NULL,
  	"sender_role" "payload"."enum_chat_messages_sender_role" NOT NULL,
  	"body" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."chat_messages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."client_feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" integer NOT NULL,
  	"therapist_id" integer,
  	"rating" numeric NOT NULL,
  	"comment" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."client_feedback_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"_h_folders_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"_stored" boolean,
  	"_transforms" jsonb,
  	"original_filename" varchar,
  	"original_url" varchar,
  	"original_mime_type" varchar,
  	"original_filesize" numeric,
  	"original_width" numeric,
  	"original_height" numeric,
  	"original_prefix" varchar,
  	"original__objectkey" varchar,
  	"original__stored" boolean,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."_media_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_alt" varchar NOT NULL,
  	"version__h_folders_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version__stored" boolean,
  	"version__transforms" jsonb,
  	"version_original_filename" varchar,
  	"version_original_url" varchar,
  	"version_original_mime_type" varchar,
  	"version_original_filesize" numeric,
  	"version_original_width" numeric,
  	"version_original_height" numeric,
  	"version_original_prefix" varchar,
  	"version_original__objectkey" varchar,
  	"version_original__stored" boolean,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_h_folders_id" integer,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."folders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."_folders_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__h_folders_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."_folders_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_h_tags_id" integer,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."tags_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."_tags_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__h_tags_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."_tags_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer,
  	"therapist_profiles_id" integer,
  	"bookings_id" integer,
  	"chat_conversations_id" integer,
  	"chat_messages_id" integer,
  	"client_feedback_id" integer,
  	"media_id" integer,
  	"folders_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_llm_instructions" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"entity_slug" varchar NOT NULL,
  	"entity_type" "payload"."enum_payload_llm_instructions_entity_type" NOT NULL,
  	"additional_instructions" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_llm_instructions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"users_id" integer
  );
  
  ALTER TABLE "payload"."admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."admins_rels" ADD CONSTRAINT "admins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."admins_rels" ADD CONSTRAINT "admins_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."admins_rels" ADD CONSTRAINT "admins_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_rels" ADD CONSTRAINT "users_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_education" ADD CONSTRAINT "therapist_profiles_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_categories" ADD CONSTRAINT "therapist_profiles_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_specializations" ADD CONSTRAINT "therapist_profiles_specializations_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_format" ADD CONSTRAINT "therapist_profiles_format_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_chat_availability" ADD CONSTRAINT "therapist_profiles_chat_availability_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles" ADD CONSTRAINT "therapist_profiles_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_texts" ADD CONSTRAINT "therapist_profiles_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_rels" ADD CONSTRAINT "therapist_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_rels" ADD CONSTRAINT "therapist_profiles_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."therapist_profiles_rels" ADD CONSTRAINT "therapist_profiles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_therapist_id_therapist_profiles_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings_rels" ADD CONSTRAINT "bookings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."bookings_rels" ADD CONSTRAINT "bookings_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."bookings_rels" ADD CONSTRAINT "bookings_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_conversations" ADD CONSTRAINT "chat_conversations_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."chat_conversations" ADD CONSTRAINT "chat_conversations_therapist_id_therapist_profiles_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."chat_conversations_rels" ADD CONSTRAINT "chat_conversations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_conversations_rels" ADD CONSTRAINT "chat_conversations_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_conversations_rels" ADD CONSTRAINT "chat_conversations_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "payload"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."chat_messages_rels" ADD CONSTRAINT "chat_messages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_messages_rels" ADD CONSTRAINT "chat_messages_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."chat_messages_rels" ADD CONSTRAINT "chat_messages_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."client_feedback" ADD CONSTRAINT "client_feedback_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."client_feedback" ADD CONSTRAINT "client_feedback_therapist_id_therapist_profiles_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."client_feedback_rels" ADD CONSTRAINT "client_feedback_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."client_feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."client_feedback_rels" ADD CONSTRAINT "client_feedback_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."client_feedback_rels" ADD CONSTRAINT "client_feedback_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media" ADD CONSTRAINT "media__h_folders_id_folders_id_fk" FOREIGN KEY ("_h_folders_id") REFERENCES "payload"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_media_v" ADD CONSTRAINT "_media_v_version__h_folders_id_folders_id_fk" FOREIGN KEY ("version__h_folders_id") REFERENCES "payload"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_media_v_rels" ADD CONSTRAINT "_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_media_v_rels" ADD CONSTRAINT "_media_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_media_v_rels" ADD CONSTRAINT "_media_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_media_v_rels" ADD CONSTRAINT "_media_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."folders" ADD CONSTRAINT "folders__h_folders_id_folders_id_fk" FOREIGN KEY ("_h_folders_id") REFERENCES "payload"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."folders_rels" ADD CONSTRAINT "folders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."folders_rels" ADD CONSTRAINT "folders_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."folders_rels" ADD CONSTRAINT "folders_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_folders_v" ADD CONSTRAINT "_folders_v_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_folders_v" ADD CONSTRAINT "_folders_v_version__h_folders_id_folders_id_fk" FOREIGN KEY ("version__h_folders_id") REFERENCES "payload"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_folders_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tags" ADD CONSTRAINT "tags__h_tags_id_tags_id_fk" FOREIGN KEY ("_h_tags_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tags_rels" ADD CONSTRAINT "tags_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tags_rels" ADD CONSTRAINT "tags_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tags_rels" ADD CONSTRAINT "tags_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tags_v" ADD CONSTRAINT "_tags_v_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tags_v" ADD CONSTRAINT "_tags_v_version__h_tags_id_tags_id_fk" FOREIGN KEY ("version__h_tags_id") REFERENCES "payload"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_tags_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_therapist_profiles_fk" FOREIGN KEY ("therapist_profiles_id") REFERENCES "payload"."therapist_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_conversations_fk" FOREIGN KEY ("chat_conversations_id") REFERENCES "payload"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_messages_fk" FOREIGN KEY ("chat_messages_id") REFERENCES "payload"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_client_feedback_fk" FOREIGN KEY ("client_feedback_id") REFERENCES "payload"."client_feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_folders_fk" FOREIGN KEY ("folders_id") REFERENCES "payload"."folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_llm_instructions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "payload"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "admins_sessions_order_idx" ON "payload"."admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "payload"."admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "payload"."admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "payload"."admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "payload"."admins" USING btree ("email");
  CREATE INDEX "admins_rels_order_idx" ON "payload"."admins_rels" USING btree ("order");
  CREATE INDEX "admins_rels_parent_idx" ON "payload"."admins_rels" USING btree ("parent_id");
  CREATE INDEX "admins_rels_path_idx" ON "payload"."admins_rels" USING btree ("path");
  CREATE INDEX "admins_rels_admins_id_idx" ON "payload"."admins_rels" USING btree ("admins_id");
  CREATE INDEX "admins_rels_users_id_idx" ON "payload"."admins_rels" USING btree ("users_id");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "payload"."users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "payload"."users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "payload"."users_rels" USING btree ("path");
  CREATE INDEX "users_rels_admins_id_idx" ON "payload"."users_rels" USING btree ("admins_id");
  CREATE INDEX "users_rels_users_id_idx" ON "payload"."users_rels" USING btree ("users_id");
  CREATE INDEX "therapist_profiles_education_order_idx" ON "payload"."therapist_profiles_education" USING btree ("_order");
  CREATE INDEX "therapist_profiles_education_parent_id_idx" ON "payload"."therapist_profiles_education" USING btree ("_parent_id");
  CREATE INDEX "therapist_profiles_categories_order_idx" ON "payload"."therapist_profiles_categories" USING btree ("order");
  CREATE INDEX "therapist_profiles_categories_parent_idx" ON "payload"."therapist_profiles_categories" USING btree ("parent_id");
  CREATE INDEX "therapist_profiles_specializations_order_idx" ON "payload"."therapist_profiles_specializations" USING btree ("order");
  CREATE INDEX "therapist_profiles_specializations_parent_idx" ON "payload"."therapist_profiles_specializations" USING btree ("parent_id");
  CREATE INDEX "therapist_profiles_format_order_idx" ON "payload"."therapist_profiles_format" USING btree ("order");
  CREATE INDEX "therapist_profiles_format_parent_idx" ON "payload"."therapist_profiles_format" USING btree ("parent_id");
  CREATE INDEX "therapist_profiles_chat_availability_order_idx" ON "payload"."therapist_profiles_chat_availability" USING btree ("_order");
  CREATE INDEX "therapist_profiles_chat_availability_parent_id_idx" ON "payload"."therapist_profiles_chat_availability" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "therapist_profiles_owner_user_id_idx" ON "payload"."therapist_profiles" USING btree ("owner_user_id");
  CREATE INDEX "therapist_profiles_status_idx" ON "payload"."therapist_profiles" USING btree ("status");
  CREATE INDEX "therapist_profiles_is_visible_idx" ON "payload"."therapist_profiles" USING btree ("is_visible");
  CREATE INDEX "therapist_profiles_name_idx" ON "payload"."therapist_profiles" USING btree ("name");
  CREATE INDEX "therapist_profiles_photo_idx" ON "payload"."therapist_profiles" USING btree ("photo_id");
  CREATE INDEX "therapist_profiles_updated_at_idx" ON "payload"."therapist_profiles" USING btree ("updated_at");
  CREATE INDEX "therapist_profiles_created_at_idx" ON "payload"."therapist_profiles" USING btree ("created_at");
  CREATE INDEX "therapist_profiles_texts_order_parent" ON "payload"."therapist_profiles_texts" USING btree ("order","parent_id");
  CREATE INDEX "therapist_profiles_rels_order_idx" ON "payload"."therapist_profiles_rels" USING btree ("order");
  CREATE INDEX "therapist_profiles_rels_parent_idx" ON "payload"."therapist_profiles_rels" USING btree ("parent_id");
  CREATE INDEX "therapist_profiles_rels_path_idx" ON "payload"."therapist_profiles_rels" USING btree ("path");
  CREATE INDEX "therapist_profiles_rels_admins_id_idx" ON "payload"."therapist_profiles_rels" USING btree ("admins_id");
  CREATE INDEX "therapist_profiles_rels_users_id_idx" ON "payload"."therapist_profiles_rels" USING btree ("users_id");
  CREATE INDEX "bookings_therapist_idx" ON "payload"."bookings" USING btree ("therapist_id");
  CREATE INDEX "bookings_updated_at_idx" ON "payload"."bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "payload"."bookings" USING btree ("created_at");
  CREATE INDEX "bookings_rels_order_idx" ON "payload"."bookings_rels" USING btree ("order");
  CREATE INDEX "bookings_rels_parent_idx" ON "payload"."bookings_rels" USING btree ("parent_id");
  CREATE INDEX "bookings_rels_path_idx" ON "payload"."bookings_rels" USING btree ("path");
  CREATE INDEX "bookings_rels_admins_id_idx" ON "payload"."bookings_rels" USING btree ("admins_id");
  CREATE INDEX "bookings_rels_users_id_idx" ON "payload"."bookings_rels" USING btree ("users_id");
  CREATE INDEX "chat_conversations_client_idx" ON "payload"."chat_conversations" USING btree ("client_id");
  CREATE INDEX "chat_conversations_therapist_idx" ON "payload"."chat_conversations" USING btree ("therapist_id");
  CREATE INDEX "chat_conversations_last_message_at_idx" ON "payload"."chat_conversations" USING btree ("last_message_at");
  CREATE INDEX "chat_conversations_updated_at_idx" ON "payload"."chat_conversations" USING btree ("updated_at");
  CREATE INDEX "chat_conversations_created_at_idx" ON "payload"."chat_conversations" USING btree ("created_at");
  CREATE INDEX "chat_conversations_rels_order_idx" ON "payload"."chat_conversations_rels" USING btree ("order");
  CREATE INDEX "chat_conversations_rels_parent_idx" ON "payload"."chat_conversations_rels" USING btree ("parent_id");
  CREATE INDEX "chat_conversations_rels_path_idx" ON "payload"."chat_conversations_rels" USING btree ("path");
  CREATE INDEX "chat_conversations_rels_admins_id_idx" ON "payload"."chat_conversations_rels" USING btree ("admins_id");
  CREATE INDEX "chat_conversations_rels_users_id_idx" ON "payload"."chat_conversations_rels" USING btree ("users_id");
  CREATE INDEX "chat_messages_conversation_idx" ON "payload"."chat_messages" USING btree ("conversation_id");
  CREATE INDEX "chat_messages_sender_user_idx" ON "payload"."chat_messages" USING btree ("sender_user_id");
  CREATE INDEX "chat_messages_updated_at_idx" ON "payload"."chat_messages" USING btree ("updated_at");
  CREATE INDEX "chat_messages_created_at_idx" ON "payload"."chat_messages" USING btree ("created_at");
  CREATE INDEX "chat_messages_rels_order_idx" ON "payload"."chat_messages_rels" USING btree ("order");
  CREATE INDEX "chat_messages_rels_parent_idx" ON "payload"."chat_messages_rels" USING btree ("parent_id");
  CREATE INDEX "chat_messages_rels_path_idx" ON "payload"."chat_messages_rels" USING btree ("path");
  CREATE INDEX "chat_messages_rels_admins_id_idx" ON "payload"."chat_messages_rels" USING btree ("admins_id");
  CREATE INDEX "chat_messages_rels_users_id_idx" ON "payload"."chat_messages_rels" USING btree ("users_id");
  CREATE INDEX "client_feedback_client_idx" ON "payload"."client_feedback" USING btree ("client_id");
  CREATE INDEX "client_feedback_therapist_idx" ON "payload"."client_feedback" USING btree ("therapist_id");
  CREATE INDEX "client_feedback_updated_at_idx" ON "payload"."client_feedback" USING btree ("updated_at");
  CREATE INDEX "client_feedback_created_at_idx" ON "payload"."client_feedback" USING btree ("created_at");
  CREATE INDEX "client_feedback_rels_order_idx" ON "payload"."client_feedback_rels" USING btree ("order");
  CREATE INDEX "client_feedback_rels_parent_idx" ON "payload"."client_feedback_rels" USING btree ("parent_id");
  CREATE INDEX "client_feedback_rels_path_idx" ON "payload"."client_feedback_rels" USING btree ("path");
  CREATE INDEX "client_feedback_rels_admins_id_idx" ON "payload"."client_feedback_rels" USING btree ("admins_id");
  CREATE INDEX "client_feedback_rels_users_id_idx" ON "payload"."client_feedback_rels" USING btree ("users_id");
  CREATE INDEX "media__h_folders_idx" ON "payload"."media" USING btree ("_h_folders_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_original_original_filename_idx" ON "payload"."media" USING btree ("original_filename");
  CREATE INDEX "media_rels_order_idx" ON "payload"."media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "payload"."media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "payload"."media_rels" USING btree ("path");
  CREATE INDEX "media_rels_tags_id_idx" ON "payload"."media_rels" USING btree ("tags_id");
  CREATE INDEX "media_rels_admins_id_idx" ON "payload"."media_rels" USING btree ("admins_id");
  CREATE INDEX "media_rels_users_id_idx" ON "payload"."media_rels" USING btree ("users_id");
  CREATE INDEX "_media_v_parent_idx" ON "payload"."_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version__h_folders_idx" ON "payload"."_media_v" USING btree ("version__h_folders_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "payload"."_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "payload"."_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "payload"."_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_original_version_original_filename_idx" ON "payload"."_media_v" USING btree ("version_original_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "payload"."_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "payload"."_media_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_rels_order_idx" ON "payload"."_media_v_rels" USING btree ("order");
  CREATE INDEX "_media_v_rels_parent_idx" ON "payload"."_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_media_v_rels_path_idx" ON "payload"."_media_v_rels" USING btree ("path");
  CREATE INDEX "_media_v_rels_tags_id_idx" ON "payload"."_media_v_rels" USING btree ("tags_id");
  CREATE INDEX "_media_v_rels_admins_id_idx" ON "payload"."_media_v_rels" USING btree ("admins_id");
  CREATE INDEX "_media_v_rels_users_id_idx" ON "payload"."_media_v_rels" USING btree ("users_id");
  CREATE INDEX "folders__h_folders_idx" ON "payload"."folders" USING btree ("_h_folders_id");
  CREATE INDEX "folders_updated_at_idx" ON "payload"."folders" USING btree ("updated_at");
  CREATE INDEX "folders_created_at_idx" ON "payload"."folders" USING btree ("created_at");
  CREATE INDEX "folders_rels_order_idx" ON "payload"."folders_rels" USING btree ("order");
  CREATE INDEX "folders_rels_parent_idx" ON "payload"."folders_rels" USING btree ("parent_id");
  CREATE INDEX "folders_rels_path_idx" ON "payload"."folders_rels" USING btree ("path");
  CREATE INDEX "folders_rels_admins_id_idx" ON "payload"."folders_rels" USING btree ("admins_id");
  CREATE INDEX "folders_rels_users_id_idx" ON "payload"."folders_rels" USING btree ("users_id");
  CREATE INDEX "_folders_v_parent_idx" ON "payload"."_folders_v" USING btree ("parent_id");
  CREATE INDEX "_folders_v_version_version__h_folders_idx" ON "payload"."_folders_v" USING btree ("version__h_folders_id");
  CREATE INDEX "_folders_v_version_version_updated_at_idx" ON "payload"."_folders_v" USING btree ("version_updated_at");
  CREATE INDEX "_folders_v_version_version_created_at_idx" ON "payload"."_folders_v" USING btree ("version_created_at");
  CREATE INDEX "_folders_v_created_at_idx" ON "payload"."_folders_v" USING btree ("created_at");
  CREATE INDEX "_folders_v_updated_at_idx" ON "payload"."_folders_v" USING btree ("updated_at");
  CREATE INDEX "_folders_v_rels_order_idx" ON "payload"."_folders_v_rels" USING btree ("order");
  CREATE INDEX "_folders_v_rels_parent_idx" ON "payload"."_folders_v_rels" USING btree ("parent_id");
  CREATE INDEX "_folders_v_rels_path_idx" ON "payload"."_folders_v_rels" USING btree ("path");
  CREATE INDEX "_folders_v_rels_admins_id_idx" ON "payload"."_folders_v_rels" USING btree ("admins_id");
  CREATE INDEX "_folders_v_rels_users_id_idx" ON "payload"."_folders_v_rels" USING btree ("users_id");
  CREATE INDEX "tags__h_tags_idx" ON "payload"."tags" USING btree ("_h_tags_id");
  CREATE INDEX "tags_updated_at_idx" ON "payload"."tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "payload"."tags" USING btree ("created_at");
  CREATE INDEX "tags_rels_order_idx" ON "payload"."tags_rels" USING btree ("order");
  CREATE INDEX "tags_rels_parent_idx" ON "payload"."tags_rels" USING btree ("parent_id");
  CREATE INDEX "tags_rels_path_idx" ON "payload"."tags_rels" USING btree ("path");
  CREATE INDEX "tags_rels_admins_id_idx" ON "payload"."tags_rels" USING btree ("admins_id");
  CREATE INDEX "tags_rels_users_id_idx" ON "payload"."tags_rels" USING btree ("users_id");
  CREATE INDEX "_tags_v_parent_idx" ON "payload"."_tags_v" USING btree ("parent_id");
  CREATE INDEX "_tags_v_version_version__h_tags_idx" ON "payload"."_tags_v" USING btree ("version__h_tags_id");
  CREATE INDEX "_tags_v_version_version_updated_at_idx" ON "payload"."_tags_v" USING btree ("version_updated_at");
  CREATE INDEX "_tags_v_version_version_created_at_idx" ON "payload"."_tags_v" USING btree ("version_created_at");
  CREATE INDEX "_tags_v_created_at_idx" ON "payload"."_tags_v" USING btree ("created_at");
  CREATE INDEX "_tags_v_updated_at_idx" ON "payload"."_tags_v" USING btree ("updated_at");
  CREATE INDEX "_tags_v_rels_order_idx" ON "payload"."_tags_v_rels" USING btree ("order");
  CREATE INDEX "_tags_v_rels_parent_idx" ON "payload"."_tags_v_rels" USING btree ("parent_id");
  CREATE INDEX "_tags_v_rels_path_idx" ON "payload"."_tags_v_rels" USING btree ("path");
  CREATE INDEX "_tags_v_rels_admins_id_idx" ON "payload"."_tags_v_rels" USING btree ("admins_id");
  CREATE INDEX "_tags_v_rels_users_id_idx" ON "payload"."_tags_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_therapist_profiles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("therapist_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_chat_conversations_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("chat_conversations_id");
  CREATE INDEX "payload_locked_documents_rels_chat_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("chat_messages_id");
  CREATE INDEX "payload_locked_documents_rels_client_feedback_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("client_feedback_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_folders_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("folders_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload"."payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_entity_slug_idx" ON "payload"."payload_llm_instructions" USING btree ("entity_slug");
  CREATE INDEX "payload_llm_instructions_updated_at_idx" ON "payload"."payload_llm_instructions" USING btree ("updated_at");
  CREATE INDEX "payload_llm_instructions_created_at_idx" ON "payload"."payload_llm_instructions" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_rels_order_idx" ON "payload"."payload_llm_instructions_rels" USING btree ("order");
  CREATE INDEX "payload_llm_instructions_rels_parent_idx" ON "payload"."payload_llm_instructions_rels" USING btree ("parent_id");
  CREATE INDEX "payload_llm_instructions_rels_path_idx" ON "payload"."payload_llm_instructions_rels" USING btree ("path");
  CREATE INDEX "payload_llm_instructions_rels_admins_id_idx" ON "payload"."payload_llm_instructions_rels" USING btree ("admins_id");
  CREATE INDEX "payload_llm_instructions_rels_users_id_idx" ON "payload"."payload_llm_instructions_rels" USING btree ("users_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."admins_sessions" CASCADE;
  DROP TABLE "payload"."admins" CASCADE;
  DROP TABLE "payload"."admins_rels" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."users_rels" CASCADE;
  DROP TABLE "payload"."therapist_profiles_education" CASCADE;
  DROP TABLE "payload"."therapist_profiles_categories" CASCADE;
  DROP TABLE "payload"."therapist_profiles_specializations" CASCADE;
  DROP TABLE "payload"."therapist_profiles_format" CASCADE;
  DROP TABLE "payload"."therapist_profiles_chat_availability" CASCADE;
  DROP TABLE "payload"."therapist_profiles" CASCADE;
  DROP TABLE "payload"."therapist_profiles_texts" CASCADE;
  DROP TABLE "payload"."therapist_profiles_rels" CASCADE;
  DROP TABLE "payload"."bookings" CASCADE;
  DROP TABLE "payload"."bookings_rels" CASCADE;
  DROP TABLE "payload"."chat_conversations" CASCADE;
  DROP TABLE "payload"."chat_conversations_rels" CASCADE;
  DROP TABLE "payload"."chat_messages" CASCADE;
  DROP TABLE "payload"."chat_messages_rels" CASCADE;
  DROP TABLE "payload"."client_feedback" CASCADE;
  DROP TABLE "payload"."client_feedback_rels" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."media_rels" CASCADE;
  DROP TABLE "payload"."_media_v" CASCADE;
  DROP TABLE "payload"."_media_v_rels" CASCADE;
  DROP TABLE "payload"."folders" CASCADE;
  DROP TABLE "payload"."folders_rels" CASCADE;
  DROP TABLE "payload"."_folders_v" CASCADE;
  DROP TABLE "payload"."_folders_v_rels" CASCADE;
  DROP TABLE "payload"."tags" CASCADE;
  DROP TABLE "payload"."tags_rels" CASCADE;
  DROP TABLE "payload"."_tags_v" CASCADE;
  DROP TABLE "payload"."_tags_v_rels" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."payload_llm_instructions" CASCADE;
  DROP TABLE "payload"."payload_llm_instructions_rels" CASCADE;
  DROP TYPE "payload"."_locales";
  DROP TYPE "payload"."enum_users_account_type";
  DROP TYPE "payload"."enum_therapist_profiles_categories";
  DROP TYPE "payload"."enum_therapist_profiles_specializations";
  DROP TYPE "payload"."enum_therapist_profiles_format";
  DROP TYPE "payload"."enum_therapist_profiles_chat_availability_day";
  DROP TYPE "payload"."enum_therapist_profiles_status";
  DROP TYPE "payload"."enum_therapist_profiles_gender";
  DROP TYPE "payload"."enum_therapist_profiles_age_group";
  DROP TYPE "payload"."enum_therapist_profiles_meeting_provider";
  DROP TYPE "payload"."enum_bookings_format";
  DROP TYPE "payload"."enum_bookings_payment_method";
  DROP TYPE "payload"."enum_bookings_status";
  DROP TYPE "payload"."enum_chat_conversations_status";
  DROP TYPE "payload"."enum_chat_messages_sender_role";
  DROP TYPE "payload"."enum_payload_llm_instructions_entity_type";`)
}
