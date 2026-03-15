-- ============================================================
-- MedCompli Platform — Full Supabase Schema Export
-- Run this in your own Supabase project's SQL Editor
-- ============================================================

-- ========================
-- 1. ENUMS
-- ========================
CREATE TYPE public.enterprise_type AS ENUM ('hospital', 'medical_school', 'government', 'individual');
CREATE TYPE public.enterprise_role AS ENUM ('admin', 'compliance_officer', 'department_manager', 'staff');
CREATE TYPE public.platform_role AS ENUM ('platform_admin', 'user');


-- ========================
-- 2. TABLES
-- ========================

-- Enterprises
CREATE TABLE public.enterprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type enterprise_type NOT NULL DEFAULT 'individual',
  domain text,
  contact_email text,
  license_seats integer NOT NULL DEFAULT 1,
  used_seats integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,  -- matches auth.users.id
  email text NOT NULL,
  full_name text,
  job_title text,
  enterprise_id uuid REFERENCES public.enterprises(id),
  role enterprise_role NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Platform Roles (separate from enterprise roles)
CREATE TABLE public.platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role platform_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Books
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  authors text[] NOT NULL DEFAULT '{}',
  publisher text,
  isbn text,
  edition text,
  published_year integer,
  description text DEFAULT '',
  specialty text DEFAULT 'Internal Medicine',
  tags text[] DEFAULT '{}',
  cover_color text DEFAULT 'hsl(213 50% 25%)',
  cover_url text,
  file_path text,
  file_type text DEFAULT 'epub',
  chapter_count integer DEFAULT 0,
  access_count integer DEFAULT 0,
  search_count integer DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Book Chapters
CREATE TABLE public.book_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id),
  chapter_key text NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  page_number integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Book Access (enterprise-level)
CREATE TABLE public.book_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  enterprise_id uuid NOT NULL REFERENCES public.enterprises(id),
  access_level text NOT NULL DEFAULT 'full',
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Individual Purchases
CREATE TABLE public.individual_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  book_id text NOT NULL,
  price_paid numeric NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  enterprise_id uuid REFERENCES public.enterprises(id),
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  monthly_price numeric,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES public.enterprises(id),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Department Membership
CREATE TABLE public.user_department_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  department_id uuid NOT NULL REFERENCES public.departments(id),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compliance Collections
CREATE TABLE public.compliance_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  icon text,
  is_system_bundle boolean NOT NULL DEFAULT false,
  enterprise_id uuid REFERENCES public.enterprises(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Collection Books (junction)
CREATE TABLE public.collection_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.compliance_collections(id),
  book_id text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);

-- Usage Events
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  enterprise_id uuid,
  event_type text NOT NULL,
  book_id uuid,
  book_title text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  enterprise_id uuid REFERENCES public.enterprises(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  target_title text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Query Logs
CREATE TABLE public.ai_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  book_title text NOT NULL,
  chapter_id text NOT NULL,
  chapter_title text NOT NULL,
  query_type text NOT NULL,
  user_prompt text,
  ai_response text NOT NULL,
  model_used text NOT NULL,
  response_time_ms integer NOT NULL,
  tokens_used integer,
  user_id uuid,
  enterprise_id uuid REFERENCES public.enterprises(id),
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ========================
-- 3. DATABASE FUNCTIONS
-- ========================

CREATE OR REPLACE FUNCTION public.get_user_enterprise_id(user_uuid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT enterprise_id FROM public.profiles WHERE id = user_uuid
$$;

CREATE OR REPLACE FUNCTION public.has_enterprise_role(user_uuid uuid, required_role enterprise_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid AND role = required_role)
$$;

CREATE OR REPLACE FUNCTION public.is_enterprise_admin(user_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_compliance_officer(user_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid AND role = 'compliance_officer')
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = user_uuid AND role = 'platform_admin')
$$;

CREATE OR REPLACE FUNCTION public.has_book_access(user_uuid uuid, target_book_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.book_access ba
    JOIN public.profiles p ON p.enterprise_id = ba.enterprise_id
    WHERE p.id = user_uuid AND ba.book_id = target_book_id
      AND (ba.expires_at IS NULL OR ba.expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.individual_purchases ip
    WHERE ip.user_id = user_uuid AND ip.book_id = target_book_id
  ) OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE (s.user_id = user_uuid OR s.enterprise_id = (SELECT enterprise_id FROM public.profiles WHERE id = user_uuid))
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.platform_roles (user_id, role)
  VALUES (NEW.id, 'platform_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ========================
-- 4. TRIGGERS
-- ========================
-- NOTE: Create these triggers on your own Supabase instance:

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-assign platform_admin role on signup
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Auto-update updated_at on enterprises
CREATE TRIGGER update_enterprises_updated_at
  BEFORE UPDATE ON public.enterprises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ========================
-- 5. ROW LEVEL SECURITY
-- ========================

-- Enable RLS on all tables
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_department_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;

-- === enterprises ===
CREATE POLICY "Platform admins can manage enterprises" ON public.enterprises FOR ALL USING (is_platform_admin(auth.uid()));
CREATE POLICY "Users can view their own enterprise" ON public.enterprises FOR SELECT USING ((id = get_user_enterprise_id(auth.uid())) OR is_platform_admin(auth.uid()));

-- === profiles ===
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can view enterprise members" ON public.profiles FOR SELECT USING (enterprise_id = get_user_enterprise_id(auth.uid()));
CREATE POLICY "Enterprise admins can manage members" ON public.profiles FOR ALL USING (is_enterprise_admin(auth.uid()) AND enterprise_id = get_user_enterprise_id(auth.uid()));

-- === platform_roles ===
CREATE POLICY "Only platform admins can view platform roles" ON public.platform_roles FOR SELECT USING ((user_id = auth.uid()) OR is_platform_admin(auth.uid()));

-- === books ===
CREATE POLICY "Anyone authenticated can view books" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enterprise admins can insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (is_enterprise_admin(auth.uid()) OR is_platform_admin(auth.uid()));
CREATE POLICY "Enterprise admins can update books" ON public.books FOR UPDATE TO authenticated USING (is_enterprise_admin(auth.uid()) OR is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can manage books" ON public.books FOR ALL TO authenticated USING (is_platform_admin(auth.uid()));

-- === book_chapters ===
CREATE POLICY "Anyone authenticated can view chapters" ON public.book_chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enterprise admins can insert chapters" ON public.book_chapters FOR INSERT TO authenticated WITH CHECK (is_enterprise_admin(auth.uid()) OR is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can manage chapters" ON public.book_chapters FOR ALL TO authenticated USING (is_platform_admin(auth.uid()));

-- === book_access ===
CREATE POLICY "Enterprise admins can manage book access" ON public.book_access FOR ALL USING (is_enterprise_admin(auth.uid()) AND enterprise_id = get_user_enterprise_id(auth.uid()));
CREATE POLICY "Users can view their enterprise book access" ON public.book_access FOR SELECT USING (enterprise_id = get_user_enterprise_id(auth.uid()));

-- === individual_purchases ===
CREATE POLICY "Users can view their own purchases" ON public.individual_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own purchases" ON public.individual_purchases FOR INSERT WITH CHECK (user_id = auth.uid());

-- === subscriptions ===
CREATE POLICY "Users can view their subscriptions" ON public.subscriptions FOR SELECT USING ((user_id = auth.uid()) OR (enterprise_id = get_user_enterprise_id(auth.uid())));

-- === departments ===
CREATE POLICY "Users can view their enterprise departments" ON public.departments FOR SELECT USING (enterprise_id = get_user_enterprise_id(auth.uid()));
CREATE POLICY "Enterprise admins can manage departments" ON public.departments FOR ALL USING (is_enterprise_admin(auth.uid()) AND enterprise_id = get_user_enterprise_id(auth.uid()));

-- === user_department_membership ===
CREATE POLICY "Users can view their department memberships" ON public.user_department_membership FOR SELECT USING ((user_id = auth.uid()) OR (department_id IN (SELECT id FROM departments WHERE enterprise_id = get_user_enterprise_id(auth.uid()))));
CREATE POLICY "Enterprise admins can manage memberships" ON public.user_department_membership FOR ALL USING (is_enterprise_admin(auth.uid()) AND (department_id IN (SELECT id FROM departments WHERE enterprise_id = get_user_enterprise_id(auth.uid()))));

-- === compliance_collections ===
CREATE POLICY "Users can view system bundles and their enterprise collections" ON public.compliance_collections FOR SELECT USING ((is_system_bundle = true) OR (enterprise_id IS NULL) OR (enterprise_id = get_user_enterprise_id(auth.uid())));
CREATE POLICY "Admins and compliance officers can manage collections" ON public.compliance_collections FOR ALL USING ((is_enterprise_admin(auth.uid()) OR is_compliance_officer(auth.uid())) AND (enterprise_id = get_user_enterprise_id(auth.uid())));

-- === collection_books ===
CREATE POLICY "Users can view collection books" ON public.collection_books FOR SELECT USING (collection_id IN (SELECT id FROM compliance_collections WHERE is_system_bundle = true OR enterprise_id IS NULL OR enterprise_id = get_user_enterprise_id(auth.uid())));
CREATE POLICY "Admins can manage collection books" ON public.collection_books FOR ALL USING ((collection_id IN (SELECT id FROM compliance_collections WHERE enterprise_id = get_user_enterprise_id(auth.uid()))) AND (is_enterprise_admin(auth.uid()) OR is_compliance_officer(auth.uid())));

-- === usage_events ===
CREATE POLICY "Users can insert usage events" ON public.usage_events FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));
CREATE POLICY "Enterprise users can view usage" ON public.usage_events FOR SELECT TO authenticated USING ((enterprise_id = get_user_enterprise_id(auth.uid())) OR (user_id = auth.uid()) OR is_platform_admin(auth.uid()) OR is_enterprise_admin(auth.uid()) OR is_compliance_officer(auth.uid()));

-- === audit_logs ===
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));
CREATE POLICY "Users can view their enterprise audit logs" ON public.audit_logs FOR SELECT USING ((enterprise_id = get_user_enterprise_id(auth.uid())) OR ((enterprise_id IS NULL) AND (user_id = auth.uid())));

-- === ai_query_logs ===
CREATE POLICY "Users can insert ai query logs" ON public.ai_query_logs FOR INSERT WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));
CREATE POLICY "Users can view enterprise ai logs" ON public.ai_query_logs FOR SELECT USING ((enterprise_id = get_user_enterprise_id(auth.uid())) OR ((enterprise_id IS NULL) AND (user_id = auth.uid())) OR (user_id IS NULL));


-- ========================
-- 6. STORAGE
-- ========================
-- Create a private storage bucket for book files:
INSERT INTO storage.buckets (id, name, public) VALUES ('book-files', 'book-files', false);

-- Storage RLS (adjust as needed):
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload book files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'book-files');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read book files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'book-files');


-- ========================
-- 7. AUTH SETTINGS (configure in Supabase Dashboard)
-- ========================
-- • Enable Email auth provider
-- • Enable "Auto-confirm email" for demo (disable for production)
-- • Set Site URL to your domain
-- • Add redirect URLs for your domain
