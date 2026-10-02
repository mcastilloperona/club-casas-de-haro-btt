// Cron llama a este endpoint con x-webhook-secret. Desplegar sin verificación
// JWT de la plataforma: la petición se autentica aquí mediante ese secreto.
type Job = { job_id: string; token: string; kind: 'ride'|'chat'; ride_id: string; recipient_id: string; email: string; name: string; title: string; starts_at: string; meeting_point: string };
const headers = { 'Content-Type': 'application/json' };
const escape = (s: string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const json = (value: unknown, status=200) => new Response(JSON.stringify(value),{status,headers});

export async function handle(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({error:'Método no permitido'},405);
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || request.headers.get('x-webhook-secret') !== secret) return json({error:'No autorizado'},401);
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MAIL_FROM');
  const site = (Deno.env.get('SITE_URL') || 'https://casasdeharobtt.es').replace(/\/$/,'');
  if (!url || !service || !apiKey || !from) return json({error:'Falta configurar el servicio de correo'},503);
  const db = async (path: string, method: string, body: unknown) => {
    const response = await fetch(`${url}/rest/v1/${path}`,{method,headers:{...headers,apikey:service,Authorization:`Bearer ${service}`},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`Database ${response.status}`);
    const text = await response.text(); return text ? JSON.parse(text) : null;
  };
  try {
    const jobs: Job[] = await db('rpc/club_claim_notifications','POST',{batch_size:20});
    let sent=0,failed=0;
    for (const job of jobs) {
      const title = escape(job.title);
      const link = `${site}/socios/?ride=${encodeURIComponent(job.ride_id)}`;
      const date = new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'full',timeStyle:'short'}).format(new Date(job.starts_at));
      const subject = job.kind === 'ride' ? `Nueva salida del club: ${job.title}` : `Nuevos mensajes en ${job.title}`;
      const html = job.kind === 'ride'
        ? `<p>Hola, ${escape(job.name)}.</p><h2>${title}</h2><p>${escape(date)} · Madrid</p><p>Encuentro: ${escape(job.meeting_point)}</p><p><a href="${escape(link)}">Ver la salida y apuntarme</a></p>`
        : `<p>Hola, ${escape(job.name)}.</p><p>Hay nuevos mensajes en el chat de <strong>${title}</strong>.</p><p><a href="${escape(link)}">Entrar en la conversación</a></p>`;
      try {
        const response = await fetch('https://api.resend.com/emails',{method:'POST',headers:{...headers,Authorization:`Bearer ${apiKey}`,'Idempotency-Key':`cdh-notice-${job.job_id}`},body:JSON.stringify({from,to:[job.email],subject,html}),signal:AbortSignal.timeout(15000)});
        if (!response.ok) throw new Error(`Email provider ${response.status}`);
        await db(`club_notification_jobs?id=eq.${job.job_id}&lease_token=eq.${job.token}&state=eq.processing`,'PATCH',{state:'sent',sent_at:new Date().toISOString(),last_error:null});
        sent++;
      } catch (error) {
        failed++;
        await db(`club_notification_jobs?id=eq.${job.job_id}&lease_token=eq.${job.token}&state=eq.processing`,'PATCH',{state:'pending',due_at:new Date(Date.now()+5*60000).toISOString(),last_error:error instanceof Error ? error.message : 'Error de envío'});
      }
      // Evita ráfagas al proveedor. No expone direcciones en logs/respuestas.
      await new Promise(resolve=>setTimeout(resolve,600));
    }
    return json({sent,failed});
  } catch { return json({error:'No se ha podido procesar la cola'},500); }
}
Deno.serve(handle);
