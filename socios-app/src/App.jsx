import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bike,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { sociosEnabled, supabase } from './supabase';

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
            data: { full_name: form.name },
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

function NextRideCard({ role }) {
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
        <button className="icon-button" title="Conversación de la salida"><MessageCircle size={19} /><span>Chat</span></button>
        {(role === 'organizer' || role === 'admin') && <button className="text-button">Editar salida</button>}
      </div>
      <div className="attendees"><Users size={17} /><span><strong>7 socios</strong> apuntados</span><div className="mini-avatars"><i>JM</i><i>GM</i><i>ÁM</i><i>+4</i></div></div>
    </article>
  );
}

function MemberHome({ role, profile }) {
  return (
    <>
      <div className="dashboard-title">
        <div><p className="eyebrow">Área privada</p><h1>Buenos días, {profile.name.split(' ')[0]}</h1><p>{role === 'organizer' ? 'Consulta las salidas y organiza la próxima ruta con el grupo.' : 'Consulta las salidas y comparte ruta con el grupo.'}</p></div>
        {(role === 'organizer' || role === 'admin') && <button className="primary-button"><Plus size={19} /> Publicar una salida</button>}
      </div>
      <div className="stats-grid">
        <Stat icon={<CalendarDays size={22} />} number="1" label="Próxima salida" />
        <Stat icon={<Users size={22} />} number="7" label="Participantes" />
        <Stat icon={<MessageCircle size={22} />} number="3" label="Mensajes nuevos" />
      </div>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Salidas del club</p><h2>Próximas rutas</h2></div><button className="text-button">Ver todas <ChevronRight size={17} /></button></div>
        <NextRideCard role={role} />
      </section>
      <div className="phase-note"><ShieldCheck size={22} /><div><strong>Fase de acceso y permisos</strong><p>La publicación real de rutas, las inscripciones y el chat se activarán en las siguientes fases.</p></div></div>
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
      .select('id,full_name,email,status,role,created_at')
      .order('created_at', { ascending: false });
    setLoadingMembers(false);
    if (error) {
      setAdminMessage('No se ha podido cargar el listado de socios.');
      return;
    }
    setAdminMessage('');
    setMembers((data || []).map((member) => ({ ...member, name: member.full_name })));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const update = async (id, changes) => {
    if (sociosEnabled) {
      const payload = { ...changes, updated_at: new Date().toISOString() };
      if (changes.status === 'approved') {
        const { data: authData } = await supabase.auth.getUser();
        payload.approved_at = new Date().toISOString();
        payload.approved_by = authData.user?.id || null;
      }
      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (error) {
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
      <main className="dashboard-main">{role === 'admin' ? <AdminPanel /> : <MemberHome role={role} profile={profile} />}</main>
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
    supabase.from('profiles').select('full_name,status,role').eq('id', session.user.id).single().then(({ data, error }) => {
      setLoading(false);
      if (error || !data) {
        setPendingName(session.user.user_metadata?.full_name || 'Nuevo socio');
        setNeedsEmailConfirmation(false);
        setScreen('pending');
        return;
      }
      if (data.status !== 'approved') {
        setPendingName(data.full_name || 'Nuevo socio');
        setNeedsEmailConfirmation(false);
        setScreen('pending');
        return;
      }
      setProfile({ name: data.full_name || session.user.email, email: session.user.email });
      setRole(data.role || 'member');
      setScreen('dashboard');
    });
  }, [session]);

  const content = useMemo(() => {
    if (loading) return <div className="loading-screen"><Brand /><span>Cargando el área de socios…</span></div>;
    if (screen === 'pending') return <PendingView name={pendingName} needsEmailConfirmation={needsEmailConfirmation} onLogout={async () => { if (sociosEnabled) await supabase.auth.signOut(); setSession(null); setScreen('auth'); }} />;
    if (screen === 'dashboard') return <Dashboard initialRole={role} liveProfile={profile} onLogout={async () => { if (sociosEnabled) await supabase.auth.signOut(); setScreen('auth'); }} />;
    return <AuthForm mode={mode} setMode={setMode} onPending={(name, confirmationRequired = false) => { setPendingName(name); setNeedsEmailConfirmation(confirmationRequired); setScreen('pending'); }} onDemo={(nextRole) => { setRole(nextRole); setScreen('dashboard'); }} onLiveSession={setSession} />;
  }, [loading, screen, pendingName, needsEmailConfirmation, mode, role, profile]);

  return content;
}

export default App;
