import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Navbar } from './components/Navbar';
import { DemoUserSwitcher } from './components/DemoUserSwitcher';
import { LoginPage } from './pages/LoginPage';
import { AuthorDashboard } from './pages/author/AuthorDashboard';
import { MyBooksPage } from './pages/author/MyBooksPage';
import { MyTicketsPage } from './pages/author/MyTicketsPage';
import { TicketQueuePage } from './pages/admin/TicketQueuePage';
import { TicketDetailPage } from './pages/admin/TicketDetailPage';
import { KnowledgeBasePage } from './pages/admin/KnowledgeBasePage';
import { AdminBooksCatalog } from './pages/admin/AdminBooksCatalog';
import { NewTicketModal } from './components/NewTicketModal';
import { Book, Ticket } from './types';
import { api } from './services/api';

const MainPortal: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(user?.role === 'admin' ? 'queue' : 'dashboard');
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);

  React.useEffect(() => {
    if (user?.role === 'author') {
      api.getMyBooks().then(res => setAuthorBooks(res.data)).catch(console.error);
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('queue');
      setSelectedAdminTicketId(null);
    }
  }, [user]);

  const handleTicketCreated = (newTicket: Ticket) => {
    // Switch to tickets tab so the author immediately sees their new ticket
    setCurrentTab('tickets');
  };

  return (
    <div className="app-container">
      {/* 1-Click Evaluation Switcher Ribbon */}
      <DemoUserSwitcher />

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedAdminTicketId(null);
          setCurrentTab(tab);
        }}
        onOpenSubmitModal={user?.role === 'author' ? () => setIsSubmitModalOpen(true) : undefined}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {user?.role === 'author' ? (
          <>
            {currentTab === 'dashboard' && (
              <AuthorDashboard
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              />
            )}
            {currentTab === 'books' && <MyBooksPage />}
            {currentTab === 'tickets' && (
              <MyTicketsPage
                onOpenNewTicketModal={() => setIsSubmitModalOpen(true)}
              />
            )}

            {/* Author Submit Support Query Modal */}
            <NewTicketModal
              books={authorBooks}
              isOpen={isSubmitModalOpen}
              onClose={() => setIsSubmitModalOpen(false)}
              onTicketCreated={handleTicketCreated}
            />
          </>
        ) : (
          <>
            {selectedAdminTicketId ? (
              <TicketDetailPage
                ticketId={selectedAdminTicketId}
                onBack={() => setSelectedAdminTicketId(null)}
              />
            ) : (
              <>
                {currentTab === 'queue' && (
                  <TicketQueuePage
                    onSelectTicket={(ticketId) => setSelectedAdminTicketId(ticketId)}
                  />
                )}
                {currentTab === 'books' && <AdminBooksCatalog />}
                {currentTab === 'kb' && <KnowledgeBasePage />}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748b',
          background: 'rgba(15, 23, 42, 0.4)'
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>BookLeaf Publishing</strong> — Author Support & Communication Portal
          </div>
          <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8' }}>
            <span>In-House Delhi & US Hubs</span>
            <span>•</span>
            <span>80/20 Royalty Split</span>
            <span>•</span>
            <span>Real-time SSE Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: '#94a3b8'
        }}
      >
        Loading BookLeaf Portal...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <RealtimeProvider>
      <MainPortal />
    </RealtimeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
