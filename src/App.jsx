import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DatabaseProvider } from './context/DatabaseContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Database from './pages/Database.jsx';
import Deals from './pages/Deals.jsx';
import Leads from './pages/Leads.jsx';
import Login from './pages/Login.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Reports from './pages/Reports.jsx';
import Requirements from './pages/Requirements.jsx';
import Settings from './pages/Settings.jsx';

function ProtectedApp() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Login />;
  return <DatabaseProvider><Routes><Route element={<AppLayout />}><Route path="/" element={<Dashboard />} /><Route path="/leads" element={<Leads />} /><Route path="/pipeline" element={<Pipeline />} /><Route path="/requirements" element={<Requirements />} /><Route path="/deals" element={<Deals />} /><Route path="/database" element={<Database />} /><Route path="/reports" element={<Reports />} /><Route path="/settings" element={<Settings />} /><Route path="*" element={<Navigate to="/" />} /></Route></Routes></DatabaseProvider>;
}

export default function App() {
  return <AuthProvider><ProtectedApp /></AuthProvider>;
}
