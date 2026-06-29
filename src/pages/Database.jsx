import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/UI/Card.jsx';
import Button from '../components/UI/Button.jsx';
import DataTable from '../components/UI/DataTable.jsx';
import Modal from '../components/UI/Modal.jsx';
import { useDatabase } from '../context/DatabaseContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyContact = { first_name: '', last_name: '', company: '', email: '', phone: '', designation: '', contact_type: 'Normal Contact', remarks: '' };
const emptyTrainer = { first_name: '', last_name: '', email: '', phone: '', city: '', expertise: '', rate: '', availability: 'Available', remarks: '' };

export default function Database() {
  const { records, create } = useDatabase();
  const { currentUser } = useAuth();

  const [editingContact, setEditingContact] = useState(null);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const didOpenFromQuery = useRef(false);

  const canEdit = currentUser?.role === 'manager' || currentUser?.role === 'team_lead';

  useEffect(() => {
    if (didOpenFromQuery.current) return;
    if (searchParams.get('action') === 'add') {
      const section = searchParams.get('section');
      if (section === 'contacts' && canEdit) {
        didOpenFromQuery.current = true;
        setEditingContact(emptyContact);
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      } else if (section === 'trainers' && canEdit) {
        didOpenFromQuery.current = true;
        setEditingTrainer(emptyTrainer);
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, canEdit]);

  const clients = records('clients');
  const contacts = records('contacts');
  const trainers = records('trainers');
  const vendors = records('vendors');

  const saveContact = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    create('contacts', { ...emptyContact, ...data });
    setEditingContact(null);
  };

  const saveTrainer = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    create('trainers', { ...emptyTrainer, ...data });
    setEditingTrainer(null);
  };

  return (
    <div className="page">
      <Card className="page-hero">
        <div>
          <h2>Database Master Lists</h2>
          <p>Global master records for clients, contacts, trainers and vendors.</p>
        </div>
        <Button variant="secondary">Import Data</Button>
      </Card>

      <Card>
        <div className="section-header">
          <h3>Clients</h3>
          <Button onClick={() => create('clients', { company_name: 'New Client' })}>+ Add Client</Button>
        </div>
        <DataTable columns={[{key:'company_name',label:'Company Name'},{key:'industry',label:'Industry'},{key:'city',label:'City'},{key:'country',label:'Country'}]} rows={clients} />
      </Card>

      <Card>
        <div className="section-header">
          <h3>Contacts</h3>
          {canEdit && <Button onClick={() => setEditingContact(emptyContact)}>+ Add Contact</Button>}
        </div>
        <DataTable columns={[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'}]} rows={contacts} />
      </Card>

      <Card>
        <div className="section-header">
          <h3>Trainers</h3>
          {canEdit && <Button onClick={() => setEditingTrainer(emptyTrainer)}>+ Add Trainer</Button>}
        </div>
        <DataTable columns={[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'expertise',label:'Skills'},{key:'city',label:'City'}]} rows={trainers} />
      </Card>

      <Card>
        <h3>Vendors</h3>
        <DataTable columns={[{key:'company_name',label:'Vendor Company'},{key:'services_provided',label:'Service Area'},{key:'city',label:'City'}]} rows={vendors} />
      </Card>

      {editingContact && (
        <Modal title="Add Contact" onClose={() => setEditingContact(null)}>
          <form className="form-grid" onSubmit={saveContact}>
            <label>First Name<input name="first_name" required /></label>
            <label>Last Name<input name="last_name" required /></label>
            <label>Company<input name="company" /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>Phone<input name="phone" required /></label>
            <label>Designation<input name="designation" /></label>
            <label>Contact Type
              <select name="contact_type" defaultValue="Normal Contact">
                <option>Lead Contact</option>
                <option>Client Contact</option>
                <option>Vendor Contact</option>
                <option>Trainer Contact</option>
                <option>Normal Contact</option>
              </select>
            </label>
            <label className="full">Remarks<textarea name="remarks" rows="2" /></label>
            <div className="modal-actions"><Button type="submit">Save</Button></div>
          </form>
        </Modal>
      )}

      {editingTrainer && (
        <Modal title="Add Trainer" onClose={() => setEditingTrainer(null)}>
          <form className="form-grid" onSubmit={saveTrainer}>
            <label>First Name<input name="first_name" required /></label>
            <label>Last Name<input name="last_name" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>Phone<input name="phone" required /></label>
            <label>City<input name="city" /></label>
            <label>Skills / Expertise<input name="expertise" required /></label>
            <label>Commercial Rate<input name="rate" /></label>
            <label>Availability
              <select name="availability" defaultValue="Available">
                <option>Available</option>
                <option>Tentative</option>
                <option>Not Available</option>
                <option>On Hold</option>
              </select>
            </label>
            <label className="full">Remarks<textarea name="remarks" rows="2" /></label>
            <div className="modal-actions"><Button type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
