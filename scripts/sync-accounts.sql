-- Master Account Synchronization & Password Standardization
-- Run directly via psql

BEGIN;

-- 1. Ensure pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Bulk Update all existing users to the new password
UPDATE auth.users 
SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now());

-- 3. Provision / Reset Special Creators 
-- These are ensure to have specific IDs for data linking.

-- fene310
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES ('a5000001-0001-4000-8000-0000000fe310', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fene310@hubcity.app', crypt('HubCity2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')), email = 'fene310@hubcity.app';

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a5000001-0001-4000-8000-0000000fe310', 
  'a5000001-0001-4000-8000-0000000fe310', 
  'a5000001-0001-4000-8000-0000000fe310', 
  'email', 
  jsonb_build_object('sub', 'a5000001-0001-4000-8000-0000000fe310', 'email', 'fene310@hubcity.app'), 
  now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, display_name, handle, role, verification_status, city, state, is_creator, onboarding_completed)
VALUES ('a5000001-0001-4000-8000-0000000fe310', 'fene310', 'fene310', 'content_creator', 'verified', 'Compton', 'CA', true, true)
ON CONFLICT (id) DO UPDATE SET role = 'content_creator', verification_status = 'verified', is_creator = true, onboarding_completed = true;

-- comptonmuseum
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES ('a5000002-0002-4000-8000-000000ca4d01', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'comptonmuseum@hubcity.app', crypt('HubCity2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')), email = 'comptonmuseum@hubcity.app';

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES ('a5000002-0002-4000-8000-000000ca4d01', 'a5000002-0002-4000-8000-000000ca4d01', 'a5000002-0002-4000-8000-000000ca4d01', 'email', jsonb_build_object('sub', 'a5000002-0002-4000-8000-000000ca4d01', 'email', 'comptonmuseum@hubcity.app'), now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, display_name, handle, role, verification_status, city, state, is_creator, onboarding_completed)
VALUES ('a5000002-0002-4000-8000-000000ca4d01', 'Compton Art & History Museum', 'comptonmuseum', 'city_ambassador', 'verified', 'Compton', 'CA', true, true)
ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified', is_creator = true, onboarding_completed = true;

-- dominguez
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES ('b2000001-0002-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dominguez@hubcity.app', crypt('HubCity2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')), email = 'dominguez@hubcity.app';

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES ('b2000001-0002-4000-8000-000000000002', 'b2000001-0002-4000-8000-000000000002', 'b2000001-0002-4000-8000-000000000002', 'email', jsonb_build_object('sub', 'b2000001-0002-4000-8000-000000000002', 'email', 'dominguez@hubcity.app'), now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, display_name, handle, role, verification_status, city, state, is_creator, onboarding_completed)
VALUES ('b2000001-0002-4000-8000-000000000002', 'Dominguez High School', 'dominguez_high', 'city_ambassador', 'verified', 'Compton', 'CA', true, true)
ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified', is_creator = true, onboarding_completed = true;

-- tonythe1 (Fake Smiles)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES ('a6000001-0001-4000-8000-000000000310', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tonythe1@hubcity.app', crypt('HubCity2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, false)
ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')), email = 'tonythe1@hubcity.app';

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES ('a6000001-0001-4000-8000-000000000310', 'a6000001-0001-4000-8000-000000000310', 'a6000001-0001-4000-8000-000000000310', 'email', jsonb_build_object('sub', 'a6000001-0001-4000-8000-000000000310', 'email', 'tonythe1@hubcity.app'), now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, display_name, handle, role, verification_status, city, state, is_creator, onboarding_completed)
VALUES ('a6000001-0001-4000-8000-000000000310', 'Fake Smiles', 'fakesmiles', 'business_owner', 'verified', 'Compton', 'CA', true, true)
ON CONFLICT (id) DO UPDATE SET role = 'business_owner', verification_status = 'verified', is_creator = true, onboarding_completed = true;

COMMIT;
