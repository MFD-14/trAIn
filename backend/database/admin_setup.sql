-- ============================================================
-- trAIn Admin Setup Script
-- Run this AFTER main schema.sql and monetization_schema.sql
-- ============================================================

-- Update users table to allow 'admin' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'client', 'admin'));

-- -----------------------------------------------
-- CREATE OWNER ADMIN ACCOUNT
-- Email:    admin@train-app.com
-- Password: TrainAdmin2024! (change after first login!)
-- -----------------------------------------------
INSERT INTO users (
  id, email, password, first_name, last_name, role
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'admin@train-app.com',
  -- bcrypt hash of 'TrainAdmin2024!'
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Platform',
  'Owner',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- -----------------------------------------------
-- RUN MONETIZATION SCHEMA
-- (Idempotent - safe to run multiple times)
-- -----------------------------------------------
-- monetization_settings table is created in monetization_schema.sql

-- Confirm setup
SELECT
  'Admin account ready' AS status,
  email,
  role
FROM users
WHERE role = 'admin';

SELECT
  strategy_name,
  is_enabled AS active
FROM monetization_settings
ORDER BY CASE strategy_key
  WHEN 'platform_commission'    THEN 1
  WHEN 'company_subscriptions'  THEN 2
  WHEN 'premium_trainers'       THEN 3
  WHEN 'data_quality_guarantee' THEN 4
  WHEN 'featured_listings'      THEN 5
  WHEN 'api_access'             THEN 6
END;
