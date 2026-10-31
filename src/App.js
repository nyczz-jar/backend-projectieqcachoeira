import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  createCourse,
  createEvent,
  createJob,
  createMember,
  getCourses,
  getEvents,
  getFinanceSummary,
  getJobs,
  getMembers,
  getRecentActivities,
  getScales,
  getSocialCases,
  updateSocialCase,
} from './services/api';

const navigation = [
  { label: 'Dashboard', href: '/', icon: 'grid' },
  { label: 'Membros', href: '/membros', icon: 'users' },
  { label: 'Eventos', href: '/eventos', icon: 'calendar' },
  { label: 'Escalas', href: '/escalas', icon: 'clipboard' },
  { label: 'Triagem Social', href: '/triagem', icon: 'heart' },
  { label: 'Empregabilidade', href: '/empregabilidade', icon: 'briefcase' },
  { label: 'Financeiro', href: '/financeiro', icon: 'wallet' },
];

const demoMembers = [
  { id: 1, name: 'Ana Carolina Oliveira', email: 'ana.oliveira@email.com', phone: '(41) 99912-4567', status: 'Ativo', role: 'Voluntário', initials: 'AO', color: 'rose' },
  { id: 2, name: 'Lucas Ferreira Santos', email: 'lucas.santos@email.com', phone: '(41) 99843-2109', status: 'Ativo', role: 'Membro', initials: 'LS', color: 'blue' },
  { id: 3, name: 'Mariana Costa Lima', email: 'mariana.lima@email.com', phone: '(41) 99765-1032', status: 'Ativo', role: 'Admin', initials: 'ML', color: 'lilac' },
  { id: 4, name: 'Rafael Mendes Rocha', email: 'rafael.rocha@email.com', phone: '(41) 99632-8741', status: 'Inativo', role: 'Membro', initials: 'RR', color: 'amber' },
  { id: 5, name: 'Beatriz Almeida Souza', email: 'beatriz.souza@email.com', phone: '(41) 99521-6843', status: 'Ativo', role: 'Voluntário', initials: 'BS', color: 'mint' },
  { id: 6, name: 'Pedro Henrique Martins', email: 'pedro.martins@email.com', phone: '(41) 99418-7290', status: 'Ativo', role: 'Membro', initials: 'PM', color: 'blue' },
];

const demoEvents = [
  { id: 1, day: '12', month: 'OUT', title: 'Culto de Celebração', time: 'Domingo, 18h', location: 'Templo Principal', color: 'green' },
  { id: 2, day: '18', month: 'OUT', title: 'Encontro de Famílias', time: 'Sábado, 19h', location: 'Salão de Eventos', color: 'blue' },
  { id: 3, day: '25', month: 'OUT', title: 'Ação Social na Comunidade', time: 'Sábado, 9h', location: 'Praça da Cachoeira', color: 'orange' },
];

const demoActivities = [
  { id: 1, icon: 'userPlus', color: 'mint', title: 'Novo membro cadastrado', detail: 'Ana Carolina Oliveira', time: 'há 24 min' },
  { id: 2, icon: 'heart', color: 'rose', title: 'Triagem social concluída', detail: 'Atendimento encaminhado', time: 'há 1 hora' },
  { id: 3, icon: 'briefcase', color: 'lilac', title: 'Nova vaga publicada', detail: 'Auxiliar de logística · Comunidade', time: 'há 3 horas' },
  { id: 4, icon: 'calendar', color: 'amber', title: 'Evento atualizado', detail: 'Encontro de Famílias', time: 'ontem' },
];

const demoSocialCases = [
  { id: 1, name: 'João Santos Ferreira', initials: 'JF', status: 'Pendente', time: 'Hoje, 09:42', demand: 'Apoio com cesta básica e encaminhamento para oportunidade de trabalho.' },
  { id: 2, name: 'Maria das Dores', initials: 'MD', status: 'Em atendimento', time: 'Ontem, 15:18', demand: 'Orientação para acesso a atendimento médico e apoio com transporte.' },
  { id: 3, name: 'Carlos Eduardo Nunes', initials: 'CN', status: 'Aguardando retorno', time: '24 out, 11:30', demand: 'Apoio para regularização de documentos pessoais.' },
  { id: 4, name: 'Luciana Ribeiro Alves', initials: 'LA', status: 'Concluído', time: '23 out, 14:06', demand: 'Encaminhamento para curso profissionalizante na região.' },
];

const demoCourses = [
  { id: 1, category: 'INFRAESTRUTURA', title: 'Fundamentos de Elétrica Residencial', description: 'Aprenda noções de instalações elétricas com segurança e acompanhamento profissional.', dates: '03 nov — 28 nov, 2026', status: 'Aprovado', color: 'green', initials: 'EL' },
  { id: 2, category: 'TECNOLOGIA', title: 'Informática para o Dia a Dia', description: 'Desenvolva habilidades digitais essenciais para o mercado de trabalho atual.', dates: '10 nov — 05 dez, 2026', status: 'Aprovado', color: 'blue', initials: 'IT' },
  { id: 3, category: 'COMÉRCIO', title: 'Atendimento e Vendas', description: 'Técnicas de comunicação, relacionamento com clientes e vendas consultivas.', dates: '12 nov — 02 dez, 2026', status: 'Pendente', color: 'orange', initials: 'AV' },
  { id: 4, category: 'ALIMENTAÇÃO', title: 'Boas Práticas na Cozinha', description: 'Aprenda higiene, manipulação de alimentos e preparo de receitas do dia a dia.', dates: '18 nov — 12 dez, 2026', status: 'Aprovado', color: 'rose', initials: 'BP' },
];

const demoJobs = [
  { id: 1, title: 'Auxiliar de logística', company: 'Distribuidora Paraná', location: 'Cachoeira · Presencial', type: 'Integral', posted: 'Publicada hoje', color: 'blue' },
  { id: 2, title: 'Atendente de loja', company: 'Mercado Bom Vizinho', location: 'Centro · Presencial', type: 'Meio período', posted: 'Publicada há 2 dias', color: 'orange' },
  { id: 3, title: 'Auxiliar de cozinha', company: 'Restaurante Sabor da Casa', location: 'Cachoeira · Presencial', type: 'Integral', posted: 'Publicada há 3 dias', color: 'rose' },
];

const routeTitles = {
  '/': 'Dashboard',
  '/membros': 'Membros da Comunidade',
  '/eventos': 'Eventos',
  '/escalas': 'Escalas de Voluntários',
  '/triagem': 'Triagem Social',
  '/empregabilidade': 'Empregabilidade e Cursos',
  '/financeiro': 'Financeiro',
};

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V6H9zM9 12h6M9 16h6" /></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h2" /><path d="M5 5V4a2 2 0 0 1 2-2h11" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrowUp: <><path d="m7 14 5-5 5 5M12 19V9" /></>,
    arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4-.1Z" /><path d="M12 9v4M12 17h.01" /></>,
    userPlus: <><path d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.1 10.3a16 16 0 0 0 6 6l1.9-1.9a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 2.3 2.6Z" />,
    filter: <><path d="M4 7h16M7 12h10M10 17h4" /><circle cx="8" cy="7" r="1.5" fill="currentColor" /><circle cx="16" cy="12" r="1.5" fill="currentColor" /></>,
    graduation: <><path d="m2 10 10-5 10 5-10 5z" /><path d="M6 12v5c3.5 3 8.5 3 12 0v-5M22 10v6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...shared}>{shapes[name] || shapes.grid}</svg>;
}


function getPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}
function normaliseList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'IE';
}

function Avatar({ name, color = 'mint', small = false }) {
  return <span className={`avatar avatar-${color}${small ? ' avatar-small' : ''}`} aria-hidden="true">{initials(name)}</span>;
}

function StatusBadge({ children, tone = 'green' }) {
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children}</span>;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LoadingState({ label = 'Carregando informações...' }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>;
}

function EmptyState({ title = 'Nada por aqui ainda', description = 'Quando houver informações disponíveis, elas aparecerão nesta área.' }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="file" size={21} /></span><strong>{title}</strong><p>{description}</p></div>;
}

function ConnectionNotice({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="connection-notice" role="status">
      <span className="connection-icon"><Icon name="alert" size={17} /></span>
      <div><strong>Não foi possível conectar à API.</strong><span> Exibindo dados de demonstração. {error}</span></div>
      <button className="icon-button notice-dismiss" type="button" aria-label="Dispensar aviso" onClick={onDismiss}><Icon name="close" size={16} /></button>
    </div>
  );
}

function Sidebar({ activePath, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => onNavigate(event, '/')}>
        <span className="brand-symbol"><span>IEQ</span><i /></span>
        <span className="brand-copy"><strong>IEQ Cachoeira</strong><small>Comunidade de fé</small></span>
      </a>
      <div className="sidebar-label">MENU PRINCIPAL</div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navigation.map((item) => (
          <a key={item.href} href={item.href} onClick={(event) => onNavigate(event, item.href)} className={`nav-link${activePath === item.href ? ' active' : ''}`} aria-label={item.label} aria-current={activePath === item.href ? 'page' : undefined}>
            <Icon name={item.icon} size={19} /><span>{item.label}</span>
            {item.href === '/triagem' && <span className="nav-count">12</span>}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><span className="help-mark"><Icon name="heart" size={17} /></span><strong>Uma comunidade<br />que cuida.</strong><span>Juntos, fazemos a diferença.</span></div>
        <button className="profile-button" type="button" aria-label="Perfil de Pr. Carlos">
          <img className="profile-avatar" src="/pastor-carlos.svg" alt="Foto de perfil de Pr. Carlos" />
          <span className="profile-copy"><strong>Pr. Carlos</strong><small>Admin Geral</small></span>
          <Icon name="more" size={18} />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, onCreate }) {
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
  return (
    <header className="topbar">
      <div className="topbar-title"><span className="topbar-kicker">IEQ CACHOEIRA</span><span>{title}</span></div>
      <div className="topbar-actions">
        <span className="topbar-date"><span className="date-dot" />{date}</span>
        <button className="icon-button notification-button" type="button" aria-label="Notificações"><Icon name="bell" size={19} /><span /></button>
        <span className="topbar-divider" />
        <button className="quick-profile" type="button"><Avatar name="Pr. Carlos" color="green" small /><span><strong>Pr. Carlos</strong><small>Administrador</small></span><Icon name="chevronDown" size={15} /></button>
      </div>
    </header>
  );
}

function DashboardPage({ setModal }) {
  const [events, setEvents] = useState(demoEvents);
  const [activities, setActivities] = useState(demoActivities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.allSettled([getEvents(), getRecentActivities()])
      .then(([eventResult, activityResult]) => {
        if (!active) return;
        const failures = [];
        if (eventResult.status === 'fulfilled') setEvents(normaliseList(eventResult.value));
        else failures.push(eventResult.reason.message);
        if (activityResult.status === 'fulfilled') setActivities(normaliseList(activityResult.value));
        else failures.push(activityResult.reason.message);
        if (failures.length) setError(failures.join(' '));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function saveEvent(values) {
    const created = await createEvent(values);
    setEvents((current) => [{ ...values, ...(created || {}), id: created?.id || Date.now() }, ...current]);
  }

  const metrics = [
    { icon: 'users', label: 'Membros ativos', value: '248', change: '+4 cadastros esta semana', color: 'green' },
    { icon: 'calendar', label: 'Eventos este mês', value: '05', change: 'Próximo evento hoje, às 18h', color: 'blue' },
    { icon: 'heart', label: 'Triagens pendentes', value: '12', change: '3 necessitam contato urgente', color: 'orange' },
    { icon: 'clipboard', label: 'Voluntários escalados', value: '34', change: '100% das vagas cobertas', color: 'lilac' },
  ];
  const welcomeDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toLocaleUpperCase('pt-BR');

  return (
    <>
      <ConnectionNotice error={error} onDismiss={() => setError('')} />
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-overline"><span className="welcome-sun">✦</span> {welcomeDate}</span>
          <h1>Olá, Pastor Carlos <span>👋</span></h1>
          <p>Que bom ter você por aqui. Veja o que está acontecendo na sua comunidade.</p>
        </div>
        <div className="welcome-art" aria-hidden="true"><span className="art-halo" /><span className="art-cross">✝</span><span className="art-leaf leaf-one">⌁</span><span className="art-leaf leaf-two">⌁</span><span className="art-sparkle">✦</span></div>
        <button className="button button-light welcome-button" type="button" onClick={() => setModal({ type: 'member', title: 'Novo membro' })}><Icon name="plus" size={16} /> Novo membro</button>
      </section>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top"><span className={`metric-icon metric-${metric.color}`}><Icon name={metric.icon} size={19} /></span><span className={`metric-trend${index === 2 ? ' trend-alert' : ''}`}><Icon name={index === 2 ? 'clock' : 'arrowUp'} size={13} />{index === 0 ? '3,2%' : index === 1 ? '2 novos' : index === 2 ? 'Atenção' : 'Completa'}</span></div>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className={`metric-change${index === 2 ? ' change-alert' : ''}`}>{metric.change}</span>
            <div className={`metric-sparkline spark-${index}`} aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel upcoming-panel">
          <div className="panel-heading"><div><span className="eyebrow">FIQUE POR DENTRO</span><h2>Próximos eventos</h2></div><a className="text-link" href="/eventos">Ver agenda <Icon name="arrowRight" size={15} /></a></div>
          {loading && <LoadingState label="Atualizando agenda..." />}
          <div className="event-list">
            {events.length ? events.slice(0, 3).map((event, index) => {
              const date = event.date ? new Date(event.date) : null;
              const day = event.day || (date && !Number.isNaN(date.valueOf()) ? String(date.getDate()).padStart(2, '0') : ['12', '18', '25'][index]);
              const month = event.month || (date && !Number.isNaN(date.valueOf()) ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '').toUpperCase() : 'OUT');
              return <article className="event-row" key={event.id || event.title || index}><div className={`event-date event-${event.color || ['green', 'blue', 'orange'][index % 3]}`}><strong>{day}</strong><span>{month}</span></div><div className="event-info"><strong>{event.title || event.name || 'Evento da comunidade'}</strong><span><Icon name="clock" size={13} />{event.time || event.startTime || ['Domingo, 18h', 'Sábado, 19h', 'Sábado, 9h'][index]}</span></div><div className="event-location"><Icon name="pin" size={14} />{event.location || event.venue || ['Templo Principal', 'Salão de Eventos', 'Praça da Cachoeira'][index]}</div><button className="icon-button event-more" type="button" aria-label={`Mais opções para ${event.title || event.name || 'evento'}`}><Icon name="more" size={17} /></button></article>;
            }) : <EmptyState title="Nenhum evento próximo" description="Cadastre um evento para preencher sua agenda." />}
          </div>
          <button className="add-event-link" type="button" onClick={() => setModal({ type: 'event', title: 'Novo evento', onSave: saveEvent })}><Icon name="plus" size={15} /> Adicionar evento</button>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading"><div><span className="eyebrow">ACONTECE NA IEQ</span><h2>Atividades recentes</h2></div><button className="icon-button" type="button" aria-label="Mais atividades"><Icon name="more" size={18} /></button></div>
          {loading && <LoadingState label="Carregando atividades..." />}
          {activities.length ? <div className="activity-list">{activities.slice(0, 4).map((activity, index) => <article className="activity-row" key={activity.id || index}><span className={`activity-icon activity-${activity.color || ['mint', 'rose', 'lilac', 'amber'][index % 4]}`}><Icon name={activity.icon || ['userPlus', 'heart', 'briefcase', 'calendar'][index % 4]} size={16} /></span><div className="activity-info"><strong>{activity.title || activity.description || 'Atualização da comunidade'}</strong><span>{activity.detail || activity.name || activity.subtitle || ''}</span></div><time>{activity.time || activity.createdAt || ['há 24 min', 'há 1 hora', 'há 3 horas', 'ontem'][index]}</time></article>)}</div> : <EmptyState title="Nenhuma atividade recente" />}
          <a className="activity-footer" href="/membros">Ver todas as atividades <Icon name="arrowRight" size={14} /></a>
        </section>
      </div>

      <section className="verse-card"><span className="verse-mark">“</span><div><p>“Alegrem-se com os que se alegram; chorem com os que choram.”</p><span>ROMANOS 12:15 <i /></span></div><Icon name="sparkles" size={25} /></section>
    </>
  );
}

function MembersPage({ setModal }) {
  const [members, setMembers] = useState(demoMembers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    getMembers().then((data) => { if (active) setMembers(normaliseList(data)); })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const filtered = useMemo(() => members.filter((member) => {
    const name = member.name || member.fullName || '';
    const matchesSearch = `${name} ${member.email || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'Todos' || (filter === 'Ativos' && (member.status || 'Ativo') === 'Ativo') || (filter === 'Inativos' && member.status === 'Inativo') || (filter === 'Voluntários' && (member.role || member.access || '').toLowerCase().includes('volunt'));
    return matchesSearch && matchesFilter;
  }), [members, search, filter]);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleMembers = filtered.slice((page - 1) * pageSize, page * pageSize);
  const tabs = [['Todos', '248'], ['Ativos', '230'], ['Inativos', '18'], ['Voluntários', '34']];

  async function saveMember(values) {
    const created = await createMember(values);
    setMembers((current) => [{ ...values, ...(created || {}), id: created?.id || Date.now(), status: 'Ativo', role: 'Membro' }, ...current]);
  }

  return (
    <>
      <ConnectionNotice error={error} onDismiss={() => setError('')} />
      <SectionHeading eyebrow="NOSSA COMUNIDADE" title="Membros da Comunidade" description="Acompanhe e cuide de cada pessoa que faz parte da nossa família." action={<button className="button button-primary" type="button" onClick={() => setModal({ type: 'member', title: 'Novo membro', onSave: saveMember })}><Icon name="plus" size={17} /> Novo membro</button>} />
      <section className="panel members-panel">
        <div className="members-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filtrar membros">{tabs.map(([label, count]) => <button key={label} type="button" role="tab" aria-selected={filter === label} className={`filter-tab${filter === label ? ' selected' : ''}`} onClick={() => { setFilter(label); setPage(1); }}>{label}<span>{count}</span></button>)}</div><label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar membro..." aria-label="Buscar membro por nome ou email" /><kbd>⌘ K</kbd></label></div>
        {loading && <LoadingState />}
        <div className="table-scroll"><table className="members-table"><thead><tr><th><span className="checkbox" aria-hidden="true" />Nome</th><th>Email</th><th>Telefone</th><th>Status</th><th>Acesso</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
          {visibleMembers.map((member, index) => {
            const name = member.name || member.fullName || 'Membro da IEQ';
            const status = member.status || 'Ativo';
            const role = member.role || member.access || 'Membro';
            return <tr key={member.id || member.email || index}><td><span className="member-name-cell"><span className="checkbox" aria-hidden="true" /><Avatar name={name} color={member.color || ['rose', 'blue', 'lilac', 'amber', 'mint'][index % 5]} /><strong>{name}</strong></span></td><td className="muted-cell">{member.email || '—'}</td><td className="muted-cell">{member.phone || member.telephone || '—'}</td><td><StatusBadge tone={status.toLowerCase() === 'inativo' ? 'gray' : 'green'}>{status}</StatusBadge></td><td><span className={`role-badge role-${role.toLowerCase().includes('admin') ? 'admin' : role.toLowerCase().includes('volunt') ? 'volunteer' : 'member'}`}><span />{role}</span></td><td><div className="row-actions"><button className="icon-button" type="button" aria-label={`Editar ${name}`}><Icon name="edit" size={16} /></button><button className="icon-button" type="button" aria-label={`Mais opções para ${name}`}><Icon name="more" size={17} /></button></div></td></tr>;
          })}
        </tbody></table></div>
        {!loading && visibleMembers.length === 0 && <EmptyState title="Nenhum membro encontrado" description="Tente alterar sua busca ou os filtros selecionados." />}
        <div className="table-footer"><span>Exibindo <strong>{filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)}</strong> de <strong>{filtered.length}</strong> membros</span><div className="pagination"><button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><Icon name="chevronLeft" size={16} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 3).map((number) => <button className={page === number ? 'current' : ''} type="button" aria-label={`Página ${number}`} aria-current={page === number ? 'page' : undefined} key={number} onClick={() => setPage(number)}>{number}</button>)}{pageCount > 3 && <span>…</span>}<button type="button" aria-label="Próxima página" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}><Icon name="chevronRight" size={16} /></button></div></div>
      </section>
      <div className="members-note"><Icon name="users" size={16} /><span>Uma comunidade forte começa com relacionamentos próximos e cuidado genuíno.</span><span className="members-note-end">IEQ Cachoeira</span></div>
    </>
  );
}

function TriagePage() {
  const [cases, setCases] = useState(demoSocialCases);
  const [selectedId, setSelectedId] = useState(1);
  const [status, setStatus] = useState('Pendente');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const selectedCase = cases.find((socialCase) => String(socialCase.id) === String(selectedId)) || cases[0];
  useEffect(() => {
    let active = true;
    getSocialCases().then((data) => {
      if (active) {
        const remoteCases = normaliseList(data);
        setCases(remoteCases);
        setSelectedId(remoteCases[0]?.id ?? null);
        setStatus(remoteCases[0]?.status || 'Pendente');
        setNotes(remoteCases[0]?.notes || '');
      }
    }).catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function updateCase(extra = {}) {
    setMessage('');
    try {
      await updateSocialCase(selectedCase.id, { status, notes, ...extra });
      setCases((current) => current.map((item) => item.id === selectedCase.id ? { ...item, status, notes, ...extra } : item));
      setSaved(true);
      setMessage(extra.forwarded ? 'Caso encaminhado para a assistente social.' : 'Anotações salvas com sucesso.');
    } catch (cause) {
      setMessage(`Não foi possível atualizar o caso: ${cause.message}`);
    }
  }

  return (
    <>
      <ConnectionNotice error={error} onDismiss={() => setError('')} />
      <SectionHeading eyebrow="CUIDADO E ACOLHIMENTO" title="Triagem Social" description="Acompanhe cada pedido de ajuda com respeito, cuidado e confidencialidade." />
      <div className="lgpd-banner" role="note"><span className="lgpd-icon"><Icon name="alert" size={19} /></span><div><strong>Atenção: Confidencialidade e LGPD</strong><p>Todas as informações de triagem social contêm dados pessoais altamente sensíveis. O manuseio deve respeitar as diretrizes da Lei Geral de Proteção de Dados.</p></div><span className="lgpd-lock">DADOS SENSÍVEIS</span></div>
      <div className="triage-layout">
        <section className="panel case-list-panel"><div className="case-list-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Casos em andamento <span className="case-total">{cases.length}</span></h2></div><button className="icon-button" type="button" aria-label="Filtrar casos"><Icon name="filter" size={18} /></button></div>
          <label className="search-field case-search"><Icon name="search" size={16} /><input placeholder="Buscar por nome..." aria-label="Buscar por nome" /></label>
          {loading && <LoadingState label="Carregando casos..." />}
          <div className="case-list">{cases.map((socialCase, index) => <button type="button" key={socialCase.id || index} className={`case-item${String(socialCase.id) === String(selectedId) ? ' selected' : ''}`} onClick={() => { setSelectedId(socialCase.id); setStatus(socialCase.status || 'Pendente'); setNotes(socialCase.notes || ''); setSaved(false); setMessage(''); }}><Avatar name={socialCase.name || socialCase.fullName} color={['rose', 'blue', 'amber', 'lilac'][index % 4]} /><span className="case-item-copy"><strong>{socialCase.name || socialCase.fullName || 'Assistido'}</strong><small>{socialCase.time || socialCase.createdAt || 'Hoje'}</small><StatusBadge tone={statusTone(socialCase.status)}>{socialCase.status || 'Pendente'}</StatusBadge></span><Icon name="chevronRight" size={16} /></button>)}</div>
          {!loading && cases.length === 0 && <EmptyState title="Nenhum caso registrado" />}
          <button className="case-history-link" type="button"><Icon name="clock" size={15} /> Ver histórico de atendimentos</button>
        </section>
        {selectedCase ? <section className="panel case-detail-panel"><div className="case-detail-header"><div><span className="eyebrow">DETALHES DO ATENDIMENTO</span><div className="case-title-row"><h2>{selectedCase.name || selectedCase.fullName}</h2><StatusBadge tone={statusTone(status)}>{status}</StatusBadge></div><span className="case-opened"><Icon name="clock" size={14} />Solicitação recebida {selectedCase.time || selectedCase.createdAt || 'hoje'}</span></div><button className="icon-button" type="button" aria-label="Mais opções do caso"><Icon name="more" size={19} /></button></div>
          <div className="case-facts"><div><span>CPF</span><strong>***.452.***-09</strong></div><div><span>Tempo de membro</span><strong>2 anos e 4 meses</strong></div><div><span>Responsável</span><strong><Avatar name="Pr. Carlos" color="green" small /> Pr. Carlos</strong></div></div>
          <div className="detail-divider" />
          <div className="case-section-title"><span className="case-section-icon"><Icon name="heart" size={16} /></span><div><h3>Demandas e Necessidades Declaradas</h3><span>Informações compartilhadas pelo assistido</span></div></div>
          <div className="demand-note"><span>“</span><p>{selectedCase.demand || selectedCase.description || 'O assistido solicitou acolhimento e orientação da equipe de assistência social.'}</p></div>
          <label className="form-label" htmlFor="triage-status">Atualizar status de atendimento</label><div className="select-wrap"><select id="triage-status" value={status} onChange={(event) => { setStatus(event.target.value); setSaved(false); }}><option>Pendente</option><option>Em atendimento</option><option>Aguardando retorno</option><option>Concluído</option></select><Icon name="chevronDown" size={16} /></div>
          <label className="form-label notes-label" htmlFor="triage-notes">Notas internas <span>Visíveis apenas para a equipe autorizada</span></label><textarea id="triage-notes" className="notes-input" rows="3" value={notes} onChange={(event) => { setNotes(event.target.value); setSaved(false); }} placeholder="Registre observações importantes sobre o atendimento..." />
          {message && <p className={`inline-message${message.startsWith('Não') ? ' inline-error' : ''}`} role="status">{message}</p>}
          <div className="case-actions"><button className="button button-secondary" type="button" onClick={() => updateCase()} disabled={saved}><Icon name={saved ? 'check' : 'file'} size={16} />{saved ? 'Notas salvas' : 'Salvar notas'}</button><button className="button button-primary" type="button" onClick={() => updateCase({ forwarded: true })}><Icon name="send" size={16} /> Encaminhar para Assistente Social</button></div>
        </section> : <section className="panel case-detail-panel"><EmptyState title="Selecione um atendimento" /></section>}
      </div>
      <div className="privacy-footer"><Icon name="heart" size={16} /><span>O cuidado começa com a escuta. Obrigado por tratar cada história com dignidade e carinho.</span><strong>ACESSO RESTRITO</strong></div>
    </>
  );
}

function statusTone(value = '') {
  const statusValue = value.toLowerCase();
  if (statusValue.includes('conclu')) return 'green';
  if (statusValue.includes('atendimento')) return 'blue';
  if (statusValue.includes('retorno')) return 'orange';
  if (statusValue.includes('pendente')) return 'orange';
  return 'gray';
}

function EmploymentPage({ setModal }) {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState(demoCourses);
  const [jobs, setJobs] = useState(demoJobs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.allSettled([getCourses(), getJobs()])
      .then(([courseResult, jobResult]) => {
        if (!active) return;
        const failures = [];
        if (courseResult.status === 'fulfilled') setCourses(normaliseList(courseResult.value));
        else failures.push(courseResult.reason.message);
        if (jobResult.status === 'fulfilled') setJobs(normaliseList(jobResult.value));
        else failures.push(jobResult.reason.message);
        if (failures.length) setError(failures.join(' '));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function saveCourse(values) {
    const created = await createCourse(values);
    setCourses((current) => [{ ...values, ...(created || {}), id: created?.id || Date.now(), status: 'Pendente', category: 'NOVO CURSO' }, ...current]);
  }
  async function saveJob(values) {
    const created = await createJob(values);
    setJobs((current) => [{ ...values, ...(created || {}), id: created?.id || Date.now() }, ...current]);
  }
  const items = tab === 'courses' ? courses : jobs;

  return (
    <>
      <ConnectionNotice error={error} onDismiss={() => setError('')} />
      <SectionHeading eyebrow="OPORTUNIDADES PARA CRESCER" title="Empregabilidade e Cursos" description="Conectando talentos a novas oportunidades de trabalho e aprendizado." action={<button className="button button-primary" type="button" onClick={() => setModal({ type: tab === 'courses' ? 'course' : 'job', title: tab === 'courses' ? 'Novo curso' : 'Nova vaga', onSave: tab === 'courses' ? saveCourse : saveJob })}><Icon name="plus" size={17} /> {tab === 'courses' ? 'Novo curso' : 'Nova vaga'}</button>} />
      <div className="employment-intro"><span className="employment-intro-icon"><Icon name="graduation" size={22} /></span><div><strong>Oportunidades que transformam histórias</strong><p>Encontre cursos e vagas preparados para fortalecer a comunidade.</p></div><div className="employment-stats"><span><strong>{jobs.length}</strong> vagas abertas</span><i /><span><strong>{courses.length}</strong> cursos locais</span></div></div>
      <section className="panel opportunities-panel"><div className="opportunity-toolbar"><div className="opportunity-tabs" role="tablist" aria-label="Tipo de oportunidade"><button role="tab" aria-selected={tab === 'jobs'} className={`opportunity-tab${tab === 'jobs' ? ' active' : ''}`} type="button" onClick={() => setTab('jobs')}><Icon name="briefcase" size={17} />Vagas de emprego<span>{jobs.length}</span></button><button role="tab" aria-selected={tab === 'courses'} className={`opportunity-tab${tab === 'courses' ? ' active' : ''}`} type="button" onClick={() => setTab('courses')}><Icon name="graduation" size={17} />Cursos locais<span>{courses.length}</span></button></div><button className="button button-filter" type="button"><Icon name="filter" size={16} /> Filtrar</button></div>
        {loading && <LoadingState label="Buscando oportunidades..." />}
        {items.length ? tab === 'courses' ? <div className="course-grid">{courses.map((course, index) => <article className="course-card" key={course.id || index}><div className={`course-art course-art-${course.color || ['green', 'blue', 'orange', 'rose'][index % 4]}`}><span className="course-symbol"><Icon name={course.icon || ['clipboard', 'grid', 'users', 'heart'][index % 4]} size={26} /></span><span className="course-art-dots">✦ &nbsp; ·</span><span className="course-category">{course.category || 'CURSO LOCAL'}</span></div><div className="course-card-content"><div className="course-card-top"><StatusBadge tone={(course.status || 'Aprovado').toLowerCase() === 'pendente' ? 'orange' : 'green'}>{course.status || 'Aprovado'}</StatusBadge><button className="icon-button" type="button" aria-label={`Mais opções para ${course.title}`}><Icon name="more" size={17} /></button></div><h3>{course.title || course.name || 'Curso da comunidade'}</h3><p>{course.description || 'Uma oportunidade de aprendizado e desenvolvimento para a nossa comunidade.'}</p><div className="course-date"><Icon name="calendar" size={15} />{course.dates || course.period || 'Inscrições abertas'}</div><button className="course-manage" type="button">Gerenciar inscrições <Icon name="arrowRight" size={15} /></button></div></article>)}</div> : <div className="job-list">{jobs.map((job, index) => <article className="job-card" key={job.id || index}><span className={`job-icon job-${job.color || ['blue', 'orange', 'rose'][index % 3]}`}><Icon name="briefcase" size={20} /></span><div className="job-content"><span className="job-posted">{job.posted || 'Oportunidade aberta'}</span><h3>{job.title || job.name || 'Vaga de emprego'}</h3><p>{job.company || job.employer || 'Empresa parceira'} <i /> {job.location || job.city || 'Cachoeira'}</p></div><span className="job-type">{job.type || 'Integral'}</span><button className="button button-secondary" type="button">Ver candidatos <Icon name="arrowRight" size={15} /></button></article>)}</div> : <EmptyState title={tab === 'courses' ? 'Nenhum curso disponível' : 'Nenhuma vaga disponível'} description="As novas oportunidades aparecerão aqui." />}
      </section>
      <div className="employment-footer"><span><Icon name="heart" size={16} />Cada oportunidade abre um novo caminho.</span><a href="/membros">Conheça a comunidade <Icon name="arrowRight" size={14} /></a></div>
    </>
  );
}

function EventsPage({ setModal }) {
  const [events, setEvents] = useState(demoEvents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getEvents().then((data) => { if (active) setEvents(normaliseList(data)); })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function saveEvent(values) {
    const created = await createEvent(values);
    setEvents((current) => [{ ...values, ...(created || {}), id: created?.id || Date.now() }, ...current]);
  }
  return <><ConnectionNotice error={error} onDismiss={() => setError('')} /><SectionHeading eyebrow="VIDA EM COMUNIDADE" title="Eventos" description="Celebrações, encontros e momentos especiais da nossa igreja." action={<button className="button button-primary" type="button" onClick={() => setModal({ type: 'event', title: 'Novo evento', onSave: saveEvent })}><Icon name="plus" size={17} /> Novo evento</button>} /><section className="panel calendar-panel"><div className="calendar-toolbar"><div><span className="eyebrow">AGENDA DA COMUNIDADE</span><h2>Outubro <span>2026</span></h2></div><div className="calendar-controls"><button className="icon-button" type="button" aria-label="Mês anterior"><Icon name="chevronLeft" size={17} /></button><button className="button button-secondary" type="button">Hoje</button><button className="icon-button" type="button" aria-label="Próximo mês"><Icon name="chevronRight" size={17} /></button></div></div>{loading && <LoadingState />}{events.length ? <div className="full-event-list">{events.map((event, index) => <article className="full-event-row" key={event.id || index}><div className={`event-date event-${event.color || ['green', 'blue', 'orange'][index % 3]}`}><strong>{event.day || ['12', '18', '25'][index % 3]}</strong><span>{event.month || 'OUT'}</span></div><div className="full-event-main"><h3>{event.title || event.name || 'Evento da comunidade'}</h3><div><span><Icon name="clock" size={14} />{event.time || 'Domingo, 18h'}</span><span><Icon name="pin" size={14} />{event.location || 'Templo Principal'}</span></div></div><StatusBadge>Confirmado</StatusBadge><button className="icon-button" type="button" aria-label={`Mais opções para ${event.title}`}><Icon name="more" size={18} /></button></article>)}</div> : <EmptyState title="Sua agenda está vazia" description="Adicione o primeiro evento da comunidade." />}</section></>;
}

function ScalesPage() {
  const [scales, setScales] = useState([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getScales().then((data) => {
      if (active) {
        setScales(normaliseList(data));
        setRemoteLoaded(true);
      }
    })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const sampleScales = remoteLoaded ? scales : [
    { name: 'Recepção e boas-vindas', event: 'Culto de Celebração · 12 out, 18h', people: '4 voluntários', status: 'Completa', color: 'mint' },
    { name: 'Louvor e adoração', event: 'Culto de Celebração · 12 out, 18h', people: '6 voluntários', status: 'Completa', color: 'lilac' },
    { name: 'Ação social', event: 'Ação Social · 25 out, 9h', people: '8 voluntários', status: 'Completa', color: 'rose' },
    { name: 'Ministério infantil', event: 'Encontro de Famílias · 18 out, 19h', people: '5 voluntários', status: 'Completa', color: 'amber' },
  ];
  return <><ConnectionNotice error={error} onDismiss={() => setError('')} /><SectionHeading eyebrow="SERVIR COM ALEGRIA" title="Escalas de Voluntários" description="Organize equipes e acompanhe quem está servindo em cada encontro." action={<button className="button button-primary" type="button"><Icon name="plus" size={17} /> Nova escala</button>} /><div className="metrics-grid scales-metrics"><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-lilac"><Icon name="users" size={18} /></span><span className="metric-trend">ESTE MÊS</span></div><span className="metric-label">Voluntários ativos</span><strong className="metric-value">34</strong><span className="metric-change">Servindo em 6 ministérios</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-green"><Icon name="check" size={18} /></span><span className="metric-trend">100%</span></div><span className="metric-label">Vagas preenchidas</span><strong className="metric-value">18<span className="metric-denom">/18</span></strong><span className="metric-change">Escalas confirmadas</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-blue"><Icon name="calendar" size={18} /></span></div><span className="metric-label">Próximo compromisso</span><strong className="metric-value metric-date-value">12 <small>OUT</small></strong><span className="metric-change">Culto de Celebração</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-orange"><Icon name="heart" size={18} /></span></div><span className="metric-label">Ministérios ativos</span><strong className="metric-value">06</strong><span className="metric-change">Equipes em serviço</span></article></div><section className="panel scales-panel"><div className="panel-heading"><div><span className="eyebrow">EQUIPE EM SERVIÇO</span><h2>Próximas escalas</h2></div><button className="button button-secondary" type="button"><Icon name="calendar" size={15} /> Ver calendário</button></div>{loading && <LoadingState />}{sampleScales.length ? <div className="scale-list">{sampleScales.map((scale, index) => <article className="scale-row" key={scale.id || index}><span className={`scale-icon scale-${scale.color || 'mint'}`}><Icon name="users" size={18} /></span><div><strong>{scale.name || scale.title || 'Equipe voluntária'}</strong><span>{scale.event || 'Culto da comunidade · 18h'}</span></div><span className="scale-people">{scale.people || `${scale.volunteers?.length || 4} voluntários`}</span><StatusBadge>{scale.status || 'Completa'}</StatusBadge><button className="icon-button" type="button" aria-label={`Ver escala ${scale.name}`}><Icon name="chevronRight" size={16} /></button></article>)}</div> : <EmptyState title="Nenhuma escala planejada" />}</section></>;
}

function FinancePage() {
  const [summary, setSummary] = useState(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getFinanceSummary().then((data) => {
      if (active) {
        setSummary(data);
        setRemoteLoaded(true);
      }
    })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const transactions = remoteLoaded ? (summary?.transactions || []) : [
    { title: 'Oferta de domingo', category: 'Contribuições', date: '26 out, 2026', amount: '+ R$ 2.450,00', type: 'in' },
    { title: 'Apoio cesta básica', category: 'Ação social', date: '24 out, 2026', amount: '− R$ 680,00', type: 'out' },
    { title: 'Dízimos da semana', category: 'Contribuições', date: '19 out, 2026', amount: '+ R$ 4.120,00', type: 'in' },
    { title: 'Materiais de limpeza', category: 'Manutenção', date: '18 out, 2026', amount: '− R$ 215,00', type: 'out' },
  ];
  return <><ConnectionNotice error={error} onDismiss={() => setError('')} /><SectionHeading eyebrow="GESTÃO COM TRANSPARÊNCIA" title="Financeiro" description="Acompanhe as movimentações e cuide dos recursos da comunidade." action={<button className="button button-secondary" type="button"><Icon name="file" size={16} /> Exportar relatório</button>} /><div className="metrics-grid finance-metrics"><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-green"><Icon name="arrowUp" size={18} /></span><span className="metric-trend">ESTE MÊS</span></div><span className="metric-label">Entradas</span><strong className="metric-value">{summary?.income || 'R$ 8.450'}</strong><span className="metric-change">Contribuições e ofertas</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-orange"><Icon name="arrowRight" size={18} /></span><span className="metric-trend">ESTE MÊS</span></div><span className="metric-label">Saídas</span><strong className="metric-value">{summary?.expenses || 'R$ 2.180'}</strong><span className="metric-change">Despesas e ações sociais</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-blue"><Icon name="wallet" size={18} /></span></div><span className="metric-label">Saldo do mês</span><strong className="metric-value">{summary?.balance || 'R$ 6.270'}</strong><span className="metric-change">Atualizado hoje</span></article><article className="metric-card"><div className="metric-top"><span className="metric-icon metric-lilac"><Icon name="heart" size={18} /></span></div><span className="metric-label">Ações sociais</span><strong className="metric-value">{summary?.socialActions || 'R$ 1.240'}</strong><span className="metric-change">Investidos na comunidade</span></article></div><section className="panel finance-panel"><div className="panel-heading"><div><span className="eyebrow">OUTUBRO 2026</span><h2>Movimentações recentes</h2></div><button className="button button-secondary" type="button"><Icon name="filter" size={15} /> Filtrar</button></div>{loading && <LoadingState />}{transactions.length ? <div className="transaction-list">{transactions.map((transaction, index) => <article className="transaction-row" key={transaction.id || index}><span className={`transaction-icon transaction-${transaction.type || 'in'}`}><Icon name={transaction.type === 'out' ? 'arrowRight' : 'arrowUp'} size={17} /></span><div><strong>{transaction.title || transaction.description || 'Movimentação'}</strong><span>{transaction.category || 'Geral'} <i /> {transaction.date || 'Hoje'}</span></div><strong className={`transaction-amount ${transaction.type === 'out' ? 'amount-out' : ''}`}>{transaction.amount || 'R$ 0,00'}</strong></article>)}</div> : <EmptyState title="Nenhuma movimentação registrada" />}</section></>;
}

function CreateModal({ modal, onClose }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!modal) return null;
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSaving(true);
    setError('');
    try {
      if (modal.onSave) await modal.onSave(values);
      else if (modal.type === 'member') await createMember(values);
      else if (modal.type === 'course') await createCourse(values);
      else if (modal.type === 'event') await createEvent(values);
      else await createJob(values);
      onClose();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">IEQ CACHOEIRA</span><h2 id="modal-title">{modal.title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar"><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="create-name">{modal.type === 'member' ? 'Nome completo' : 'Título'}<span className="required-mark"> *</span></label>
          <input id="create-name" name={modal.type === 'member' ? 'name' : 'title'} className="modal-input" required placeholder={modal.type === 'member' ? 'Nome da pessoa' : 'Nome da oportunidade'} autoFocus />
          {modal.type !== 'member' && <><label className="form-label" htmlFor="create-description">Descrição</label><textarea id="create-description" name="description" rows="3" className="modal-input modal-textarea" placeholder="Conte um pouco mais..." /></>}
          {modal.type === 'member' && <>
            <label className="form-label" htmlFor="create-email">Email</label><input id="create-email" name="email" type="email" className="modal-input" placeholder="nome@email.com" />
            <label className="form-label" htmlFor="create-phone">Telefone</label><input id="create-phone" name="phone" className="modal-input" placeholder="(41) 99999-9999" />
            <label className="form-label" htmlFor="create-notes">Observações</label><input id="create-notes" name="notes" className="modal-input" placeholder="Informações adicionais (opcional)" />
          </>}
          {modal.type === 'event' && <>
            <label className="form-label" htmlFor="create-date">Data e horário</label><input id="create-date" name="date" type="datetime-local" className="modal-input" />
            <label className="form-label" htmlFor="create-location">Local</label><input id="create-location" name="location" className="modal-input" placeholder="Templo Principal" />
          </>}
          {modal.type === 'course' && <><label className="form-label" htmlFor="create-dates">Período</label><input id="create-dates" name="dates" className="modal-input" placeholder="Ex.: 12 nov — 20 nov" /></>}
          {modal.type === 'job' && <>
            <label className="form-label" htmlFor="create-company">Empresa</label><input id="create-company" name="company" className="modal-input" placeholder="Nome da empresa" />
            <label className="form-label" htmlFor="create-location">Local</label><input id="create-location" name="location" className="modal-input" placeholder="Cachoeira · Presencial" />
          </>}
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="button button-primary" disabled={saving} type="submit">{saving ? <><span className="spinner spinner-light" /> Salvando...</> : <><Icon name="check" size={16} /> Salvar</>}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [path, setPath] = useState(getPath);
  const [modal, setModal] = useState(null);
  useEffect(() => {
    const updatePath = () => setPath(getPath());
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);
  function navigate(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (getPath() !== href) {
      window.history.pushState({}, '', href);
      setPath(href);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }
  const title = routeTitles[path] || routeTitles['/'];
  return <div className="app-shell"><Sidebar activePath={routeTitles[path] ? path : '/'} onNavigate={navigate} /><main className="main-area"><Topbar title={title} /><div className="page-content">{path === '/' ? <DashboardPage setModal={setModal} /> : path === '/membros' ? <MembersPage setModal={setModal} /> : path === '/triagem' ? <TriagePage /> : path === '/empregabilidade' ? <EmploymentPage setModal={setModal} /> : path === '/eventos' ? <EventsPage setModal={setModal} /> : path === '/escalas' ? <ScalesPage /> : path === '/financeiro' ? <FinancePage /> : <DashboardPage setModal={setModal} />}<footer className="page-footer"><span>© 2026 IEQ Cachoeira</span><span>Feito com <span className="footer-heart">♥</span> para servir melhor.</span></footer></div></main><CreateModal modal={modal} onClose={() => setModal(null)} /></div>;
}

export default App;
