import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  BookOpen,
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  LogOut,
  Layers,
  Database,
  Radio
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSubmitModal?: () => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab, onOpenSubmitModal }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useRealtime();

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-logo" onClick={() => onSelectTab(user.role === 'admin' ? 'queue' : 'dashboard')}>
          <div className="brand-icon-box">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="brand-name">BookLeaf</span>
            <span className="brand-tag">
              {user.role === 'admin' ? 'Operations Admin' : 'Author Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          {user.role === 'author' ? (
            <>
              <button
                className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelectTab('dashboard')}
              >
                <LayoutDashboard size={16} />
                Overview
              </button>
              <button
                className={`nav-tab-btn ${currentTab === 'books' ? 'active' : ''}`}
                onClick={() => onSelectTab('books')}
              >
                <BookOpen size={16} />
                My Books
              </button>
              <button
                className={`nav-tab-btn ${currentTab === 'tickets' ? 'active' : ''}`}
                onClick={() => onSelectTab('tickets')}
              >
                <TicketIcon size={16} />
                My Tickets
              </button>
              {onOpenSubmitModal && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenSubmitModal}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <PlusCircle size={15} />
                  Raise Support Ticket
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className={`nav-tab-btn ${currentTab === 'queue' ? 'active' : ''}`}
                onClick={() => onSelectTab('queue')}
              >
                <TicketIcon size={16} />
                Ticket Queue
              </button>
              <button
                className={`nav-tab-btn ${currentTab === 'books' ? 'active' : ''}`}
                onClick={() => onSelectTab('books')}
              >
                <Layers size={16} />
                Author Catalog
              </button>
              <button
                className={`nav-tab-btn ${currentTab === 'kb' ? 'active' : ''}`}
                onClick={() => onSelectTab('kb')}
              >
                <Database size={16} />
                Knowledge Base & AI
              </button>
            </>
          )}
        </nav>

        {/* Right Actions: SSE Live indicator & User profile */}
        <div className="nav-actions">
          <div className="live-indicator" title={isConnected ? 'Real-Time Sync Active (SSE)' : 'Connecting Real-Time Sync...'}>
            <span className={`live-dot ${isConnected ? '' : 'offline'}`} />
            <Radio size={12} style={{ marginLeft: 2 }} />
            <span>{isConnected ? 'Live SSE' : 'Offline'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right', display: 'none', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{user.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user.email}</div>
            </div>
            <button
              className="btn btn-secondary btn-icon"
              onClick={logout}
              title={`Logged in as ${user.name} (${user.email}). Click to Log out`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
