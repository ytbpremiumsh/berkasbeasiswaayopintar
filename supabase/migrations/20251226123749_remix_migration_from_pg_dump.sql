CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: applicant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.applicant_status AS ENUM (
    'pelajar',
    'gap_year',
    'mahasiswa'
);


--
-- Name: scholarship_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.scholarship_category AS ENUM (
    'prestasi',
    'yatim',
    'ekonomi',
    'umum'
);


--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status AS ENUM (
    'menunggu',
    'diverifikasi',
    'ditolak'
);


--
-- Name: token_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.token_status AS ENUM (
    'valid',
    'digunakan',
    'tidak_valid'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: category_urls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_urls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category public.scholarship_category NOT NULL,
    custom_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(20) NOT NULL,
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT form_fields_category_check CHECK (((category)::text = ANY ((ARRAY['prestasi'::character varying, 'yatim'::character varying, 'ekonomi'::character varying, 'umum'::character varying])::text[]))),
    CONSTRAINT form_fields_field_type_check CHECK (((field_type)::text = ANY ((ARRAY['text'::character varying, 'textarea'::character varying, 'file'::character varying, 'url'::character varying])::text[])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scholarship_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scholarship_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_id uuid NOT NULL,
    category public.scholarship_category NOT NULL,
    applicant_status public.applicant_status NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    kartu_pelajar_url text,
    ktm_url text,
    cv_url text,
    sertifikat_prestasi_url text,
    transkrip_nilai_url text,
    khs_url text,
    essay text,
    bukti_penghasilan_url text,
    bukti_listrik_url text,
    surat_keterangan_yatim_url text,
    sktm_url text,
    video_tiktok_url text,
    berkas_pendukung_url text,
    bukti_struk_url text,
    status public.submission_status DEFAULT 'menunggu'::public.submission_status NOT NULL,
    admin_notes text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scholarship_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scholarship_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_code text NOT NULL,
    category public.scholarship_category NOT NULL,
    status public.token_status DEFAULT 'valid'::public.token_status NOT NULL,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: success_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.success_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying NOT NULL,
    title text DEFAULT 'Berkas Terkirim!'::text NOT NULL,
    description text DEFAULT 'Pengajuan beasiswa Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.'::text NOT NULL,
    note text DEFAULT 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.'::text,
    button_text text DEFAULT 'Kembali ke Beranda'::text NOT NULL,
    button_link text DEFAULT '/'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: category_urls category_urls_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_urls
    ADD CONSTRAINT category_urls_category_key UNIQUE (category);


--
-- Name: category_urls category_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_urls
    ADD CONSTRAINT category_urls_pkey PRIMARY KEY (id);


--
-- Name: form_fields form_fields_category_field_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_category_field_name_key UNIQUE (category, field_name);


--
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: scholarship_submissions scholarship_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_submissions
    ADD CONSTRAINT scholarship_submissions_pkey PRIMARY KEY (id);


--
-- Name: scholarship_tokens scholarship_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_tokens
    ADD CONSTRAINT scholarship_tokens_pkey PRIMARY KEY (id);


--
-- Name: scholarship_tokens scholarship_tokens_token_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_tokens
    ADD CONSTRAINT scholarship_tokens_token_code_key UNIQUE (token_code);


--
-- Name: success_templates success_templates_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_templates
    ADD CONSTRAINT success_templates_category_key UNIQUE (category);


--
-- Name: success_templates success_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_templates
    ADD CONSTRAINT success_templates_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: form_fields update_form_fields_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON public.form_fields FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: admin_settings update_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: scholarship_submissions update_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.scholarship_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: success_templates update_success_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_success_templates_updated_at BEFORE UPDATE ON public.success_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: category_urls update_urls_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_urls_updated_at BEFORE UPDATE ON public.category_urls FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scholarship_submissions scholarship_submissions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_submissions
    ADD CONSTRAINT scholarship_submissions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.scholarship_tokens(id);


--
-- Name: scholarship_tokens scholarship_tokens_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scholarship_tokens
    ADD CONSTRAINT scholarship_tokens_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: category_urls Admins can manage category URLs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage category URLs" ON public.category_urls USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: form_fields Admins can manage form fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage form fields" ON public.form_fields USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage settings" ON public.admin_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: success_templates Admins can manage success templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage success templates" ON public.success_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: scholarship_tokens Admins can manage tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tokens" ON public.scholarship_tokens USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: scholarship_submissions Admins can update submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update submissions" ON public.scholarship_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: scholarship_submissions Admins can view all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all submissions" ON public.scholarship_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Anyone can read URL settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read URL settings" ON public.admin_settings FOR SELECT USING ((setting_key ~~ 'url_%'::text));


--
-- Name: scholarship_tokens Anyone can validate tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can validate tokens" ON public.scholarship_tokens FOR SELECT USING (true);


--
-- Name: form_fields Anyone can view active form fields; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active form fields" ON public.form_fields FOR SELECT USING ((is_active = true));


--
-- Name: category_urls Anyone can view category URLs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view category URLs" ON public.category_urls FOR SELECT USING (true);


--
-- Name: success_templates Anyone can view success templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view success templates" ON public.success_templates FOR SELECT USING ((is_active = true));


--
-- Name: scholarship_tokens Authenticated users can update token status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update token status" ON public.scholarship_tokens FOR UPDATE USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: scholarship_submissions Users can create own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own submissions" ON public.scholarship_submissions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scholarship_submissions Users can view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own submissions" ON public.scholarship_submissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: category_urls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.category_urls ENABLE ROW LEVEL SECURITY;

--
-- Name: form_fields; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: scholarship_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scholarship_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: scholarship_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scholarship_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: success_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.success_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;