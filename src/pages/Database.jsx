import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

export default function Database() {
  const { records, create } = useDatabase();
  const clients = records('clients');
  const contacts = records('contacts');
  const trainers = records('trainers');
  const vendors = records('vendors');
  return <div className="page"><Card className="page-hero"><div><h2>Database Master Lists</h2><p>Global master records for clients, contacts, trainers and vendors.</p></div><Button variant="secondary">Import Data</Button></Card><Card><div className="section-header"><h3>Clients</h3><Button onClick={() => create('clients', { company_name: 'New Client' })}>+ Add Client</Button></div><DataTable columns={[{key:'company_name',label:'Company Name'},{key:'industry',label:'Industry'},{key:'city',label:'City'},{key:'country',label:'Country'}]} rows={clients} /></Card><Card><h3>Contacts</h3><DataTable columns={[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'}]} rows={contacts} /></Card><Card><h3>Trainers</h3><DataTable columns={[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'expertise',label:'Skills'},{key:'city',label:'City'}]} rows={trainers} /></Card><Card><h3>Vendors</h3><DataTable columns={[{key:'company_name',label:'Vendor Company'},{key:'services_provided',label:'Service Area'},{key:'city',label:'City'}]} rows={vendors} /></Card></div>;
}
