-- Solo los administradores aprobados pueden eliminar definitivamente una salida.
-- Las inscripciones, mensajes y avisos asociados se eliminan por ON DELETE CASCADE.
begin;

grant delete on public.club_rides to authenticated;

drop policy if exists club_rides_delete_admin on public.club_rides;
create policy club_rides_delete_admin on public.club_rides
  for delete to authenticated
  using ((select club_private.approved_role()) = 'admin');

notify pgrst, 'reload schema';
commit;

select 'Borrado definitivo de salidas habilitado solo para administradores' as resultado;
