import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sparkles, Shield, User as UserIcon } from 'lucide-react';

export const DemoUserSwitcher: React.FC = () => {
  const { user, switchUser } = useAuth();
  const [accounts, setAccounts] = useState<{ admin: any; authors: any[] }>({ admin: null, authors: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDemoAccounts().then(res => {
      setAccounts(res.data);
    }).catch(console.error);
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

  return (
    <div className="demo-bar">
      <div className="demo-bar-left">
        <Sparkles size={14} className="text-brand" />
        <span>Assignment Evaluation Mode:</span>
        <span style={{ color: '#cbd5e1' }}>Currently acting as:</span>
        <strong style={{ color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {user?.role === 'admin' ? <Shield size={13} color="#f59e0b" /> : <UserIcon size={13} color="#2dd4bf" />}
          {user?.name || 'Guest'} ({user?.role === 'admin' ? 'Operations Admin' : `Author: ${user?.author_id}`})
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>1-Click Switch:</span>
        <select
          className="demo-selector"
          value={user?.email || ''}
          onChange={handleSelect}
          disabled={loading}
        >
          {accounts.admin && (
            <option value={accounts.admin.email}>
              🛡️ {accounts.admin.name} (Admin Portal)
            </option>
          )}
          <optgroup label="Sample Authors (10 Authors Seeded)">
            {accounts.authors.map(a => (
              <option key={a.id} value={a.email}>
                👤 {a.name} ({a.author_id} — {a.books_count} {a.books_count === 1 ? 'book' : 'books'})
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
};
