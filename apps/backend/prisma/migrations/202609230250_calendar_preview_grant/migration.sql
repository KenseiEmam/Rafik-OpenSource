-- Reuse the pure timezone preview from the explicit organization API role.
grant execute on function public.availability_preview(timestamp,text,integer,integer,integer) to rafik_api;
