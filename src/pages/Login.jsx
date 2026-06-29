import Button from '../components/UI/Button.jsx';
import Card from '../components/UI/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  return <div className="login-screen"><Card className="login-card"><h1>Sales CRM</h1><p>Choose a role to enter the React CRM workspace.</p><div className="login-actions"><Button onClick={() => login('manager')}>Manager</Button><Button variant="secondary" onClick={() => login('team_lead')}>Team Lead</Button><Button variant="secondary" onClick={() => login('employee')}>Employee</Button></div></Card></div>;
}
