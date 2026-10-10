const endpoint = 'https://tjdtbsroqpbpkyysqjuv.supabase.co/functions/v1/public-rides';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function madridDay(value) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

export function upcomingRides(rides, now) {
  const today = madridDay(now);
  return rides.filter(r => Number.isFinite(Date.parse(r.starts_at))
    && (!r.status || r.status === 'active') && madridDay(r.starts_at) >= today)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id));
}

export function rideCard(ride, now) {
  const when = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ride.starts_at));
  const link = 'socios/?ride=' + encodeURIComponent(ride.id);
  const started = Date.parse(ride.starts_at) <= new Date(now).valueOf();
  const distance = ride.distance_km == null ? 'Por confirmar' : new Intl.NumberFormat('es-ES').format(ride.distance_km) + ' km';
  return `<article class="club-ride-card"><span class="pill">${started ? 'Salida de hoy' : 'Próxima salida'}</span><p class="next-route-date">${escape(when)}</p><h3>${escape(ride.title)}</h3>${ride.description ? `<p class="club-ride-description">${escape(ride.description)}</p>` : ''}<p class="club-ride-meeting"><strong>Punto de encuentro:</strong> ${escape(ride.meeting_point)}</p><dl class="club-ride-stats"><div><dt>Distancia</dt><dd>${escape(distance)}</dd></div><div><dt>Modalidad</dt><dd>${escape(ride.discipline)}</dd></div><div><dt>Dificultad</dt><dd>${escape(ride.difficulty)}</dd></div></dl><a class="btn dark" href="${escape(link)}">${started ? 'Ver salida en Socios' : 'Ver salida y apuntarme'}</a></article>`;
}

export async function loadRides(fetcher = fetch) {
  const response = await fetcher(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('No se han podido consultar las salidas');
  const data = await response.json();
  if (!Array.isArray(data.rides) || !Number.isFinite(Date.parse(data.server_time))) throw new Error('Respuesta no válida');
  return data;
}

export function mountRides(targets) {
  let data = null, fetchedAt = 0, busy = false;
  const now = () => data ? new Date(Date.parse(data.server_time) + performance.now() - fetchedAt) : new Date();
  const paint = () => {
    if (!data) return;
    const current = now();
    const rides = upcomingRides(data.rides, current);
    const html = rides.length ? rides.map(r => rideCard(r, current)).join('')
      : '<div class="club-rides-notice"><h3>Próxima salida pendiente de publicar</h3><p>Los socios del club están preparando la siguiente salida. ¡Nos vemos el domingo!</p><a class="btn dark" href="socios/">Entrar en Socios</a></div>';
    targets.forEach(t => { if (t.innerHTML !== html) t.innerHTML = html; t.setAttribute('aria-busy', 'false'); });
  };
  const refresh = async () => {
    if (busy) return;
    busy = true;
    try { data = await loadRides(); fetchedAt = performance.now(); paint(); }
    catch {
      data = null;
      targets.forEach(t => {
        t.setAttribute('aria-busy', 'false');
        t.innerHTML = '<div class="club-rides-notice"><h3>No podemos consultar las salidas ahora</h3><p>Comprueba tu conexión o consulta el área de socios.</p><button class="btn dark" type="button" data-retry-rides>Reintentar</button> <a class="btn" href="socios/">Ir a Socios</a></div>';
      });
    } finally { busy = false; }
  };
  targets.forEach(t => t.addEventListener('click', e => { if (e.target.closest('[data-retry-rides]')) refresh(); }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { paint(); refresh(); } });
  window.addEventListener('focus', () => { paint(); refresh(); });
  // Remove expired cards within one second of Madrid midnight, even on an open page.
  window.setInterval(() => { if (!document.hidden) paint(); }, 1000);
  window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  refresh();
}

if (typeof document !== 'undefined') {
  const targets = [...document.querySelectorAll('[data-club-rides]')];
  if (targets.length) mountRides(targets);
}
