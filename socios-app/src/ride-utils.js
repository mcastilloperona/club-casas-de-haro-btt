export function madridInput(iso) {
  if (!iso) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// La hora del club siempre es Madrid, también si el navegador está en otro huso.
// Las horas inexistentes/ambiguas durante cambios de horario se rechazan.
export function madridToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Revisa la fecha y hora.');
  const naive = Date.parse(`${value}:00Z`);
  const candidates = [60, 120].map(offset => new Date(naive - offset * 60000))
    .filter(date => !Number.isNaN(date.valueOf()) && madridInput(date.toISOString()) === value);
  if (candidates.length !== 1) throw new Error('Esa hora coincide con el cambio de horario. Elige otra hora.');
  return candidates[0].toISOString();
}

export function rideAccess(ride, profile, role, members) {
  const joined = members.some(m => m.user_id === profile.id);
  const owner = ride.organizer_id === profile.id;
  return {
    joined,
    canManage: role === 'admin' || (role === 'organizer' && owner),
    canChat: joined || owner || role === 'admin',
    canJoin: ride.status === 'active' && new Date(ride.starts_at) > new Date(),
  };
}

export function rideError(error) {
  if (['42P01', 'PGRST205'].includes(error?.code)) return 'Falta activar las tablas de salidas en Supabase. Ejecuta el SQL 002_live_rides.sql.';
  if (error?.code === '23505') return 'Ya estás apuntado a esta salida. Pulsa Actualizar.';
  if (error?.code === '42501') return 'No tienes permiso para esta operación. Actualiza la página para revisar tu acceso.';
  return error?.message || 'No se ha podido guardar. Comprueba tu conexión y vuelve a intentarlo.';
}
