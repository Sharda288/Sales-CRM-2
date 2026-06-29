import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import StatusBadge from '../components/UI/StatusBadge.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

export default function Requirements() {
  const { records, create } = useDatabase();
  const rows = records('requirements');
  return <div className="page"><Card className="page-hero"><div><h2>Requirements & Sourcing</h2><p>Requirement intake, proposal, PO, sourcing and trainer matching.</p></div><Button onClick={() => create('requirements', { title: 'New Requirement', status: 'Open', pipeline_stage: 'Requirement Gathering', priority: 'Medium' })}>+ Add Requirement</Button></Card><Card><DataTable columns={[{key:'id',label:'Requirement ID'},{key:'title',label:'Req Title'},{key:'company_name',label:'Client'},{key:'service_interest',label:'Service'},{key:'status',label:'Status',render:(r)=><StatusBadge tone="blue">{r.status}</StatusBadge>},{key:'priority',label:'Priority'},{key:'pipeline_stage',label:'Stage'}]} rows={rows} /></Card></div>;
}
