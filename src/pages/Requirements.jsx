import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import StatusBadge from '../components/UI/StatusBadge.jsx';
import Modal from '../components/UI/Modal.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';

const emptyReq = { title: '', company_name: '', service_interest: 'Corporate Training', priority: 'Medium', proposal_status: 'Pending', po_status: 'Pending', pipeline_stage: 'Requirement Gathering', due_date: '', notes: '', status: 'Open' };

export default function Requirements() {
  const { records, create } = useDatabase();
  const [editing, setEditing] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const didOpenFromQuery = useRef(false);

  useEffect(() => {
    if (didOpenFromQuery.current) return;
    if (searchParams.get('action') === 'add') {
      didOpenFromQuery.current = true;
      setEditing(emptyReq);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = records('requirements');

  const save = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    create('requirements', { ...emptyReq, ...data });
    setEditing(null);
  };

  return (
    <div className="page">
      <Card className="page-hero">
        <div>
          <h2>Requirements & Sourcing</h2>
          <p>Requirement intake, proposal, PO, sourcing and trainer matching.</p>
        </div>
        <Button onClick={() => setEditing(emptyReq)}>+ Add Requirement</Button>
      </Card>
      <Card>
        <DataTable columns={[{key:'id',label:'Requirement ID'},{key:'title',label:'Req Title'},{key:'company_name',label:'Client'},{key:'service_interest',label:'Service'},{key:'status',label:'Status',render:(r)=><StatusBadge tone="blue">{r.status}</StatusBadge>},{key:'priority',label:'Priority'},{key:'pipeline_stage',label:'Stage'}]} rows={rows} />
      </Card>

      {editing && (
        <Modal title="Add Requirement" onClose={() => setEditing(null)}>
          <form className="form-grid" onSubmit={save}>
            <label>Requirement Title<input name="title" required /></label>
            <label>Client / Company<input name="company_name" required /></label>
            <label>Service Type
              <select name="service_interest" defaultValue="Corporate Training">
                <option>Corporate Training</option>
                <option>Video Content Development</option>
                <option>Automation Consulting</option>
              </select>
            </label>
            <label>Priority
              <select name="priority" defaultValue="Medium">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label>Proposal Status
              <select name="proposal_status" defaultValue="Pending">
                <option>Pending</option>
                <option>Sent</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </label>
            <label>PO Status
              <select name="po_status" defaultValue="Pending">
                <option>Pending</option>
                <option>Received</option>
              </select>
            </label>
            <label>Pipeline Stage
              <select name="pipeline_stage" defaultValue="Requirement Gathering">
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
            <label>Due Date / Preferred Date<input name="due_date" type="date" /></label>
            <label className="full">Notes / Description<textarea name="notes" rows="3" /></label>
            <div className="modal-actions"><Button type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
