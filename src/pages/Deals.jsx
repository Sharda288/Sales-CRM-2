import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import Modal from '../components/UI/Modal.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

const emptyDeal = { title: '', company_name: '', service_interest: 'Corporate Training', amount: '', status: 'Active', payment_status: 'Pending', delivery_status: 'Not Started', pipeline_stage: 'Converted', start_date: '', notes: '' };

export default function Deals() {
  const { records, create } = useDatabase();
  const [editing, setEditing] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const didOpenFromQuery = useRef(false);

  useEffect(() => {
    if (didOpenFromQuery.current) return;
    if (searchParams.get('action') === 'add') {
      didOpenFromQuery.current = true;
      setEditing(emptyDeal);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = records('deals');

  const save = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    create('deals', { ...emptyDeal, ...data });
    setEditing(null);
  };

  return (
    <div className="page">
      <Card className="page-hero">
        <div>
          <h2>Deals</h2>
          <p>Confirmed business, delivery, finance, feedback and post-sales.</p>
        </div>
        <Button onClick={() => setEditing(emptyDeal)}>+ Add Deal</Button>
      </Card>
      <Card>
        <DataTable columns={[{key:'id',label:'Deal ID'},{key:'title',label:'Project'},{key:'company_name',label:'Client'},{key:'service_interest',label:'Service'},{key:'amount',label:'Value'},{key:'status',label:'Status'},{key:'payment_status',label:'Payment'},{key:'delivery_status',label:'Delivery'}]} rows={rows} />
      </Card>

      {editing && (
        <Modal title="Add Deal" onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={save}>
            <label>Deal / Project Title<input name="title" required /></label>
            <label>Client / Company<input name="company_name" required /></label>
            <label>Service Type
              <select name="service_interest" defaultValue="Corporate Training">
                <option>Corporate Training</option>
                <option>Video Content Development</option>
                <option>Automation Consulting</option>
              </select>
            </label>
            <label>Deal Value / Amount<input name="amount" type="number" required /></label>
            <label>Status
              <select name="status" defaultValue="Active">
                <option>Active</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </label>
            <label>Payment Status
              <select name="payment_status" defaultValue="Pending">
                <option>Pending</option>
                <option>Partial</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </label>
            <label>Delivery Status
              <select name="delivery_status" defaultValue="Not Started">
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </label>
            <label>Pipeline Stage
              <select name="pipeline_stage" defaultValue="Converted">
                <option>Prospecting</option>
                <option>Outreach</option>
                <option>Follow-up</option>
                <option>Requirement Gathering</option>
                <option>Proposal Shared</option>
                <option>PO Pending</option>
                <option>Sourcing</option>
                <option>Converted</option>
                <option>Dormant</option>
                <option>Lost</option>
                <option>Post-Sale</option>
              </select>
            </label>
            <label>Start Date<input name="start_date" type="date" /></label>
            <label className="full">Notes<textarea name="notes" rows="3" /></label>
            <div className="modal-actions"><Button type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
