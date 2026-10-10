// Public, read-only projection for Inicio/Rutas. Never returns member data or chats.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
const day = (date: Date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

export async function handle(request: Request): Promise<Response> {
  const headers = { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return new Response(JSON.stringify({ error: 'Servicio no disponible' }), { status: 503, headers });
  try {
    const now = new Date();
    const today = day(now);
    // A broad UTC lower bound is narrowed to Madrid's calendar day below.
    const cutoff = new Date(now.valueOf() - 48 * 3600000).toISOString();
    const rides: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const query = new URLSearchParams({
        select: 'id,title,description,starts_at,meeting_point,discipline,difficulty,distance_km',
        status: 'eq.active', starts_at: 'gte.' + cutoff,
        order: 'starts_at.asc,id.asc', limit: '1000', offset: String(offset),
      });
      const response = await fetch(`${url}/rest/v1/club_rides?${query}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Database unavailable');
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error('Invalid data');
      rides.push(...batch.filter(ride => day(new Date(ride.starts_at)) >= today));
      if (batch.length < 1000) break;
    }
    return new Response(JSON.stringify({ rides, server_time: now.toISOString() }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'No se han podido consultar las salidas' }), { status: 503, headers });
  }
}

Deno.serve(handle);
