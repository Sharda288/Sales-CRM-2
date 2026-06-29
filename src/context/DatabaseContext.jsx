import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createRecord, getRecords, getSummary, logActivity, logAudit, updateRecord } from '../utils/crmStore.js';
import { useAuth } from './AuthContext.jsx';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
  const { currentUser } = useAuth();
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  const records = useCallback((collection) => getRecords(collection, currentUser), [currentUser, version]);
  const create = useCallback((collection, data) => {
    const record = createRecord(collection, data, currentUser);
    refresh();
    return record;
  }, [currentUser, refresh]);
  const update = useCallback((collection, id, updates) => {
    const record = updateRecord(collection, id, updates, currentUser);
    refresh();
    return record;
  }, [currentUser, refresh]);
  const activity = useCallback((type, description, entity, id) => {
    const record = logActivity(type, description, entity, id, currentUser);
    refresh();
    return record;
  }, [currentUser, refresh]);
  const audit = useCallback((type, details, teamId) => {
    logAudit(type, details, currentUser, teamId);
    refresh();
  }, [currentUser, refresh]);

  const value = useMemo(() => ({ records, create, update, activity, audit, refresh, version, summary: () => getSummary(currentUser) }), [records, create, update, activity, audit, refresh, version, currentUser]);
  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used inside DatabaseProvider');
  return ctx;
}
