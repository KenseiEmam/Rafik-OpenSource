-- Synthetic LOCAL runtime switch. Never apply fixture files to hosting.
update public.runtime_settings set local_simulation=true where id=true;
