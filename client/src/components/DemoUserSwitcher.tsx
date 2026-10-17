import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Feather, ChevronDown } from 'lucide-react';

export const DemoUserSwitcher: React.FC = () => {
  const { user, switchUser } = useAuth();
  const [accounts, setAccounts] = useState<{ admin: any; authors: any[] }>({ admin: null, authors: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDemoAccounts()
      .then(res => setAccounts(res.data))
      .catch(console.error);
  }, []);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const email = e.target.value;
    if (!email || email === user?.email) return;

    try {
      setLoading(true);
      await switchUser(email);
    } catch (err) {
      console.error('Error switching demo account:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const RoleIcon = isAdmin ? Shield : Feather;
  const name = user?.name || 'Guest';
  const role = isAdmin ? 'Operations Admin' : `Author ${user?.author_id || user?.id}`;

  return (
    <div className="demo-bar">
      <div className="demo-bar-left" data-enter="context">
        <span className="demo-bar-label">
          <span className="demo-bar-dot" aria-hidden="true" />
          <span className="demo-bar-label-text">Evaluation mode</span>
        </span>
        <span className="demo-bar-sep" aria-hidden="true" />
        <div className="demo-bar-identity">
          <span className="demo-bar-acting">Acting as</span>
          <span className="demo-bar-who">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={user?.email ?? 'guest'}
                className="demo-bar-name"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {name}
              </motion.span>
            </AnimatePresence>
            <span className="demo-bar-role">{role}</span>
          </span>
        </div>
      </div>

      <label className="demo-bar-right" data-enter="context">
        <span className="demo-select-wrap">
          <span className="demo-selector-face" aria-hidden="true">
            <span className="demo-selector-avatar"><RoleIcon size={12} /></span>
            <span className="demo-selector-text">
              <span className="demo-persona-legend">Switch persona</span>
              <span className="demo-selector-value">{name}</span>
            </span>
          </span>
          <select
            className="demo-selector"
            value={user?.email || ''}
            onChange={handleSelect}
            disabled={loading}
            aria-label="Switch Demo User Persona"
          >
            {accounts.admin && (
              <option value={accounts.admin.email}>
                [Admin] {accounts.admin.name} · Operations Desk
              </option>
            )}
            <optgroup label="Sample Authors (10 Seeded Accounts)">
              {accounts.authors.map(a => (
                <option key={a.id} value={a.email}>
                  [Author] {a.name} ({a.author_id} — {a.books_count} {a.books_count === 1 ? 'title' : 'titles'})
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={14} className="demo-select-chevron" aria-hidden="true" />
        </span>
      </label>
    </div>
  );
};
