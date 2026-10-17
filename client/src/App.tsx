import React, { useCallback, useState } from 'react';
import { MotionConfig } from 'framer-motion';
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
import { useShellEntrance } from './animation/useShellEntrance';
import { BookLeafLoader } from './components/BookLeafLoader';
import { NewTicketModal } from './components/NewTicketModal';
import { Book, Ticket } from './types';
import { api } from './services/api';

const MainPortal: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(user?.role === 'admin' ? 'queue' : 'dashboard');
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const shellRef = useShellEntrance();

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
    <div className="app-layout" ref={shellRef}>
      {/* Editorial Sidebar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedAdminTicketId(null);
          setCurrentTab(tab);
        }}
        onOpenSubmitModal={user?.role === 'author' ? () => setIsSubmitModalOpen(true) : undefined}
      />

      {/* Main Content Area */}
      <div className="main-area">
        {/* 1-Click Evaluation Switcher Ribbon */}
        <DemoUserSwitcher />

        {/* Page Content */}
        <main className="main-content">
          <div key={`${user?.role}-${selectedAdminTicketId ?? currentTab}`} className="m-page">
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
          </div>
        </main>

        {/* Editorial Footer */}
        <footer className="app-footer">
          <div className="app-footer-brand">
            <span className="app-footer-name">BookLeaf Publishing</span>
            <span className="app-footer-tagline">Author Support & Operations Command</span>
          </div>
          <ul className="app-footer-facts">
            <li>Delhi & US Distribution Hubs</li>
            <li>80/20 Net Royalty</li>
            <li>Real-Time SSE Sync</li>
          </ul>
        </footer>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [loaderGone, setLoaderGone] = useState(false);
  const onLoaderExit = useCallback(() => setLoaderGone(true), []);

  // The branded loader covers session restore only. It exits the moment `loading` clears; the login
  // entrance waits for its exit signal so the two never overlap.
  return (
    <>
      {!loading && (user ? (
        <RealtimeProvider>
          <MainPortal />
        </RealtimeProvider>
      ) : (
        <LoginPage entranceReady={loaderGone} />
      ))}
      <BookLeafLoader loading={loading} onExitComplete={onLoaderExit} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MotionConfig>
  );
};

export default App;
