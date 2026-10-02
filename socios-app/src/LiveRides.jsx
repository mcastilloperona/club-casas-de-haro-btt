import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Bike, CalendarDays, Clock3, MapPin, MessageCircle, Plus, RefreshCw, Send, Trash2, Users, X } from 'lucide-react';
import { supabase } from './supabase';
import { madridInput, madridToISO, rideAccess, rideError } from './ride-utils';

const formatDate = iso => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));

function Dialog({ title, onClose, children, wide = false }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const key = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,a[href]')];
        const first = focusable[0], last = focusable.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="chat-overlay"><section ref={panel} tabIndex={-1} className={`live-dialog ${wide ? 'live-dialog--chat' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
    <header className="live-dialog-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header>
    {children}
  </section></div>;
}

function RideEditor({ ride, profile, onClose, onSaved }) {
  const [form, setForm] = useState({ title: ride?.title || '', description: ride?.description || '', starts: madridInput(ride?.starts_at), meeting_point: ride?.meeting_point || '', discipline: ride?.discipline || 'BTT', difficulty: ride?.difficulty || 'Medio', distance: ride?.distance_km ?? '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const starts_at = madridToISO(form.starts);
      if (new Date(starts_at) <= new Date()) throw new Error('Elige una fecha futura para publicar o editar la salida.');
      const payload = { title: form.title.trim(), description: form.description.trim(), starts_at, meeting_point: form.meeting_point.trim(), discipline: form.discipline, difficulty: form.difficulty, distance_km: form.distance === '' ? null : Number(form.distance) };
      const query = ride ? supabase.from('club_rides').update(payload).eq('id', ride.id) : supabase.from('club_rides').insert({ ...payload, organizer_id: profile.id });
      const { error: failure } = await query.select('id').single();
      if (failure) throw failure;
      onSaved();
    } catch (failure) { setError(rideError(failure)); } finally { setBusy(false); }
  };
  return <Dialog title={ride ? 'Editar salida' : 'Publicar una salida'} onClose={onClose}>
    <form className="ride-editor auth-form" onSubmit={save}>
      <label>Nombre de la ruta<input required minLength={3} maxLength={120} value={form.title} onChange={e => change('title', e.target.value)} /></label>
      <label>Fecha y hora · Madrid<input required type="datetime-local" value={form.starts} onChange={e => change('starts', e.target.value)} /></label>
      <label>Punto de encuentro<input required minLength={2} maxLength={200} value={form.meeting_point} onChange={e => change('meeting_point', e.target.value)} /></label>
      <div className="ride-form-columns"><label>Modalidad<select value={form.discipline} onChange={e => change('discipline', e.target.value)}>{['BTT','Carretera','Gravel'].map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Nivel<select value={form.difficulty} onChange={e => change('difficulty', e.target.value)}>{['Fácil','Medio','Exigente'].map(v => <option key={v}>{v}</option>)}</select></label></div>
      <label>Kilómetros · opcional<input type="number" min="0.1" max="2000" step="0.1" value={form.distance} onChange={e => change('distance', e.target.value)} /></label>
      <label>Descripción<textarea maxLength={3000} rows={4} value={form.description} onChange={e => change('description', e.target.value)} placeholder="Recorrido, ritmo y recomendaciones para el grupo" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : ride ? 'Guardar cambios' : 'Publicar salida'}</button>
    </form>
  </Dialog>;
}

function LiveChat({ ride, profile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [limit, setLimit] = useState(100);
  const bottom = useRef(null);
  const lastId = useRef(null);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      const { data, error: failure } = await supabase.from('club_ride_messages').select('id,user_id,author_name,body,created_at').eq('ride_id', ride.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit + 1);
      inFlight = false;
      if (!active) return;
      setLoading(false);
      if (failure) { setMessages([]); setError(rideError(failure)); return; }
      setError(''); setMore(data.length > limit); setMessages(data.slice(0, limit).reverse());
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [ride.id, limit]);
  useEffect(() => {
    const newest = messages.at(-1)?.id;
    if (newest && newest !== lastId.current) { bottom.current?.scrollIntoView({ behavior: 'smooth' }); lastId.current = newest; }
  }, [messages]);
  const send = async event => {
    event.preventDefault(); if (!body.trim() || sending) return;
    setSending(true); setError('');
    try {
      const { data, error: failure } = await supabase.from('club_ride_messages').insert({ ride_id: ride.id, user_id: profile.id, body: body.trim() }).select('id,user_id,author_name,body,created_at').single();
      if (failure) throw failure;
      setMessages(current => [...current.filter(m => m.id !== data.id), data]); setBody('');
    } catch (failure) { setError(rideError(failure)); } finally { setSending(false); }
  };
  return <Dialog title={`Chat · ${ride.title}`} onClose={onClose} wide>
    <div className="chat-security">Chat privado de inscritos, organizador y administradores. Se actualiza cada 5 segundos.</div>
    <div className="chat-messages" aria-live="polite">
      {more && <button className="text-button" onClick={() => setLimit(v => v + 100)}>Cargar mensajes anteriores</button>}
      {loading && <p>Cargando conversación…</p>}
      {!loading && !messages.length && !error && <p>Todavía no hay mensajes. Abre la conversación con el grupo.</p>}
      {messages.map(message => <article key={message.id} className={`chat-message ${message.user_id === profile.id ? 'chat-message--mine' : ''}`}><div className="chat-bubble"><div className="chat-author"><strong>{message.user_id === profile.id ? 'Tú' : message.author_name}</strong><time>{new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at))}</time></div><p>{message.body}</p></div></article>)}
      <div ref={bottom} />
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {ride.status !== 'active' ? <p className="chat-demo-note">Salida {ride.status === 'archived' ? 'archivada' : 'cancelada'}: conversación de solo lectura.</p> : <form className="chat-composer" onSubmit={send}><input aria-label="Mensaje" placeholder="Escribe un mensaje…" value={body} onChange={e => setBody(e.target.value)} maxLength={1000} disabled={sending} /><button disabled={sending || !body.trim()} aria-label="Enviar mensaje"><Send size={19} /></button></form>}
  </Dialog>;
}

export default function LiveRides({ role, profile }) {
  const [rides, setRides] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [editor, setEditor] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [unread, setUnread] = useState({});
  const seen = useRef(new Set());
  const hydrated = useRef(false);
  const openChatRef = useRef(null);
  const loadingRef = useRef(false);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const results = await Promise.all([
        supabase.from('club_rides').select('*').order('starts_at', { ascending: true }),
        supabase.from('club_ride_members').select('ride_id,user_id,name,created_at'),
        supabase.from('club_ride_messages').select('id,ride_id,user_id,created_at').order('created_at', { ascending: false }).limit(200),
      ]);
      if (!mounted.current) return;
      for (const result of results) if (result.error) throw result.error;
      setRides(results[0].data || []); setMembers(results[1].data || []); setError('');
      const added = {};
      for (const message of results[2].data || []) {
        if (hydrated.current && !seen.current.has(message.id) && message.user_id !== profile.id && message.ride_id !== openChatRef.current) {
          added[message.ride_id] = (added[message.ride_id] || 0) + 1;
        }
        seen.current.add(message.id);
      }
      hydrated.current = true;
      if (Object.keys(added).length) setUnread(current => {
        const next = { ...current };
        for (const [id, count] of Object.entries(added)) next[id] = (next[id] || 0) + count;
        return next;
      });
    } catch (failure) { if (mounted.current) { setError(rideError(failure)); setRides([]); setMembers([]); } }
    finally { loadingRef.current = false; if (mounted.current) setLoading(false); }
  }, [profile.id]);
  useEffect(() => {
    mounted.current = true; load();
    const timer = setInterval(load, 10000);
    return () => { mounted.current = false; clearInterval(timer); };
  }, [load]);
  const mutate = async (id, action) => {
    if (busy) return;
    setBusy(id); setError('');
    try { await action(); await load(); }
    catch (failure) { setError(rideError(failure)); }
    finally { setBusy(''); }
  };
  const enrollment = (ride, joined) => mutate(ride.id, async () => {
    const query = joined ? supabase.from('club_ride_members').delete().eq('ride_id', ride.id).eq('user_id', profile.id) : supabase.from('club_ride_members').insert({ ride_id: ride.id, user_id: profile.id });
    const { error: failure } = await query.select('user_id').single(); if (failure) throw failure;
  });
  const statusChange = (ride, status) => mutate(ride.id, async () => {
    const { error: failure } = await supabase.from('club_rides').update({ status }).eq('id', ride.id).select('id').single(); if (failure) throw failure;
  });
  const deleteRide = ride => {
    if (role !== 'admin' || busy) return;
    const confirmed = window.confirm(`¿Eliminar definitivamente “${ride.title}”?\n\nTambién se borrarán las inscripciones, el chat y los avisos asociados. Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    mutate(ride.id, async () => {
      const { error: failure } = await supabase.from('club_rides').delete().eq('id', ride.id).select('id').single();
      if (failure) throw failure;
      setUnread(current => {
        const next = { ...current };
        delete next[ride.id];
        return next;
      });
      if (chatId === ride.id) setChatId(null);
    });
  };
  const visible = rides.filter(r => filter === 'upcoming' ? r.status === 'active' && new Date(r.starts_at) > new Date() : r.status !== 'active' || new Date(r.starts_at) <= new Date());
  const chatRide = rides.find(r => r.id === chatId);
  const chatMembers = members.filter(m => m.ride_id === chatId);
  const chatAccess = chatRide && rideAccess(chatRide, profile, role, chatMembers).canChat;
  const closeEditor = useCallback(() => setEditor(null), []);
  const closeChat = useCallback(() => setChatId(null), []);
  const openChat = id => { openChatRef.current = id; setUnread(v => ({ ...v, [id]: 0 })); setChatId(id); };
  useEffect(() => { openChatRef.current = chatId; }, [chatId]);
  useEffect(() => {
    if (!loading && rides.length) {
      const id = new URLSearchParams(window.location.search).get('ride');
      const selected = rides.find(r => r.id === id);
      if (selected) setFilter(selected.status !== 'active' || new Date(selected.starts_at) <= new Date() ? 'history' : 'upcoming');
    }
  }, [loading]);
  const alerts = rides.filter(r => unread[r.id] && rideAccess(r, profile, role, members.filter(m => m.ride_id === r.id)).canChat);
  return <section className="live-rides">
    <div className="dashboard-title"><div><p className="eyebrow">Área privada · Salidas del club</p><h1>Bienvenido, {profile.name.split(' ')[0]}</h1><p>Encuentra tu próxima ruta y conversa con el grupo.</p></div>
      {['admin','organizer'].includes(role) && <button className="primary-button" onClick={() => setEditor({})}><Plus size={19} /> Publicar una salida</button>}
    </div>
    <div className="admin-toolbar"><div className="admin-filters"><button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>Próximas salidas</button><button className={filter === 'history' ? 'active' : ''} onClick={() => setFilter('history')}>Historial</button></div><button className="refresh-button" onClick={load} disabled={loading}><RefreshCw size={16} /> Actualizar</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {alerts.length > 0 && <div className="message-alert" role="status"><Bell size={20} /><div><strong>Tienes nuevos mensajes</strong>{alerts.map(r => <button key={r.id} className="text-button" onClick={() => openChat(r.id)}>{r.title} · {unread[r.id]} nuevo{unread[r.id] === 1 ? '' : 's'}</button>)}</div></div>}
    {loading && <p className="list-loading">Cargando salidas…</p>}
    {!loading && !error && !visible.length && <div className="list-loading">{filter === 'upcoming' ? 'No hay próximas salidas publicadas.' : 'Todavía no hay salidas en el historial.'}</div>}
    <div className="live-rides-grid">{visible.map(ride => {
      const attendees = members.filter(m => m.ride_id === ride.id);
      const access = rideAccess(ride, profile, role, attendees);
      return <article className="ride-card" key={ride.id}>
        <div className="ride-card__top"><span className="discipline"><Bike size={16} /> {ride.discipline}</span><span className="difficulty">{ride.difficulty}</span></div>
        <h3>{ride.title}</h3><p className="ride-description">{ride.description}</p>
        <div className="ride-details"><span><CalendarDays size={18} /> {formatDate(ride.starts_at)} · Madrid</span><span><MapPin size={18} /> {ride.meeting_point}</span>{ride.distance_km && <span>{ride.distance_km} km</span>}</div>
        <p className="ride-organizer">Organiza: {ride.organizer_name} {ride.status !== 'active' && `· ${ride.status === 'archived' ? 'Archivada' : 'Cancelada'}`}</p>
        <div className="ride-actions">
          {access.canJoin && <button className={access.joined ? 'secondary-button' : 'primary-button'} disabled={Boolean(busy)} onClick={() => enrollment(ride, access.joined)}>{busy === ride.id ? 'Guardando…' : access.joined ? 'Ya estoy apuntado · Darme de baja' : 'Me apunto'}</button>}
          {access.canChat && <button className="icon-button" onClick={() => openChat(ride.id)}><MessageCircle size={18} /> Chat {unread[ride.id] > 0 && <b className="chat-badge">{unread[ride.id]}</b>}</button>}
          {access.canManage && <>
            {ride.status === 'active' && new Date(ride.starts_at) > new Date() && <button className="text-button" onClick={() => setEditor(ride)}>Editar salida</button>}
            {ride.status === 'active' ? <><button className="text-button" disabled={Boolean(busy)} onClick={() => statusChange(ride, 'archived')}>Archivar y cerrar chat</button><button className="text-button" disabled={Boolean(busy)} onClick={() => statusChange(ride, 'cancelled')}>Cancelar salida</button></> : <button className="text-button" disabled={Boolean(busy)} onClick={() => statusChange(ride, 'active')}>Reactivar salida</button>}
            {role === 'admin' && <button className="text-button text-button--danger" disabled={Boolean(busy)} onClick={() => deleteRide(ride)}><Trash2 size={16} /> Eliminar definitivamente</button>}
          </>}
          {access.canManage && <a className="text-button" href={`https://wa.me/?text=${encodeURIComponent(`${ride.title}\n${formatDate(ride.starts_at)} · Madrid\nEncuentro: ${ride.meeting_point}\nApúntate en https://casasdeharobtt.es/socios/?ride=${ride.id}`)}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>}
        </div>
        <details className="ride-attendees"><summary><Users size={17} /> {attendees.length} socio{attendees.length === 1 ? '' : 's'} apuntado{attendees.length === 1 ? '' : 's'}</summary><ul>{attendees.map(m => <li key={m.user_id}>{m.name}</li>)}</ul></details>
        {!access.canChat && ride.status === 'active' && <small className="chat-access-note">Apúntate para acceder al chat de esta salida.</small>}
      </article>;
    })}</div>
    <p className="live-email-note"><Clock3 size={16} /> Los avisos de mensajes aparecen mientras tienes abierta esta web. El envío por correo está pendiente de configurar.</p>
    {editor && <RideEditor ride={editor.id ? editor : null} profile={profile} onClose={closeEditor} onSaved={() => { closeEditor(); load(); }} />}
    {chatRide && chatAccess && <LiveChat ride={chatRide} profile={profile} onClose={closeChat} />}
  </section>;
}
