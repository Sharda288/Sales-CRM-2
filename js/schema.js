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
      'follow_up_type', 'last_discussion', 'remarks', 'priority',
      'pipeline_stage', 'converted_requirement_id'
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
    fields: [
      'title', 'description', 'client_id', 'contact_id', 'lead_id', 'company_name', 'contact_person',
      'budget', 'priority', 'status', 'pipeline_stage', 'converted_deal_id',
      'service_interest', 'technology', 'audience', 'duration', 'mode', 'location',
      'preferred_dates', 'trainer_type', 'lab_needs', 'recording_needs',
      'proposal_status', 'po_status', 'proposal_number', 'proposal_date',
      'proposal_amount', 'proposal_version', 'approval_status', 'po_number',
      'po_amount', 'po_received_date', 'po_attachment', 'commercial_remarks', 'owner_id'
    ],
    duplicateKeys: []
  },
  sourcingCandidates: {
    fields: [
      'requirement_id', 'candidate_name', 'candidate_type', 'source', 'skill_match',
      'experience', 'commercial_rate', 'availability', 'location_fit', 'evaluation_status',
      'profile_shared', 'shared_date', 'client_feedback', 'sla_status', 'remarks',
      'communication', 'subject_expertise', 'past_experience', 'methodology',
      'commercial_fit', 'flexibility', 'past_feedback', 'linked_trainer_id', 'linked_vendor_id'
    ],
    duplicateKeys: []
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
    fields: [
      'title', 'client_id', 'contact_id', 'amount', 'close_date', 'stage', 'probability', 'next_step', 'pipeline_stage', 'service_interest', 'priority', 'next_follow_up_date', 'requirement_id', 'req_id',
      'lead_id', 'project_name', 'service_type', 'owner_id', 'start_date', 'end_date', 'mode', 'location', 'status',
      'selected_trainer_id', 'selected_trainer_name', 'selected_vendor_id', 'selected_vendor_name', 'trainer_rate', 'trainer_confirmation', 'trainer_documents', 'travel_details', 'hotel_booking', 'trainer_reminder',
      'session_plan', 'attendance', 'day1_feedback', 'training_notes', 'booking_details', 'resource_links', 'recording_link', 'completion_status', 'batch_report_status',
      'client_feedback', 'learner_feedback', 'trainer_feedback', 'post_test_status', 'completion_report', 'final_closure_status',
      'client_invoice_no', 'client_invoice_date', 'invoice_amount', 'payment_status', 'payment_followup_date', 'trainer_invoice_status', 'trainer_payout_date', 'trainer_payment_status', 'reimbursement_bills',
      'upsell_opp', 'cross_sell_opp', 'reference_request', 'weekly_touchpoint', 'repeat_business_status'
    ],
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
