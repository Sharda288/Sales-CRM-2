window.crmSchema = {
  users: {
    fields: ['first_name', 'last_name', 'email', 'role', 'team_id', 'status'],
    duplicateKeys: ['email']
  },
  teams: {
    fields: ['name', 'description', 'manager_id'],
    duplicateKeys: ['name']
  },
  leads: {
    fields: [
      'company_name', 'contact_person', 'designation', 'email', 'phone',
      'linkedin', 'website', 'industry', 'company_size', 'city', 'country',
      'service_interest', 'source', 'last_contact_date', 'next_follow_up_date',
      'follow_up_type', 'last_discussion', 'remarks', 'priority'
    ],
    duplicateKeys: ['email', 'phone', 'company_name', 'linkedin']
  },
  contacts: {
    fields: ['first_name', 'last_name', 'email', 'phone', 'linkedin', 'client_id', 'job_title', 'department', 'primary_contact'],
    duplicateKeys: ['email', 'phone', 'linkedin']
  },
  clients: {
    fields: ['company_name', 'industry', 'website', 'gst', 'billing_address', 'shipping_address', 'account_tier', 'annual_revenue'],
    duplicateKeys: ['company_name', 'gst']
  },
  requirements: {
    fields: ['title', 'description', 'client_id', 'budget', 'priority', 'status', 'skills_required', 'target_date'],
    duplicateKeys: []
  },
  sourcingCandidates: {
    fields: ['first_name', 'last_name', 'email', 'phone', 'linkedin', 'skills', 'experience_years', 'current_company', 'expected_salary', 'notice_period'],
    duplicateKeys: ['email', 'phone', 'linkedin']
  },
  trainers: {
    fields: ['first_name', 'last_name', 'email', 'phone', 'linkedin', 'expertise', 'daily_rate', 'availability', 'certifications'],
    duplicateKeys: ['email', 'phone', 'linkedin']
  },
  vendors: {
    fields: ['company_name', 'services_provided', 'email', 'phone', 'gst', 'website', 'point_of_contact', 'payment_terms'],
    duplicateKeys: ['company_name', 'email', 'gst']
  },
  deals: {
    fields: ['title', 'client_id', 'amount', 'close_date', 'stage', 'probability', 'next_step'],
    duplicateKeys: []
  },
  tasks: {
    fields: ['title', 'description', 'due_date', 'priority', 'related_to', 'status'],
    duplicateKeys: []
  },
  activities: {
    fields: ['type', 'description', 'related_entity', 'related_id', 'duration', 'outcome'],
    duplicateKeys: []
  },
  proposals: {
    fields: ['title', 'deal_id', 'amount', 'valid_until', 'status', 'sent_date'],
    duplicateKeys: []
  },
  purchaseOrders: {
    fields: ['po_number', 'vendor_id', 'amount', 'issue_date', 'status', 'delivery_date'],
    duplicateKeys: ['po_number']
  },
  invoices: {
    fields: ['invoice_number', 'client_id', 'amount', 'due_date', 'status', 'issue_date'],
    duplicateKeys: ['invoice_number']
  },
  payments: {
    fields: ['invoice_id', 'amount', 'payment_date', 'method', 'reference_number'],
    duplicateKeys: []
  },
  feedback: {
    fields: ['related_entity', 'related_id', 'rating', 'comments', 'submitted_by'],
    duplicateKeys: []
  },
  documents: {
    fields: ['title', 'file_url', 'file_type', 'related_entity', 'related_id', 'version'],
    duplicateKeys: []
  },
  auditLogs: {
    fields: ['action', 'details', 'user_id', 'user_role', 'ip_address'],
    duplicateKeys: []
  }
};
