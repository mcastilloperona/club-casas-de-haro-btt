type MemberRecord = {
  full_name?: string;
  email?: string;
  status?: 'pending' | 'approved' | 'rejected';
};

type WebhookPayload = {
  type?: 'INSERT' | 'UPDATE';
  table?: string;
  record?: MemberRecord;
  old_record?: MemberRecord;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MAIL_FROM');
  if (!apiKey || !from) throw new Error('Faltan RESEND_API_KEY o MAIL_FROM.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) throw new Error(`Resend ha respondido con ${response.status}.`);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido.' }), { status: 405, headers: jsonHeaders });
  }

  const configuredSecret = Deno.env.get('WEBHOOK_SECRET');
  if (!configuredSecret || request.headers.get('x-webhook-secret') !== configuredSecret) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 401, headers: jsonHeaders });
  }

  try {
    const payload = await request.json() as WebhookPayload;
    if (payload.table !== 'profiles' || !payload.record) {
      return new Response(JSON.stringify({ ignored: true }), { headers: jsonHeaders });
    }

    const member = payload.record;
    const name = escapeHtml(member.full_name || 'Nuevo socio');
    const email = escapeHtml(member.email || '');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://casasdeharobtt.es';

    if (payload.type === 'INSERT' && member.status === 'pending') {
      const adminEmail = Deno.env.get('ADMIN_EMAIL');
      if (!adminEmail) throw new Error('Falta ADMIN_EMAIL.');
      await sendEmail(
        adminEmail,
        'Nueva solicitud de alta en el Club Casas de Haro BTT',
        `<h2>Nueva solicitud de alta</h2><p><strong>${name}</strong> ha solicitado acceso al área de socios.</p><p>${email}</p><p><a href="${siteUrl}/v14/socios/">Revisar solicitud</a></p>`,
      );
      return new Response(JSON.stringify({ sent: 'admin' }), { headers: jsonHeaders });
    }

    const justApproved = payload.type === 'UPDATE'
      && payload.old_record?.status !== 'approved'
      && member.status === 'approved';

    if (justApproved && member.email) {
      await sendEmail(
        member.email,
        'Tu acceso al Club Casas de Haro BTT ha sido aprobado',
        `<h2>Bienvenido al área de socios</h2><p>Hola, ${name}. Tu solicitud ha sido aprobada.</p><p><a href="${siteUrl}/v14/socios/">Entrar en el área de socios</a></p>`,
      );
      return new Response(JSON.stringify({ sent: 'member' }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ ignored: true }), { headers: jsonHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'No se ha podido enviar la notificación.' }), { status: 500, headers: jsonHeaders });
  }
});
