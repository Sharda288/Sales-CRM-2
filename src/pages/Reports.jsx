import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

export default function Reports() {
  const { summary, records } = useDatabase();
  const s = summary();
  const deals = records('deals');
  const revenue = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  return <div className="page"><Card className="page-hero"><div><h2>Reports / MIS</h2><p>Performance, revenue, pending work and management summaries.</p></div><div className="hero-actions"><Button variant="secondary">Share MIS</Button><Button>Export Report</Button></div></Card><Card><div className="toolbar"><select><option>Personal MIS</option><option>Sales Report</option><option>Revenue Report</option><option>Payment Report</option><option>Sourcing Report</option></select><input type="date" /><input type="date" /><select><option>All Owners</option></select><Button variant="secondary">Filter Report</Button></div></Card><div className="kpi-grid">{[['Active leads', s.activeLeads], ['Active requirements', s.activeRequirements], ['Active deals', s.activeDeals], ['Pending payments', s.pendingPayments], ['Revenue', `Rs ${revenue}`]].map(([label, value]) => <Card className="kpi" key={label}><strong>{value}</strong><span>{label}</span></Card>)}</div><Card><DataTable columns={[{key:'title',label:'Deal'},{key:'company_name',label:'Client'},{key:'amount',label:'Value'},{key:'status',label:'Status'}]} rows={deals} /></Card></div>;
}
