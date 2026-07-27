CREATE TYPE "public"."device_brand" AS ENUM('zkteco', 'hikvision', 'suprema');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('check_in', 'check_out', 'unknown');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid,
	"device_id" uuid NOT NULL,
	"raw_device_user_id" text NOT NULL,
	"event_time" timestamp with time zone NOT NULL,
	"event_type" "event_type" DEFAULT 'unknown' NOT NULL,
	"verify_method" text,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_user_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"device_user_id" text NOT NULL,
	"employee_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"brand" "device_brand" NOT NULL,
	"serial_number" text NOT NULL,
	"name" text NOT NULL,
	"site_name" text,
	"external_ref" text,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"employee_code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_cursors" (
	"device_id" uuid PRIMARY KEY NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_user_map" ADD CONSTRAINT "device_user_map_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_user_map" ADD CONSTRAINT "device_user_map_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_cursors" ADD CONSTRAINT "sync_cursors_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_events_company_time_idx" ON "attendance_events" USING btree ("company_id","event_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_events_employee_time_idx" ON "attendance_events" USING btree ("employee_id","event_time");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_user_map_idx" ON "device_user_map" USING btree ("device_id","device_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "devices_serial_idx" ON "devices" USING btree ("serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "employees_company_code_idx" ON "employees" USING btree ("company_id","employee_code");