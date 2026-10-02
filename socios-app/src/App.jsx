import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bike,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { sociosEnabled, supabase } from './supabase';
import LiveRides from './LiveRides';

const DEMO_MEMBERS = [
  { id: '1', name: 'Álvaro Martínez', email: 'alvaro@ejemplo.es', status: 'pending', role: 'member', created_at: '2026-10-01T08:34:00Z' },
  { id: '2', name: 'Gumer López', email: 'gumer@ejemplo.es', status: 'approved', role: 'member', created_at: '2026-09-28T17:20:00Z' },
  { id: '3', name: 'Javier Parreño', email: 'javier@ejemplo.es', status: 'approved', role: 'organizer', created_at: '2026-09-27T12:10:00Z' },
];

const ROLE_LABELS = {
  member: 'Socio',
  organizer: 'Organizador',
  admin: 'Administrador',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <img src="/assets/logo-cdh-oficial-2026.png" alt="Escudo del Club Casas de Haro BTT" />
      <div>
        <strong>Casas de Haro</strong>
        <span>Club BTT · Área de socios</span>
      </div>
    </div>
  );
}

function PreviewNotice() {
  return (
    <div className="preview-notice" role="status">
      <span>PREVIEW</span>
      {sociosEnabled
        ? 'Entorno de validación conectado. Las altas y los cambios se guardan realmente.'
        : 'Esta versión permite probar las pantallas y los permisos. Los datos son de demostración.'}
    </div>
  );
}

function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-photo" aria-hidden="true">
        <div className="auth-photo__veil" />
        <div className="auth-photo__copy">
          <p>El camino nos une</p>
          <h1>El club, también cuando bajamos de la bici.</h1>
          <span>Salidas, compañeros y conversación en un espacio privado.</span>
        </div>
      </div>
      <section className="auth-panel">
        <a className="back-link" href="../index.html"><ArrowLeft size={17} /> Volver a la preview</a>
        <Brand />
        <PreviewNotice />
        {children}
      </section>
    </main>
  );
}

function AuthForm({ mode, setMode, onDemo, onPending, onLiveSession }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!sociosEnabled) {
      if (isRegister) onPending(form.name || 'Nuevo socio');
      else onDemo('member');
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name, full_name: form.name },
            emailRedirectTo: `${window.location.origin}/v14/socios/`,
          },
        });
        if (error) throw error;
        onPending(form.name || 'Nuevo socio', !data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        onLiveSession(data.session);
      }
    } catch (error) {
      setMessage(error.message || 'No se ha podido completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-copy">
        <p className="eyebrow">Acceso privado</p>
        <h2>{isRegister ? 'Solicita el alta como socio' : 'Bienvenido de nuevo'}</h2>
        <p>{isRegister
          ? 'Revisaremos tu solicitud antes de activar el acceso.'
          : 'Accede para consultar las próximas salidas del club.'}</p>
      </div>

      <div className="auth-tabs" aria-label="Acceso o solicitud de alta">
        <button className={!isRegister ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
        <button className={isRegister ? 'active' : ''} onClick={() => setMode('register')}>Solicitar alta</button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isRegister && (
          <label>
            Nombre y apellidos
            <span className="field"><UserRound size={19} /><input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre completo" /></span>
          </label>
        )}
        <label>
          Correo electrónico
          <span className="field"><Mail size={19} /><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nombre@correo.es" /></span>
        </label>
        <label>
          Contraseña
          <span className="field"><KeyRound size={19} /><input required minLength={8} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" /></span>
        </label>
        {message && <p className="form-error">{message}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Un momento…' : isRegister ? 'Enviar solicitud' : 'Entrar'} <ChevronRight size={19} /></button>
      </form>

      {!sociosEnabled && (
        <div className="demo-access">
          <span>Acceso rápido a la demostración</span>
          <div>
            <button onClick={() => onDemo('member')}>Como socio</button>
            <button onClick={() => onDemo('organizer')}>Como organizador</button>
            <button onClick={() => onDemo('admin')}>Como administrador</button>
          </div>
        </div>
      )}

      <p className="privacy-copy">El acceso está reservado a miembros autorizados por el Club Casas de Haro BTT.</p>
    </AuthShell>
  );
}

function PendingView({ name, needsEmailConfirmation, onLogout }) {
  return (
    <AuthShell>
      <section className="state-card">
        <div className="state-icon state-icon--yellow"><Clock3 size={34} /></div>
        <p className="eyebrow">Solicitud recibida</p>
        <h2>Tu alta está pendiente de aprobación</h2>
        <p>Gracias, {name}. {needsEmailConfirmation && 'Primero confirma tu correo electrónico. '}El administrador del club revisará tu solicitud. Cuando sea aprobada podrás entrar en el área privada.</p>
        <div className="state-steps">
          <span className="done"><Check size={17} /> Solicitud enviada</span>
          {needsEmailConfirmation && <span><Mail size={17} /> Confirmación del correo</span>}
          <span><Clock3 size={17} /> Revisión del club</span>
          <span><Bike size={17} /> Acceso activado</span>
        </div>
        <button className="secondary-button" onClick={onLogout}>Volver al acceso</button>
      </section>
    </AuthShell>
  );
}

function DashboardHeader({ profile, role, setRole, onLogout }) {
  return (
    <>
      <header className="app-header">
        <Brand compact />
        <div className="header-user">
          <div className="avatar">{profile.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
          <div><strong>{profile.name}</strong><span>{ROLE_LABELS[role]}</span></div>
          <button title="Cerrar sesión" aria-label="Cerrar sesión" onClick={onLogout}><LogOut size={20} /></button>
        </div>
      </header>
      {!sociosEnabled && (
        <div className="role-preview">
          <span>Vista de prueba:</span>
          {Object.keys(ROLE_LABELS).map((item) => <button key={item} className={role === item ? 'active' : ''} onClick={() => setRole(item)}>{ROLE_LABELS[item]}</button>)}
        </div>
      )}
    </>
  );
}

function Stat({ icon, number, label }) {
  return <div className="stat"><span>{icon}</span><strong>{number}</strong><small>{label}</small></div>;
}

const DEMO_CHAT_MESSAGES = [
  { id: 1, name: 'Javier Parreño', initials: 'JP', role: 'Organizador', text: '¡Buenas! Confirmamos salida el domingo a las 8:30 desde el parque.', time: '18:42' },
  { id: 2, name: 'Gumer López', initials: 'GL', text: 'Perfecto. ¿La hacemos finalmente por Pozoamargo y La Losa?', time: '18:47' },
  { id: 3, name: 'Álvaro Martínez', initials: 'ÁM', text: 'Por mí sí. Parece que hará fresco a primera hora, llevaré cortavientos.', time: '19:03' },
  { id: 4, name: 'Javier Parreño', initials: 'JP', role: 'Organizador', text: 'Esa es la idea. Ritmo tranquilo y reagrupamos en los cruces. 🚲', time: '19:08' },
];

function RouteChat({ profile, onClose }) {
  const [messages, setMessages] = useState(DEMO_CHAT_MESSAGES);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    setMessages((current) => [...current, {
      id: Date.now(),
      name: profile.name,
      initials: profile.name.split(' ').map((part) => part[0]).slice(0, 2).join(''),
      text: cleanText,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    }]);
    setText('');
  };

  return (
    <div className="chat-overlay" role="presentation">
      <section className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
        <header className="chat-header">
          <div className="chat-route-icon"><Bike size={23} /></div>
          <div><span>Chat de la salida</span><h2 id="chat-title">Casas de Haro · Pozoamargo · La Losa</h2><small><i /> 7 participantes</small></div>
          <button onClick={onClose} aria-label="Cerrar chat"><X size={21} /></button>
        </header>
        <div className="chat-security"><LockKeyhole size={16} /><span>Conversación privada. Solo pueden verla los socios apuntados y el organizador.</span></div>
        <div className="chat-day"><span>Hoy</span></div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <article className={`chat-message ${message.mine ? 'chat-message--mine' : ''}`} key={message.id}>
              {!message.mine && <div className="chat-avatar">{message.initials}</div>}
              <div className="chat-bubble">
                <div className="chat-author"><strong>{message.mine ? 'Tú' : message.name}</strong>{message.role && <span>{message.role}</span>}<time>{message.time}</time></div>
                <p>{message.text}</p>
              </div>
            </article>
          ))}
          <div ref={endRef} />
        </div>
        <div className="chat-demo-note">Demostración: los mensajes se borrarán al recargar la página.</div>
        <form className="chat-composer" onSubmit={sendMessage}>
          <input autoFocus value={text} onChange={(event) => setText(event.target.value)} maxLength={500} placeholder="Escribe un mensaje…" aria-label="Escribe un mensaje" />
          <button disabled={!text.trim()} aria-label="Enviar mensaje"><Send size={19} /></button>
        </form>
      </section>
    </div>
  );
}

function NextRideCard({ role, onOpenChat, unreadMessages }) {
  return (
    <article className="ride-card">
      <div className="ride-card__top">
        <span className="discipline"><Bike size={16} /> BTT</span>
        <span className="difficulty">Nivel medio</span>
      </div>
      <p className="eyebrow">Próxima salida</p>
      <h3>Casas de Haro · Pozoamargo · La Losa</h3>
      <div className="ride-details">
        <span><CalendarDays size={18} /> Domingo, 4 de octubre</span>
        <span><Clock3 size={18} /> 08:30</span>
        <span><MapPin size={18} /> Parque de Casas de Haro</span>
      </div>
      <div className="ride-actions">
        <button className="primary-button">Me apunto <ChevronRight size={18} /></button>
        <button className="icon-button" title="Conversación de la salida" onClick={onOpenChat}><MessageCircle size={19} /><span>Chat</span>{unreadMessages > 0 && <b className="chat-badge">{unreadMessages}</b>}</button>
        {(role === 'organizer' || role === 'admin') && <button className="text-button">Editar salida</button>}
      </div>
      <div className="attendees"><Users size={17} /><span><strong>7 socios</strong> apuntados</span><div className="mini-avatars"><i>JM</i><i>GM</i><i>ÁM</i><i>+4</i></div></div>
    </article>
  );
}

function MemberHome({ role, profile }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3);

  const openChat = () => {
    setUnreadMessages(0);
    setChatOpen(true);
  };

  if (sociosEnabled) return (
    <section className="content-section">
      <div className="dashboard-title"><div><p className="eyebrow">Área privada · Validación</p><h1>Bienvenido, {profile.name.split(' ')[0]}</h1><p>Tu acceso como {ROLE_LABELS[role].toLowerCase()} está aprobado.</p></div></div>
      <div className="phase-note"><ShieldCheck size={22} /><div><strong>Acceso de socios activado</strong><p>Las salidas, inscripciones y conversaciones se habilitarán cuando estén conectadas y verificadas. Los avisos por correo del club aún no están activos.</p></div></div>
    </section>
  );

  return (
    <>
      <div className="dashboard-title">
        <div><p className="eyebrow">Área privada</p><h1>Buenos días, {profile.name.split(' ')[0]}</h1><p>{role === 'organizer' ? 'Consulta las salidas y organiza la próxima ruta con el grupo.' : 'Consulta las salidas y comparte ruta con el grupo.'}</p></div>
        {(role === 'organizer' || role === 'admin') && <button className="primary-button"><Plus size={19} /> Publicar una salida</button>}
      </div>
      <div className="stats-grid">
        <Stat icon={<CalendarDays size={22} />} number="1" label="Próxima salida" />
        <Stat icon={<Users size={22} />} number="7" label="Participantes" />
        <Stat icon={<MessageCircle size={22} />} number={unreadMessages} label="Mensajes nuevos" />
      </div>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Salidas del club</p><h2>Próximas rutas</h2></div><button className="text-button">Ver todas <ChevronRight size={17} /></button></div>
        <NextRideCard role={role} onOpenChat={openChat} unreadMessages={unreadMessages} />
      </section>
      <div className="phase-note"><ShieldCheck size={22} /><div><strong>Chat en demostración</strong><p>Puedes probar la conversación de esta salida. Los mensajes todavía no se guardan ni se envían a otros socios.</p></div></div>
      {chatOpen && <RouteChat profile={profile} onClose={() => setChatOpen(false)} />}
    </>
  );
}

function formatRequestDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function AdminPanel() {
  const [members, setMembers] = useState(sociosEnabled ? [] : DEMO_MEMBERS);
  const [loadingMembers, setLoadingMembers] = useState(sociosEnabled);
  const [adminMessage, setAdminMessage] = useState('');
  const [filter, setFilter] = useState('pending');

  const loadMembers = async () => {
    if (!sociosEnabled) return;
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,status,role,created_at')
      .order('created_at', { ascending: false });
    setLoadingMembers(false);
    if (error) {
      setAdminMessage('No se ha podido cargar el listado de socios.');
      return;
    }
    setAdminMessage('');
    setMembers(data || []);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const update = async (id, changes) => {
    if (sociosEnabled) {
      const payload = { ...changes, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select('id').single();
      if (error || !data) {
        setAdminMessage('No se ha podido guardar el cambio.');
        return;
      }
    }
    setAdminMessage('');
    setMembers((current) => current.map((member) => member.id === id ? { ...member, ...changes } : member));
  };
  const pending = members.filter((member) => member.status === 'pending').length;
  const visibleMembers = filter === 'all' ? members : members.filter((member) => member.status === filter);

  return (
    <section className="admin-panel">
      <div className="dashboard-title">
        <div><p className="eyebrow">Administración</p><h1>Gestión de socios</h1><p>Aprueba accesos y decide quién puede publicar salidas.</p></div>
        <span className="pending-summary"><Bell size={18} /> {pending} solicitud{pending === 1 ? '' : 'es'} pendiente{pending === 1 ? '' : 's'}</span>
      </div>
      <div className="admin-toolbar">
        <div className="admin-filters" aria-label="Filtrar socios">
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pendientes <span>{pending}</span></button>
          <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Aprobados</button>
          <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>Rechazados</button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button>
        </div>
        {sociosEnabled && <button className="refresh-button" onClick={loadMembers} disabled={loadingMembers}><RefreshCw size={16} /> Actualizar</button>}
      </div>
      {adminMessage && <p className="form-error">{adminMessage}</p>}
      {loadingMembers && <div className="list-loading">Cargando solicitudes…</div>}
      {!loadingMembers && !visibleMembers.length && <div className="list-loading">No hay socios en este estado.</div>}
      <div className="member-list">
        {visibleMembers.map((member) => (
          <article className="member-row" key={member.id}>
            <div className="member-person"><div className="avatar avatar--light">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><strong>{member.name}</strong><span>{member.email}</span><small>Solicitud: {formatRequestDate(member.created_at)}</small></div></div>
            <span className={`status status--${member.status}`}>{STATUS_LABELS[member.status]}</span>
            {member.role === 'admin' ? <span className="admin-protected"><ShieldCheck size={15} /> Administrador</span> : member.status === 'approved' ? (
              <label className="role-select">Permiso<select value={member.role} onChange={(event) => update(member.id, { role: event.target.value })}><option value="member">Socio</option><option value="organizer">Organizador</option></select></label>
            ) : <span className="role-empty">Sin permisos</span>}
            <div className="member-actions">
              {member.status === 'pending' && <><button className="approve" onClick={() => update(member.id, { status: 'approved' })}><Check size={17} /> Aprobar</button><button className="reject" title="Rechazar" onClick={() => update(member.id, { status: 'rejected' })}><X size={18} /></button></>}
              {member.status === 'approved' && member.role !== 'admin' && <button className="text-button" onClick={() => update(member.id, { status: 'pending', role: 'member' })}>Retirar acceso</button>}
              {member.status === 'rejected' && <button className="text-button" onClick={() => update(member.id, { status: 'pending' })}>Revisar de nuevo</button>}
            </div>
          </article>
        ))}
      </div>
      <div className="permission-legend">
        <div><UserCheck size={24} /><strong>Socio</strong><span>Consulta, se apunta y participa en los chats.</span></div>
        <div><Bike size={24} /><strong>Organizador</strong><span>Además, publica y gestiona sus salidas.</span></div>
        <div><ShieldCheck size={24} /><strong>Administrador</strong><span>Aprueba socios y asigna permisos.</span></div>
      </div>
    </section>
  );
}

function Dashboard({ initialRole, liveProfile, onLogout }) {
  const [role, setRole] = useState(initialRole);
  const profile = liveProfile || { name: 'Miguel Castillo', email: 'miguel@ejemplo.es' };
  return (
    <div className="app-shell">
      <DashboardHeader profile={profile} role={role} setRole={setRole} onLogout={onLogout} />
      <main className="dashboard-main">
        {sociosEnabled ? <>
          <LiveRides role={role} profile={profile} />
          {role === 'admin' && <AdminPanel />}
        </> : role === 'admin' ? <AdminPanel /> : <MemberHome role={role} profile={profile} />}
      </main>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('login');
  const [screen, setScreen] = useState('auth');
  const [pendingName, setPendingName] = useState('Nuevo socio');
  const [role, setRole] = useState('member');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(sociosEnabled);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!sociosEnabled) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setScreen('auth');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sociosEnabled || !session?.user) return;
    setLoading(true);
    setProfileError('');
    supabase.from('profiles').select('name,status,role').eq('id', session.user.id).single().then(({ data, error }) => {
      setLoading(false);
      if (error || !data) {
        setProfileError('No se ha podido consultar tu perfil. Contacta con el administrador del club para revisar el alta.');
        setScreen('profile-error');
        return;
      }
      if (data.status !== 'approved') {
        if (data.status === 'rejected') {
          setProfileError('Tu solicitud no ha sido aprobada. Contacta con el administrador del club si quieres que la revise.');
          setScreen('profile-error');
          return;
        }
        setPendingName(data.name || 'Nuevo socio');
        setNeedsEmailConfirmation(false);
        setScreen('pending');
        return;
      }
      setProfile({ id: session.user.id, name: data.name || session.user.email, email: session.user.email });
      setRole(data.role || 'member');
      setScreen('dashboard');
    });
  }, [session]);

  const content = useMemo(() => {
    if (loading) return <div className="loading-screen"><Brand /><span>Cargando el área de socios…</span></div>;
    if (screen === 'profile-error') return <AuthShell><section className="state-card"><h2>Revisión del acceso</h2><p role="alert">{profileError}</p><button className="secondary-button" onClick={async () => { await supabase.auth.signOut(); setScreen('auth'); }}>Volver al acceso</button></section></AuthShell>;
    if (screen === 'pending') return <PendingView name={pendingName} needsEmailConfirmation={needsEmailConfirmation} onLogout={async () => { if (sociosEnabled) await supabase.auth.signOut(); setSession(null); setScreen('auth'); }} />;
    if (screen === 'dashboard') return <Dashboard initialRole={role} liveProfile={profile} onLogout={async () => { if (sociosEnabled) await supabase.auth.signOut(); setScreen('auth'); }} />;
    return <AuthForm mode={mode} setMode={setMode} onPending={(name, confirmationRequired = false) => { setPendingName(name); setNeedsEmailConfirmation(confirmationRequired); setScreen('pending'); }} onDemo={(nextRole) => { setRole(nextRole); setScreen('dashboard'); }} onLiveSession={setSession} />;
  }, [loading, screen, pendingName, needsEmailConfirmation, mode, role, profile, profileError]);

  return content;
}

export default App;
