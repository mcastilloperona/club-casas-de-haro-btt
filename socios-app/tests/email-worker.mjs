import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir,rm } from 'node:fs/promises';

await mkdir(new URL('../node_modules/.cache/',import.meta.url),{recursive:true});
const file=new URL('../node_modules/.cache/email-worker.mjs',import.meta.url).pathname;
await build({entryPoints:[new URL('../supabase/functions/notify-club/index.ts',import.meta.url).pathname],outfile:file,format:'esm',platform:'node'});

const config={
  WEBHOOK_SECRET:'test-secret',
  SUPABASE_URL:'https://db.example.test',
  SUPABASE_SERVICE_ROLE_KEY:'server-only',
  RESEND_API_KEY:'email-only',
  MAIL_FROM:'Club <club@example.test>'
};
globalThis.Deno={env:{get:key=>config[key]},serve(){}};
const {handle}=await import(file);
const request=secret=>new Request('https://worker.example.test',{method:'POST',headers:{'x-webhook-secret':secret}});
const calls=[];
const routeJob={
  job_id:'uuid-job',token:'uuid-token',kind:'chat',ride_id:'ride1',recipient_id:'member',
  email:'private@example.test',name:'<Miguel>',title:'Ruta <prueba>',
  starts_at:'2099-10-04T06:30:00Z',meeting_point:'Parque'
};
const memberJob={job_id:'approved-job',token:'approved-token',email:'new-member@example.test',member_name:'<Ana>'};
const mock=(routeJobs=[],approvalJobs=[],failApproval=false)=>{
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    if(url.includes('/rpc/club_claim_notifications'))return new Response(JSON.stringify(routeJobs));
    if(url.includes('/rpc/club_claim_admin_emails'))return new Response('[]');
    if(url.includes('/rpc/club_claim_member_approval_emails'))return new Response(JSON.stringify(approvalJobs));
    if(url.includes('api.resend.com') && failApproval && JSON.parse(options.body).to[0]===memberJob.email)
      return new Response('',{status:429});
    return new Response('',{status:200});
  };
};

mock([routeJob],[memberJob]);
assert.equal((await handle(request('wrong'))).status,401);
assert.equal(calls.length,0);
delete config.RESEND_API_KEY;
assert.equal((await handle(request('test-secret'))).status,503);
assert.equal(calls.length,0);
config.RESEND_API_KEY='email-only';
assert.deepEqual(await (await handle(request('test-secret'))).json(),
  {sent:1,failed:0,adminSent:0,adminFailed:0,approvalSent:1,approvalFailed:0});

const emails=calls.filter(c=>c.url.includes('api.resend.com'));
assert.equal(emails.length,2);
const chatMail=emails.find(c=>JSON.parse(c.options.body).to[0]===routeJob.email);
assert.equal(chatMail.options.headers['Idempotency-Key'],'cdh-notice-uuid-job');
assert.ok(JSON.parse(chatMail.options.body).html.includes('&lt;prueba&gt;'));
const approvalMail=emails.find(c=>JSON.parse(c.options.body).to[0]===memberJob.email);
assert.equal(approvalMail.options.headers['Idempotency-Key'],'cdh-approved-approved-job');
assert.ok(JSON.parse(approvalMail.options.body).html.includes('&lt;Ana&gt;'));
assert.ok(JSON.parse(approvalMail.options.body).html.includes('/socios/'));
assert.ok(calls.some(c=>c.url.includes('club_member_approval_jobs?')
  && c.url.includes('lease_token=eq.approved-token')
  && c.options.method==='PATCH'
  && JSON.parse(c.options.body).state==='sent'));

calls.length=0;
mock([],[memberJob],true);
assert.deepEqual(await (await handle(request('test-secret'))).json(),
  {sent:0,failed:0,adminSent:0,adminFailed:0,approvalSent:0,approvalFailed:1});
assert.ok(calls.some(c=>c.url.includes('club_member_approval_jobs?')
  && c.options.method==='PATCH'
  && JSON.parse(c.options.body).state==='pending'));

await rm(file);
console.log('Emails club: autenticación, bienvenida al aprobar, privacidad, idempotencia y reintentos superados (sin envíos reales).');
