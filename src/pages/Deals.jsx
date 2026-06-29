import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

export default function Deals() {
  const { records, create } = useDatabase();
  const rows = records('deals');
  return <div className="page"><Card className="page-hero"><div><h2>Deals</h2><p>Confirmed business, delivery, finance, feedback and post-sales.</p></div><Button onClick={() => create('deals', { title: 'New Deal', status: 'active', pipeline_stage: 'Converted', amount: 0 })}>+ Add Deal</Button></Card><Card><DataTable columns={[{key:'id',label:'Deal ID'},{key:'title',label:'Project'},{key:'company_name',label:'Client'},{key:'service_interest',label:'Service'},{key:'amount',label:'Value'},{key:'status',label:'Status'},{key:'payment_status',label:'Payment'},{key:'delivery_status',label:'Delivery'}]} rows={rows} /></Card></div>;
}
