import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA public, storage TO anon, authenticated, service_role;
CREATE TABLE public.admin_settings(id serial PRIMARY KEY, setting_key text UNIQUE, setting_value jsonb, updated_at timestamptz DEFAULT now());
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.scholarship_tokens(id int PRIMARY KEY, status text DEFAULT 'valid', used_at timestamptz);
CREATE TABLE public.scholarship_submissions(id serial PRIMARY KEY, token_id int, full_name text CHECK (full_name <> 'invalid'), status text DEFAULT 'menunggu');
CREATE TABLE public.registrations(id serial PRIMARY KEY, name text);
CREATE TABLE storage.objects(id int PRIMARY KEY, bucket_id text, name text);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY existing_upload ON storage.objects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT ON public.admin_settings TO anon, authenticated, service_role;
GRANT ALL ON public.scholarship_tokens, public.scholarship_submissions, public.registrations, storage.objects TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
INSERT INTO public.admin_settings(setting_key,setting_value) VALUES ('mayar_api_key','{"value":"secret-fixture"}');
INSERT INTO public.scholarship_tokens(id) VALUES (1),(2),(3),(4);
`);
await db.exec(await readFile(new URL('../supabase/migrations/20260831033212_registration_closure.sql', import.meta.url),'utf8'));
let count=0;
async function check(name, fn){await fn(); count++; console.log('PASS',name)}
async function rejects(sql, match){await assert.rejects(()=>db.exec(sql),match)}
await check('Public reads only the non-sensitive registration setting',async()=>{
 await db.exec('SET ROLE anon');
 assert.deepEqual((await db.query('SELECT setting_key FROM public.admin_settings')).rows.map(r=>r.setting_key),['registration_status']);
 await rejects("UPDATE public.admin_settings SET setting_value='{}'",/permission denied/);
 await db.exec('RESET ROLE');
});
await check('Open: registration and file upload accepted',async()=>{
 await db.exec("SET ROLE anon; INSERT INTO public.registrations(name) VALUES ('test'); INSERT INTO storage.objects VALUES (1,'scholarship-documents','one.pdf'); RESET ROLE;");
});
await check('Open: submission consumes token atomically',async()=>{
 await db.exec("SET ROLE service_role; INSERT INTO public.scholarship_submissions(token_id,full_name) VALUES (1,'test'); RESET ROLE;");
 assert.equal((await db.query('SELECT status FROM public.scholarship_tokens WHERE id=1')).rows[0].status,'digunakan');
});
await check('Duplicate token is rejected without creating a second submission',async()=>{
 await rejects("INSERT INTO public.scholarship_submissions(token_id,full_name) VALUES (1,'duplicate')",/Token sudah/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.scholarship_submissions')).rows[0].n,1);
});
await check('Failed insert leaves token valid',async()=>{
 await rejects("INSERT INTO public.scholarship_submissions(token_id,full_name) VALUES (2,'invalid')",/check constraint/);
 assert.equal((await db.query('SELECT status FROM public.scholarship_tokens WHERE id=2')).rows[0].status,'valid');
});
await db.exec(`UPDATE public.admin_settings SET setting_value='{"is_open":false,"closed_message":"Maaf, periode ini sudah ditutup."}' WHERE setting_key='registration_status'`);
await check('Closed: direct service-role submission rejected with custom message',async()=>{
 await db.exec('SET ROLE service_role');
 await rejects("INSERT INTO public.scholarship_submissions(token_id,full_name) VALUES (2,'test')",/Maaf, periode ini/);
 await db.exec('RESET ROLE');
 assert.equal((await db.query('SELECT status FROM public.scholarship_tokens WHERE id=2')).rows[0].status,'valid');
});
await check('Closed: anonymous registration rejected',async()=>{
 await db.exec('SET ROLE anon'); await rejects("INSERT INTO public.registrations(name) VALUES ('test')",/Maaf, periode ini/); await db.exec('RESET ROLE');
});
await check('Closed: legacy token consumption rejected',async()=>{
 await db.exec('SET ROLE service_role'); await rejects("UPDATE public.scholarship_tokens SET status='digunakan' WHERE id=3",/Maaf, periode ini/); await db.exec('RESET ROLE');
});
for(const role of ['anon','authenticated']) await check(`Closed: ${role} upload and overwrite blocked despite permissive policy`,async()=>{
 await db.exec(`SET ROLE ${role}`);
 await rejects("INSERT INTO storage.objects VALUES (2,'scholarship-documents','two.pdf')",/row-level security/);
 await db.exec("UPDATE storage.objects SET name='overwrite.pdf' WHERE id=1");
 await rejects("INSERT INTO storage.objects VALUES (1,'scholarship-documents','upsert.pdf') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name",/row-level security/);
 assert.equal((await db.query('SELECT name FROM storage.objects WHERE id=1')).rows[0].name,'one.pdf');
 await db.exec('RESET ROLE');
});
await check('Closed: existing files readable, other bucket writable, admin review unaffected',async()=>{
 await db.exec("SET ROLE authenticated; INSERT INTO storage.objects VALUES (3,'banners','banner.png'); RESET ROLE; UPDATE public.scholarship_submissions SET status='diverifikasi' WHERE token_id=1;");
 assert.equal((await db.query('SELECT count(*)::int AS n FROM storage.objects')).rows[0].n,2);
});
await check('Reopen: uploads and submissions resume',async()=>{
 await db.exec(`UPDATE public.admin_settings SET setting_value='{"is_open":true}' WHERE setting_key='registration_status'; SET ROLE anon; INSERT INTO storage.objects VALUES (4,'scholarship-documents','four.pdf'); RESET ROLE; INSERT INTO public.scholarship_submissions(token_id,full_name) VALUES (3,'test');`);
});
await check('Missing or malformed setting fails closed',async()=>{
 await db.exec("UPDATE public.admin_settings SET setting_value='{}' WHERE setting_key='registration_status'");
 await rejects("INSERT INTO public.registrations(name) VALUES ('test')",/telah ditutup/);
 await db.exec("DELETE FROM public.admin_settings WHERE setting_key='registration_status'");
 await rejects("INSERT INTO public.registrations(name) VALUES ('test')",/telah ditutup/);
});
console.log(`${count} database regression scenarios passed (isolated PostgreSQL/PGlite).`);
await db.close();
