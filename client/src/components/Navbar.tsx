import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tRailMarker } from '../motion';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { BookLeafMark } from './BookLeafMark';
import {
  BookOpen,
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  LogOut,
  Layers,
  Database,
  Menu,
  X
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSubmitModal?: () => void;
}

// Drawer mode mirrors the 900px CSS breakpoint in shell.css.
const DRAWER_QUERY = '(max-width: 900px)';
const subscribeDrawer = (cb: () => void) => {
  const mq = window.matchMedia(DRAWER_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useIsDrawer = () =>
  useSyncExternalStore(subscribeDrawer, () => window.matchMedia(DRAWER_QUERY).matches, () => false);

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number | null;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label, count }) => (
  <button
    type="button"
    className={`sidebar-nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    data-enter="nav-item"
  >
    {active && <motion.span layoutId="nav-highlight" className="nav-highlight" transition={tRailMarker} aria-hidden="true" />}
    <span className="nav-icon" aria-hidden="true">{icon}</span>
    <span className="nav-label">{label}</span>
    {count != null && count > 0 && (
      <span className="nav-count" aria-label={`${count} unresolved`}>{count}</span>
    )}
  </button>
);

const SectionLabel: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <div className="sidebar-section-label" id={id}>{children}</div>
);

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab, onOpenSubmitModal }) => {
  const { user, logout } = useAuth();
  const { isConnected, subscribeToTickets } = useRealtime();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unresolved, setUnresolved] = useState<number | null>(null);
  const isDrawer = useIsDrawer();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const userId = user?.id;

  // Real data only: unresolved (Open + In Progress) tickets, the same measure the queue itself uses.
  const refreshCount = useCallback(() => {
    api.getTickets()
      .then(res => setUnresolved(res.data.filter(t => t.status === 'Open' || t.status === 'In Progress').length))
      .catch(() => setUnresolved(null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setUnresolved(null);
    refreshCount();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeToTickets(() => {
      clearTimeout(timer);
      timer = setTimeout(refreshCount, 400);
    });
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [userId, refreshCount, subscribeToTickets]);

  const closeDrawer = useCallback((restoreFocus = false) => {
    setMobileOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(true); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, closeDrawer]);

  useEffect(() => { if (!isDrawer) setMobileOpen(false); }, [isDrawer]);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const selectTab = (tab: string) => {
    setMobileOpen(false);
    onSelectTab(tab);
  };

  const brandSub = user.role === 'admin' ? 'Operations' : 'Author Studio';
  const drawerOpen = !isDrawer || mobileOpen;

  return (
    <>
    <header className="mobile-header">
      <button
        ref={toggleRef}
        type="button"
        className="mobile-nav-toggle"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        aria-controls="app-sidebar"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <span className="mobile-header-brand">
        <span className="mobile-header-mark" aria-hidden="true"><BookLeafMark size={20} /></span>
        <span className="mobile-header-text">
          <span>BookLeaf</span>
          <span className="mobile-header-sub">{brandSub}</span>
        </span>
      </span>
    </header>

    <AnimatePresence>
      {isDrawer && mobileOpen && (
        <motion.div
          key="overlay"
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => closeDrawer(true)}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>

    <motion.aside
      id="app-sidebar"
      className={`sidebar ${isDrawer && mobileOpen ? 'sidebar-open' : ''}`}
      aria-label="Primary"
      initial={false}
      animate={drawerOpen ? 'open' : 'closed'}
      variants={{
        open: { x: 0, visibility: 'visible' },
        closed: { x: '-100%', transitionEnd: { visibility: 'hidden' } }
      }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <button
        type="button"
        className="sidebar-brand"
        onClick={() => selectTab(user.role === 'admin' ? 'queue' : 'dashboard')}
        title="BookLeaf Publishing"
      >
        <span className="sidebar-brand-icon" data-enter="mark" aria-hidden="true">
          <BookLeafMark size={22} />
        </span>
        <span className="sidebar-brand-text" data-enter="brand-text">
          <span className="sidebar-brand-name">BookLeaf</span>
          <span className="sidebar-brand-sub">{brandSub}</span>
        </span>
      </button>
      <span className="sidebar-dots" data-enter="rule" aria-hidden="true" />

      <SectionLabel id="sidebar-section-label">Workspace</SectionLabel>

      <nav className="sidebar-nav" aria-labelledby="sidebar-section-label">
        {user.role === 'author' ? (
          <>
            <NavItem active={currentTab === 'dashboard'} onClick={() => selectTab('dashboard')} icon={<LayoutDashboard size={16} />} label="Overview" />
            <NavItem active={currentTab === 'books'} onClick={() => selectTab('books')} icon={<BookOpen size={16} />} label="My Books" />
            <NavItem active={currentTab === 'tickets'} onClick={() => selectTab('tickets')} icon={<TicketIcon size={16} />} label="Support Queries" count={unresolved} />
          </>
        ) : (
          <>
            <NavItem active={currentTab === 'queue'} onClick={() => selectTab('queue')} icon={<TicketIcon size={16} />} label="Triage Queue" count={unresolved} />
            <NavItem active={currentTab === 'books'} onClick={() => selectTab('books')} icon={<Layers size={16} />} label="Books & Authors" />
            <NavItem active={currentTab === 'kb'} onClick={() => selectTab('kb')} icon={<Database size={16} />} label="Knowledge Base" />
          </>
        )}

        {user.role === 'author' && onOpenSubmitModal && (
          <div className="sidebar-cta">
            <button
              type="button"
              className="sidebar-cta-btn"
              onClick={() => { setMobileOpen(false); onOpenSubmitModal(); }}
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>Raise Query</span>
            </button>
          </div>
        )}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer" data-enter="identity">
        <div
          className={`sidebar-status ${isConnected ? '' : 'offline'}`}
          role="status"
          title={isConnected ? 'Real-time sync active (Server-Sent Events)' : 'Reconnecting...'}
        >
          <span className="status-dot" aria-hidden="true" />
          <span className="sidebar-status-text">{isConnected ? 'Live sync' : 'Reconnecting'}</span>
          <span className="sidebar-status-tag">SSE</span>
        </div>

        <div className="sidebar-user" role="group" aria-label="Account">
          <div className="sidebar-user-avatar" aria-hidden="true">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={user.name}>{user.name}</div>
            <div className="sidebar-user-role">
              {user.role === 'admin' ? 'Operations Admin' : `Author ID: ${user.author_id || user.id}`}
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </motion.aside>
    </>
  );
};
