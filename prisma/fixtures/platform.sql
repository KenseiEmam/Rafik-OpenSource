-- Synthetic local platform operator. Never seed on hosting.
INSERT INTO identity.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES('10000000-0000-4000-8000-000000000009','operator@rafik.test',now(),'{"display_name":"Amina · local operator"}');
INSERT INTO public.profiles(id,display_name) VALUES('10000000-0000-4000-8000-000000000009','Amina · local operator');
INSERT INTO public.platform_grants(user_id) VALUES('10000000-0000-4000-8000-000000000009');
