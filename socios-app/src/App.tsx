import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, Bell, Bike, CalendarDays, Check, Clock, LogOut, MapPin,
  Construction, Megaphone, MessageCircle, Plus, Route, Send, ShieldCheck, Users, X,
} from 'lucide-react';
import { supabase } from './supabase';

type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
type Member = {
  user_id: string;
  full_name: string;
  phone: string;
  status: MemberStatus;
  role: 'member' | 'admin';
  created_at: string;
};
type Outing = {
  id: string;
  title: string;
  description: string;
  activity: 'btt' | 'road' | 'running';
  outing_date: string;
  outing_time: string;
  meeting_point: string;
  distance_km: number | null;
  elevation_m: number | null;
  difficulty: 'suave' | 'media' | 'alta';
  max_participants: number | null;
  organizer_id: string;
  status: 'open' | 'cancelled' | 'completed';
  created_at: string;
  participant_count?: number;
  joined?: boolean;
  organizer_name?: string;
};
type ChatMessage = { id: string; outing_id: string; user_id: string; body: string; created_at: string };
type Notice = { id: string; title: string; body: string; outing_id: string | null; read_at: string | null; created_at: string };

const formatDate = (date: string) => new Intl.DateTimeFormat('es-ES', {
  weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date(`${date}T12:00:00`));

function ConstructionScreen() {
  return <main className="construction-page">
    <a href="../index.html" className="construction-back"><ArrowLeft size={17} /> Volver a la web</a>
    <section className="construction-card">
      <img src="/assets/logo-cdh-oficial-2026.png" alt="Club Casas de Haro BTT" />
      <div className="speaker"><Megaphone size={54} /></div>
      <p className="eyebrow">Área de socios</p>
      <h1>Próximamente,<br />novedades chulísimas</h1>
      <p>Estamos preparando un espacio para publicar salidas, apuntarnos y hablar con el grupo.</p>
      <div className="works-sign"><Construction size={27} /><strong>EN CONSTRUCCIÓN</strong><Construction size={27} /></div>
      <div className="barrier" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
    </section>
  </main>;
}

function LogoHeader({ member, onLogout, notices, onNotices }: {
  member: Member; onLogout: () => void; notices: Notice[]; onNotices: () => void;
}) {
  const unread = notices.filter((notice) => !notice.read_at).length;
  return <header className="app-header">
    <a className="app-brand" href="../index.html">
      <img src="/assets/logo-cdh-oficial-2026.png" alt="Club Casas de Haro BTT" />
      <span><small>Área privada</small>Socios</span>
    </a>
    <div className="header-actions">
      <button className="icon-button notice-button" onClick={onNotices} aria-label="Notificaciones">
        <Bell size={20} />{unread > 0 && <b>{unread > 9 ? '9+' : unread}</b>}
      </button>
      <button className="icon-button" onClick={onLogout} aria-label="Cerrar sesión"><LogOut size={20} /></button>
    </div>
  </header>;
}

function AuthScreen({ onReady }: { onReady: () => void }) {
  const [register, setRegister] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      if (register) {
        const fullName = String(form.get('fullName') || '').trim();
        const phone = String(form.get('phone') || '').trim();
        if (!fullName || !phone) throw new Error('Completa el nombre y el teléfono.');
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${location.origin}${location.pathname}#/`,
            data: { full_name: fullName, phone },
          },
        });
        if (authError) throw authError;
        if (!data.session) setSent(true); else onReady();
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        onReady();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la operación.');
    } finally { setLoading(false); }
  }

  if (sent) return <main className="auth-page"><section className="auth-card centered">
    <img className="auth-logo" src="/assets/logo-cdh-oficial-2026.png" alt="" />
    <Check className="success-mark" size={42} />
    <h1>Revisa tu correo</h1>
    <p>Confirma tu dirección. Después, la administración del club revisará tu solicitud de acceso.</p>
    <button className="button secondary" onClick={() => { setSent(false); setRegister(false); }}>Volver al acceso</button>
  </section></main>;

  return <main className="auth-page"><section className="auth-card">
    <a href="../index.html" className="back-link"><ArrowLeft size={16} /> Volver a la web</a>
    <img className="auth-logo" src="/assets/logo-cdh-oficial-2026.png" alt="Club Casas de Haro BTT" />
    <p className="eyebrow">Club Casas de Haro BTT</p>
    <h1>{register ? 'Solicitar acceso' : 'Área de socios'}</h1>
    <p className="muted">{register ? 'Crea tu cuenta. El acceso se activará cuando el club compruebe tu solicitud.' : 'Entra para consultar las próximas salidas y apuntarte.'}</p>
    <form onSubmit={submit} className="form-stack">
      {register && <>
        <label>Nombre y apellidos<input name="fullName" autoComplete="name" required /></label>
        <label>Teléfono<input name="phone" type="tel" autoComplete="tel" required /></label>
      </>}
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
      <label>Contraseña<input name="password" type="password" minLength={8} autoComplete={register ? 'new-password' : 'current-password'} required /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button primary" disabled={loading}>{loading ? 'Procesando…' : register ? 'Enviar solicitud' : 'Entrar'}</button>
    </form>
    <button className="text-button" onClick={() => { setRegister(!register); setError(''); }}>
      {register ? 'Ya tengo una cuenta' : 'Quiero solicitar acceso como socio'}
    </button>
  </section></main>;
}

function StatusScreen({ member, onLogout }: { member: Member; onLogout: () => void }) {
  const copy = member.status === 'pending'
    ? ['Solicitud pendiente', 'La administración del club comprobará tus datos. Recibirás acceso cuando la solicitud sea aprobada.']
    : member.status === 'rejected'
      ? ['Solicitud no aprobada', 'Ponte en contacto con el club si consideras que se trata de un error.']
      : ['Acceso suspendido', 'Tu acceso está temporalmente suspendido. Ponte en contacto con la administración del club.'];
  return <main className="auth-page"><section className="auth-card centered">
    <img className="auth-logo" src="/assets/logo-cdh-oficial-2026.png" alt="" />
    <Clock className="status-mark" size={42} />
    <p className="eyebrow">Hola, {member.full_name.split(' ')[0]}</p><h1>{copy[0]}</h1><p>{copy[1]}</p>
    <button className="button secondary" onClick={onLogout}>Cerrar sesión</button>
  </section></main>;
}

function OutingForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title')),
      description: String(form.get('description') || ''),
      activity: String(form.get('activity')),
      outing_date: String(form.get('date')),
      outing_time: String(form.get('time')),
      meeting_point: String(form.get('meetingPoint')),
      distance_km: form.get('distance') ? Number(form.get('distance')) : null,
      elevation_m: form.get('elevation') ? Number(form.get('elevation')) : null,
      difficulty: String(form.get('difficulty')),
      max_participants: form.get('maxParticipants') ? Number(form.get('maxParticipants')) : null,
    };
    const { error: insertError } = await supabase.from('club_outings').insert(payload);
    if (insertError) { setError(insertError.message); setLoading(false); return; }
    onSaved();
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
    <div className="modal-head"><div><p className="eyebrow">Nueva actividad</p><h2>Publicar salida</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
    <form className="outing-form" onSubmit={submit}>
      <label className="wide">Título<input name="title" placeholder="Salida BTT del domingo" required /></label>
      <label>Modalidad<select name="activity" defaultValue="btt"><option value="btt">BTT</option><option value="road">Carretera</option><option value="running">Running</option></select></label>
      <label>Dificultad<select name="difficulty" defaultValue="media"><option value="suave">Suave</option><option value="media">Media</option><option value="alta">Alta</option></select></label>
      <label>Fecha<input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
      <label>Hora<input name="time" type="time" required /></label>
      <label className="wide">Punto de encuentro<input name="meetingPoint" placeholder="Parque del cruce" required /></label>
      <label>Distancia (km)<input name="distance" type="number" min="1" step="0.1" /></label>
      <label>Desnivel (m)<input name="elevation" type="number" min="0" /></label>
      <label>Plazas máximas<input name="maxParticipants" type="number" min="2" /></label>
      <label className="wide">Información adicional<textarea name="description" rows={4} placeholder="Ritmo, material recomendado, paradas…" /></label>
      {error && <p className="form-error wide">{error}</p>}
      <div className="form-actions wide"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={loading}>{loading ? 'Publicando…' : 'Publicar y avisar'}</button></div>
    </form>
  </section></div>;
}

function OutingCard({ outing, onOpen }: { outing: Outing; onOpen: () => void }) {
  const icon = outing.activity === 'running' ? 'RUN' : outing.activity === 'road' ? 'ROAD' : 'BTT';
  const full = Boolean(outing.max_participants && (outing.participant_count || 0) >= outing.max_participants);
  return <article className="outing-card" onClick={onOpen}>
    <div className="card-top"><span className={`activity ${outing.activity}`}>{icon}</span><span className={`difficulty ${outing.difficulty}`}>{outing.difficulty}</span></div>
    <h3>{outing.title}</h3><p className="organizer">Organiza {outing.organizer_name || 'un socio del club'}</p>
    <div className="outing-facts"><span><CalendarDays />{formatDate(outing.outing_date)}</span><span><Clock />{outing.outing_time.slice(0, 5)}</span><span><MapPin />{outing.meeting_point}</span></div>
    <div className="card-footer"><span><Users size={17} /> {outing.participant_count || 0}{outing.max_participants ? `/${outing.max_participants}` : ''}</span><b className={outing.joined ? 'joined' : full ? 'full' : ''}>{outing.joined ? 'Apuntado' : full ? 'Completa' : 'Ver salida'}</b></div>
  </article>;
}

function OutingDetail({ outing, member, directory, onBack, onChanged }: {
  outing: Outing; member: Member; directory: Record<string, string>; onBack: () => void; onChanged: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const isOrganizer = outing.organizer_id === member.user_id;
  const canChat = isOrganizer || outing.joined;

  const loadDetail = useCallback(async () => {
    const { data: people } = await supabase.from('club_outing_attendees').select('user_id').eq('outing_id', outing.id);
    setAttendees((people || []).map((row) => row.user_id));
    if (canChat) {
      const { data } = await supabase.from('club_outing_messages').select('*').eq('outing_id', outing.id).order('created_at');
      setMessages((data || []) as ChatMessage[]);
    }
  }, [outing.id, canChat]);

  useEffect(() => {
    void loadDetail();
    const channel = supabase.channel(`club-outing-${outing.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_outing_messages', filter: `outing_id=eq.${outing.id}` }, () => void loadDetail())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_outing_attendees', filter: `outing_id=eq.${outing.id}` }, () => { void loadDetail(); onChanged(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadDetail, onChanged, outing.id]);

  async function toggleJoin() {
    setBusy(true);
    if (outing.joined && !isOrganizer) await supabase.rpc('club_leave_outing', { p_outing_id: outing.id });
    else if (!outing.joined) {
      const { error } = await supabase.rpc('club_join_outing', { p_outing_id: outing.id });
      if (error) alert(error.message.includes('complete') ? 'La salida ya está completa.' : error.message);
    }
    setBusy(false); onChanged(); onBack();
  }

  async function send(event: FormEvent) {
    event.preventDefault(); if (!body.trim()) return;
    const message = body.trim(); setBody('');
    const { error } = await supabase.from('club_outing_messages').insert({ outing_id: outing.id, body: message });
    if (error) { setBody(message); alert(error.message); }
  }

  return <main className="detail-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Próximas salidas</button>
    <section className="detail-hero"><div><span className={`activity ${outing.activity}`}>{outing.activity.toUpperCase()}</span><h1>{outing.title}</h1><p>Organiza {outing.organizer_name}</p></div></section>
    <div className="detail-grid"><section className="detail-card">
      <h2>Información</h2><div className="detail-facts">
        <div><CalendarDays /><span><small>Fecha</small>{formatDate(outing.outing_date)}</span></div>
        <div><Clock /><span><small>Hora</small>{outing.outing_time.slice(0, 5)}</span></div>
        <div><MapPin /><span><small>Punto de encuentro</small>{outing.meeting_point}</span></div>
        {outing.distance_km && <div><Route /><span><small>Distancia</small>{outing.distance_km} km{outing.elevation_m ? ` · +${outing.elevation_m} m` : ''}</span></div>}
      </div>{outing.description && <p className="description">{outing.description}</p>}
      {!isOrganizer && <button className={`button ${outing.joined ? 'secondary' : 'primary'} full-width`} onClick={toggleJoin} disabled={busy}>{outing.joined ? 'Desapuntarme' : 'Me apunto'}</button>}
    </section><section className="detail-card"><h2>Participantes <span>{attendees.length}</span></h2><div className="people-list">
      {attendees.map((id) => <div key={id} className="person-avatar" title={directory[id]}>{directory[id]?.slice(0, 1).toUpperCase() || '?'}</div>)}
      {attendees.length === 0 && <p className="muted">Todavía no se ha apuntado nadie.</p>}
    </div></section></div>
    <section className="chat-card"><div className="chat-head"><MessageCircle /><div><h2>Chat de la salida</h2><p>Solo para participantes</p></div></div>
      {!canChat ? <div className="chat-locked">Apúntate a la salida para acceder al chat.</div> : <>
        <div className="messages">{messages.length === 0 && <p className="muted">Todavía no hay mensajes. Puedes ser el primero en escribir.</p>}{messages.map((message) => <div key={message.id} className={`message ${message.user_id === member.user_id ? 'own' : ''}`}><b>{message.user_id === member.user_id ? 'Tú' : directory[message.user_id] || 'Socio'}</b><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>)}</div>
        <form className="chat-form" onSubmit={send}><input value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="Escribe un mensaje…" /><button className="icon-button send-button"><Send size={19} /></button></form>
      </>}
    </section>
  </main>;
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('club_member_private').select('*').order('created_at');
    setMembers((data || []) as Member[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function change(userId: string, status: MemberStatus, role: 'member' | 'admin') {
    const { error } = await supabase.rpc('club_admin_set_member', { p_user_id: userId, p_status: status, p_role: role });
    if (error) alert(error.message); else void load();
  }
  return <div className="modal-backdrop"><section className="modal-card admin-card"><div className="modal-head"><div><p className="eyebrow">Administración</p><h2>Gestión de socios</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
    <div className="member-table">{members.map((item) => <article key={item.user_id} className="member-row"><div><b>{item.full_name}</b><span>{item.phone}</span></div><span className={`member-status ${item.status}`}>{item.status}</span><div className="member-actions">
      {item.status !== 'approved' && <button onClick={() => change(item.user_id, 'approved', 'member')}><Check size={15} /> Aprobar</button>}
      {item.status === 'approved' && item.role !== 'admin' && <button onClick={() => change(item.user_id, 'suspended', 'member')}><X size={15} /> Suspender</button>}
    </div></article>)}</div>
  </section></div>;
}

function MemberApp({ member, onLogout }: { member: Member; onLogout: () => void }) {
  const [outings, setOutings] = useState<Outing[]>([]);
  const [directory, setDirectory] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<Outing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotices, setShowNotices] = useState(false);

  const load = useCallback(async () => {
    const [outingsRes, attendeesRes, directoryRes, noticesRes] = await Promise.all([
      supabase.from('club_outings').select('*').gte('outing_date', new Date().toISOString().slice(0, 10)).neq('status', 'cancelled').order('outing_date').order('outing_time'),
      supabase.from('club_outing_attendees').select('outing_id,user_id'),
      supabase.from('club_member_directory').select('user_id,display_name'),
      supabase.from('club_notifications').select('*').order('created_at', { ascending: false }).limit(30),
    ]);
    const names = Object.fromEntries((directoryRes.data || []).map((row) => [row.user_id, row.display_name]));
    const attendance = attendeesRes.data || [];
    setDirectory(names);
    setOutings(((outingsRes.data || []) as Outing[]).map((outing) => ({
      ...outing,
      participant_count: attendance.filter((row) => row.outing_id === outing.id).length,
      joined: attendance.some((row) => row.outing_id === outing.id && row.user_id === member.user_id),
      organizer_name: names[outing.organizer_id] || member.full_name,
    })));
    setNotices((noticesRes.data || []) as Notice[]);
  }, [member.full_name, member.user_id]);

  useEffect(() => {
    void load();
    const channel = supabase.channel('club-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_outings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_outing_attendees' }, () => void load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_notifications', filter: `user_id=eq.${member.user_id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load, member.user_id]);

  async function openNotices() {
    setShowNotices(true);
    await supabase.from('club_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', member.user_id).is('read_at', null);
    void load();
  }
  if (selected) return <><LogoHeader member={member} onLogout={onLogout} notices={notices} onNotices={() => void openNotices()} /><OutingDetail outing={selected} member={member} directory={directory} onBack={() => setSelected(null)} onChanged={load} /></>;
  return <div className="member-shell"><LogoHeader member={member} onLogout={onLogout} notices={notices} onNotices={() => void openNotices()} />
    <main className="dashboard"><section className="welcome"><div><p className="eyebrow">Club Casas de Haro BTT</p><h1>Hola, {member.full_name.split(' ')[0]}</h1><p>Estas son las próximas salidas del club.</p></div><div className="welcome-actions">{member.role === 'admin' && <button className="button secondary" onClick={() => setShowAdmin(true)}><ShieldCheck size={18} /> Socios</button>}<button className="button primary" onClick={() => setShowCreate(true)}><Plus size={19} /> Publicar salida</button></div></section>
      <section className="section-head"><div><h2>Próximas salidas</h2><p>{outings.length} {outings.length === 1 ? 'actividad publicada' : 'actividades publicadas'}</p></div></section>
      <div className="outing-grid">{outings.map((outing) => <OutingCard key={outing.id} outing={outing} onOpen={() => setSelected(outing)} />)}{outings.length === 0 && <div className="empty-state"><Bike size={44} /><h3>No hay salidas programadas</h3><p>Publica la primera para avisar al resto de socios.</p></div>}</div>
    </main>
    {showCreate && <OutingForm onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); void load(); }} />}
    {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    {showNotices && <div className="modal-backdrop" onMouseDown={() => setShowNotices(false)}><section className="modal-card notices-card" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">Actividad reciente</p><h2>Notificaciones</h2></div><button className="icon-button" onClick={() => setShowNotices(false)}><X /></button></div><div className="notices-list">{notices.map((notice) => <article key={notice.id} onClick={() => { const outing = outings.find((item) => item.id === notice.outing_id); if (outing) { setShowNotices(false); setSelected(outing); } }}><Bell size={17} /><div><b>{notice.title}</b><p>{notice.body}</p><small>{new Date(notice.created_at).toLocaleString('es-ES')}</small></div></article>)}{notices.length === 0 && <p className="muted">Todavía no tienes notificaciones.</p>}</div></section></div>}
  </div>;
}

export default function App() {
  if (import.meta.env.VITE_SOCIOS_ENABLED !== 'true') return <ConstructionScreen />;
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const loadAccount = useCallback(async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    setSession(current);
    if (!current) { setMember(null); setLoading(false); return; }
    const { data } = await supabase.from('club_member_private').select('*').eq('user_id', current.user.id).single();
    setMember(data as Member | null); setLoading(false);
  }, []);
  useEffect(() => {
    void loadAccount();
    const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(() => void loadAccount(), 0); });
    return () => data.subscription.unsubscribe();
  }, [loadAccount]);
  const logout = useCallback(async () => { await supabase.auth.signOut(); setSession(null); setMember(null); }, []);
  const content = useMemo(() => {
    if (loading) return <main className="loading-screen"><img src="/assets/logo-cdh-oficial-2026.png" alt="" /><p>Cargando área de socios…</p></main>;
    if (!session || !member) return <AuthScreen onReady={loadAccount} />;
    if (member.status !== 'approved') return <StatusScreen member={member} onLogout={logout} />;
    return <MemberApp member={member} onLogout={logout} />;
  }, [loading, session, member, loadAccount, logout]);
  return content;
}
