-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE "supported_languages" AS ENUM ('SPANISH', 'ENGLISH');
CREATE TYPE "application_theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- Users
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "first_name" varchar(50) NOT NULL,
    "last_name" varchar(50) NOT NULL,
    "email" text UNIQUE NOT NULL,
    "pair_code" varchar(8) UNIQUE NOT NULL,
    "created_on" timestamptz NOT NULL DEFAULT now(),
    "last_updated_on" timestamptz DEFAULT now()
);

-- Relationships
CREATE TABLE "relationships" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_one_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id"),
    "user_two_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id"),
    CONSTRAINT "no_self_relationship" CHECK (user_one_id != user_two_id)
);

-- User Settings
CREATE TABLE "user_settings" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id"),
    "privacy_mode" boolean DEFAULT true,
    "preferred_language" supported_languages NOT NULL DEFAULT 'ENGLISH',
    "app_theme" application_theme NOT NULL DEFAULT 'SYSTEM',
    "timezone" text NOT NULL DEFAULT 'UTC'
);

-- Feature: Nutrition (Meals)
CREATE TABLE "consumed_meals" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "name" varchar(100) NOT NULL,
    "kcal" integer,
    "consumption_date" date NOT NULL,
    "photo_url" text NOT NULL
);

-- Feature: Nutrition (Streaks)
CREATE TABLE "nutrition_streaks" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "log_date" date NOT NULL,
    CONSTRAINT "unique_user_log_date" UNIQUE ("user_id", "log_date")
);

-- Feature: Hydration
CREATE TABLE "hydration_logs" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "date" date NOT NULL,
    "amount_ml" integer NOT NULL DEFAULT 250,
    "logged_at" timestamptz DEFAULT now()
);

-- Feature: Workouts
CREATE TABLE "physical_activities" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "name" varchar(100) NOT NULL,
    "date" date NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "photo_url" text NOT NULL
);

-- Feature: Progress (Photos)
CREATE TABLE "progress_photos" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "front_photo_url" text NOT NULL,
    "side_photo_url" text NOT NULL,
    "back_photo_url" text NOT NULL,
    "captured_date" date NOT NULL
);

-- Feature: Progress (Weight/Stats)
CREATE TABLE "progress_weight" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id"),
    "weight_kg" decimal NOT NULL,
    "weight_lb" decimal NOT NULL,
    "body_fat" decimal,
    "recorded_date" date NOT NULL
);
