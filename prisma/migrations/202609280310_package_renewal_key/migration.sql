-- Match the composite tenant/member reference on the defining side of the
-- renewal relation. The referenced source already fixes tenant and member.
alter table public.organization_packages
 drop constraint organization_packages_renewed_from_key,
 add constraint organization_package_renewal unique(workspace_id,member_id,renewed_from);
