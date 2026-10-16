-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.set_user_organization()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
  user_domain text;
  org_id int8;
begin
  -- Extract domain from the user's email
  user_domain := split_part(new.email, '@', 2);

  -- Look for an organization with a matching domain
  select id into org_id
  from public.organizations
  where user_domain = any(domains)
  limit 1;

  -- If found, update the organization column
  if org_id is not null then
    update public.users
    set organization = org_id
    where id = new.id;
  end if;

  return new;
end;$function$
;
