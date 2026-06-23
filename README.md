# Sales CRM

A comprehensive, browser-based Sales CRM (Customer Relationship Management) system built with vanilla HTML, CSS, and JavaScript. Designed for sales teams in corporate training, video content development, and automation consulting businesses.

> **Zero dependencies. No backend required.** All data is persisted in the browser's `localStorage`.

---

## ✨ Features

### 🔐 Role-Based Access Control
Three built-in roles with different permission levels:

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Manager** | Full Access | View all records, manage settings, view audit logs, import/export data |
| **Team Lead** | Team Access | View and manage records within their team, view audit logs |
| **Employee** | Own Access | View and manage only their own records |

### 📋 Leads Tracker
- Full lead lifecycle management from prospecting to conversion
- Comprehensive lead details: company info, contact person, designation, email, phone, LinkedIn, website, industry, city/country
- Multi-criteria filtering: status, priority, service interest, source, follow-up date, owner
- Lead statuses: New → Contacted → Interested → Follow-up → Requirement Expected → Converted / Not Interested / Dormant / Lost
- Activity logging per lead (Call, Email, WhatsApp, LinkedIn, Meeting, Note)

### 🔀 Pipeline Kanban Board
- Visual drag-and-drop style pipeline view across sales stages
- Stages: Prospecting → Outreach → Follow-up → Requirement Gathering → Proposal Shared → PO Pending → Sourcing → Converted → Post-Sale / Dormant / Lost
- Filter by owner, stage, service, priority, and overdue follow-ups

### 📝 Requirements & Sourcing
- Capture client requirements with full details: title, description, budget, priority, technology, audience, duration, mode, location
- Proposal and PO tracking (proposal number, date, amount, version, approval status)
- Sourcing candidates with evaluation criteria: skill match, experience, commercial rate, availability, communication, subject expertise
- Link sourcing candidates to trainers and vendors from the database

### 💼 Deals Management
- End-to-end deal lifecycle from creation through delivery to closure
- Trainer/vendor assignment and coordination
- Delivery tracking: session plans, attendance, feedback, completion status
- Financial tracking: client invoicing, trainer payouts, reimbursements
- Post-sale management: upsell/cross-sell opportunities, reference requests, repeat business

### 🗄️ Database (Master Lists)
- **Clients**: Company details, industry, GST, billing/shipping addresses, account tier
- **Contacts**: People linked to client companies with job titles and departments
- **Trainers**: Expertise, daily rates, availability, certifications
- **Vendors**: Services provided, payment terms, point of contact
- **Service Lines**: Configurable service offerings

### 📊 Reports / MIS
- Role-aware analytics and reporting
- Insights based on lead conversion, pipeline health, deal performance

### ⚙️ Settings
- **Data Import**: Bulk import leads, contacts, clients, trainers, and vendors via CSV or JSON files with preview and validation before committing
- **Duplicate Detection**: Automatic duplicate checking based on configurable keys (email, phone, company name, GST, LinkedIn)
- System configuration and management

### 📝 Audit Logs
- Comprehensive activity tracking for compliance and transparency
- Logs all CRUD operations, logins/logouts, stage changes, assignments, and more
- Role-filtered: Managers see all logs, Team Leads see team logs, Employees have no access

---

## 🏗️ Project Structure

```
Sales-CRM-2/
├── index.html              # Main application shell (all views & modals)
├── css/
│   └── style.css           # Complete application styling
├── js/
│   ├── schema.js           # Data model definitions & duplicate keys
│   ├── db.js               # Database engine (localStorage CRUD + RBAC)
│   ├── auth.js             # Authentication & role management
│   ├── app.js              # Main app controller, navigation, dashboard
│   ├── leads.js            # Leads tracker module
│   ├── pipeline.js         # Pipeline Kanban board module
│   ├── requirements.js     # Requirements & sourcing module
│   ├── deals.js            # Deals management module
│   ├── database.js         # Database master lists module
│   ├── reports.js          # Reports / MIS module
│   ├── import.js           # CSV/JSON import engine
│   └── settings.js         # System settings module
├── audits/
│   └── CHANGE_AUDIT.md     # Development changelog
├── sales crm design.md     # Design system specification
├── LICENSE                  # License file
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- Any static file server (optional — you can also open `index.html` directly)

### Option 1: Open Directly
Simply open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
Using Node.js:
```bash
npx serve
```
Then open [http://localhost:3000](http://localhost:3000)

Using Python:
```bash
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000)

### Login
On the login screen, select a role to log in:
- **Manager (Full Access)** — Alice
- **Team Lead (Team Access)** — Bob
- **Employee (Own Access)** — Charlie

> No password required. This is a demo/prototype authentication system.

---

## 📦 Data Model

The CRM manages **17 entity types** defined in `schema.js`:

| Entity | Key Fields | Duplicate Detection |
|--------|-----------|---------------------|
| Users | name, email, role, team | email |
| Teams | name, description, manager | name |
| Service Lines | name, description, status | name |
| Leads | company, contact, email, phone, service interest | email, phone, company, linkedin |
| Contacts | name, email, phone, linkedin, client | email, phone, linkedin |
| Clients | company name, industry, GST, address | company name, GST |
| Requirements | title, budget, priority, proposal/PO details | — |
| Sourcing Candidates | skill match, rate, availability, evaluation | — |
| Trainers | name, expertise, daily rate, certifications | email, phone, linkedin |
| Vendors | company, services, GST, payment terms | company name, email, GST |
| Deals | title, amount, stage, trainer/vendor assignment | — |
| Tasks | title, due date, priority, status | — |
| Activities | type, description, related entity | — |
| Proposals | title, amount, status, sent date | — |
| Purchase Orders | PO number, amount, status | PO number |
| Invoices | invoice number, amount, due date | invoice number |
| Payments | invoice, amount, method, reference | — |

---

## 🔒 Security Model

### Record-Level Access Control
- **Manager**: Can access all records across all teams
- **Team Lead**: Can access records belonging to their team (`team_id` match)
- **Employee**: Can only access records they own (`owner_id`), are assigned to (`assigned_to`), or created (`created_by`)

### Write Protection
- Employees cannot reassign records or change team ownership
- Team Leads can only assign within their own team
- Safe delete checks prevent removing records with linked dependencies (e.g., a client with active contacts, requirements, or deals)

### Audit Trail
Every data mutation is logged with timestamp, user, action type, and details.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5 |
| **Styling** | Vanilla CSS with CSS custom properties (design tokens) |
| **Logic** | Vanilla JavaScript (ES6+ classes) |
| **Storage** | Browser `localStorage` |
| **Server** | None required (static files only) |

---

## 📥 Data Import

The system supports bulk data import via the **Settings** tab (Manager and Team Lead only):

### Supported Formats
- **CSV** — Standard comma-separated values
- **JSON** — Array of objects

### Import Workflow
1. Select the target entity (Leads, Contacts, Clients, Trainers, Vendors)
2. Upload a CSV or JSON file
3. Preview the import results (valid rows, duplicates, errors)
4. Commit the import to persist the data

### Duplicate Detection
The import engine automatically checks for duplicates based on the entity's configured duplicate keys before committing.

---

## ⚠️ Important Notes

- **Data Persistence**: All data is stored in the browser's `localStorage`. Clearing browser data will reset the application.
- **Seed Data**: On first load, the system seeds sample data for demonstration purposes. This only happens once (tracked by `crm_seeded_v3` flag).
- **No Backend**: This is a fully client-side application. There is no server, API, or database — everything runs in the browser.
- **Single Browser**: Data is local to the browser instance. Different browsers or devices will have separate data stores.

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.
