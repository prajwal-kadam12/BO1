# Email System Sequence Diagrams

This document contains detailed sequence diagrams for the Customer Lifecycle Email System.

---

## 1. Manual Transaction Email Send

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Transaction Email API
    participant Guard as Email Guard Middleware
    participant Service as Email Trigger Service
    participant DB as Database
    participant Queue as Email Queue
    participant Provider as Email Provider (SendGrid/SES)
    
    User->>UI: Click "Send Email" on Invoice
    UI->>UI: Show recipient selector dialog
    User->>UI: Select recipients & confirm
    
    UI->>API: POST /api/transactions/invoice/INV-001/email
    Note right of UI: {recipients: ["cpt_001"],<br/>includePdf: true,<br/>sendMode: "immediate"}
    
    API->>DB: Get transaction by ID
    DB-->>API: Invoice data
    
    API->>DB: Get customer by ID
    DB-->>API: Customer data
    
    API->>Guard: Validate email send
    
    Guard->>DB: Check customer status
    DB-->>Guard: Customer active
    
    Guard->>DB: Check transaction state
    DB-->>Guard: Not draft
    
    Guard->>DB: Get contact persons
    DB-->>Guard: Contact details
    
    Guard->>Guard: Validate recipients belong to customer
    Guard->>Guard: Check unsubscribed status
    Guard->>Guard: Check rate limits
    
    Guard-->>API: ✅ Allowed: true
    
    API->>Service: Create email trigger
    
    Service->>DB: Insert email_triggers record
    DB-->>Service: Trigger ID
    
    Service->>Service: Render email template
    Service->>Service: Generate PDF attachment
    
    Service->>DB: Insert email_audits record (status: queued)
    DB-->>Service: Audit ID
    
    Service->>Queue: Enqueue email task
    Queue-->>Service: Queued
    
    Service-->>API: {triggerId, auditId}
    API-->>UI: {success: true, triggerId, auditId, recipients}
    UI-->>User: ✅ Email queued for sending
    
    Note over Queue: Background Worker
    
    Queue->>Queue: Pick up email task
    Queue->>Provider: Send email with PDF
    Provider-->>Queue: Message ID
    
    Queue->>DB: Update email_audits (status: sent, sentAt)
    
    alt Email Send Failed
        Provider-->>Queue: Error
        Queue->>DB: Update email_audits (status: failed, error_message)
        Queue->>Queue: Schedule retry (exponential backoff)
    end
```

---

## 2. Workflow-Triggered Email (Overdue Reminder)

```mermaid
sequenceDiagram
    participant Cron as Scheduled Job Runner
    participant Engine as Workflow Engine
    participant DB as Database
    participant Guard as Email Guard Middleware
    participant Service as Email Trigger Service
    participant Queue as Email Queue
    
    Note over Cron: Daily at 9:00 AM
    
    Cron->>Engine: Run invoice_overdue_check
    
    Engine->>DB: Get enabled workflows for event
    DB-->>Engine: [Workflow: 7-Day Overdue Reminder]
    
    Engine->>DB: Get all overdue invoices
    DB-->>Engine: [Invoice INV-123, Invoice INV-456]
    
    loop For each invoice
        Engine->>Engine: Evaluate trigger conditions
        Note right of Engine: daysOverdue >= 7<br/>outstanding > 0<br/>status == 'overdue'
        
        alt Conditions match
            Engine->>DB: Check workflow scope
            DB-->>Engine: Organization-wide (all customers)
            
            Engine->>DB: Check customer opt-in (if required)
            DB-->>Engine: Customer opted in
            
            Engine->>Guard: Validate email send
            
            Guard->>DB: Check customer status (active)
            Guard->>DB: Check rate limits
            Guard->>DB: Get primary contact
            
            alt Guard passes
                Guard-->>Engine: ✅ Allowed
                
                Engine->>Service: Create email trigger
                Note right of Engine: {workflowId: "wf_001",<br/>transactionId: "INV-123",<br/>recipients: [primary_contact],<br/>templateId: "tpl_overdue_reminder"}
                
                Service->>DB: Insert email_triggers
                Service->>DB: Insert email_audits (queued)
                Service->>Queue: Enqueue email
                
                Service-->>Engine: Trigger created
                
            else Guard fails
                Guard-->>Engine: ❌ Blocked (reason: rate limit exceeded)
                Engine->>DB: Log workflow execution (skipped)
            end
            
        else Conditions don't match
            Engine->>Engine: Skip invoice
        end
    end
    
    Engine->>DB: Log workflow execution summary
    Engine-->>Cron: Execution complete
```

---

## 3. Unsubscribe Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Email as Email Client
    participant Link as Unsubscribe Link
    participant API as Unsubscribe API
    participant DB as Database
    participant Guard as Email Guard
    
    Customer->>Email: Receive invoice reminder
    Email->>Customer: Display email with footer
    Note right of Email: Footer contains:<br/>"Unsubscribe from reminders"
    
    Customer->>Link: Click unsubscribe link
    Note right of Link: GET /api/unsubscribe<br/>?token=encrypted_contact_id
    
    Link->>API: Process unsubscribe request
    
    API->>API: Decrypt token
    API->>DB: Get contact person by ID
    DB-->>API: Contact details
    
    API->>DB: Update contact_persons
    Note right of API: SET unsubscribed = true,<br/>unsubscribed_at = NOW()
    
    DB-->>API: Updated
    
    API->>DB: Insert email_events
    Note right of API: event_type = 'unsubscribe'<br/>email_address = contact.email
    
    API-->>Link: Unsubscribe confirmed
    Link-->>Customer: Show confirmation page
    Note right of Customer: "You've been unsubscribed<br/>from reminder emails"
    
    Note over Customer,Guard: Future Email Attempt
    
    Guard->>DB: Validate recipients
    DB-->>Guard: Contact unsubscribed = true
    Guard-->>Guard: ❌ Block email send
    Guard-->>API: Error: Recipient has unsubscribed
```

---

## 4. Email Audit Query

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Email Audit API
    participant DB as Database
    
    User->>UI: View invoice details
    UI->>UI: Show "Email History" tab
    
    UI->>API: GET /api/transactions/invoice/INV-001/email/audit
    
    API->>DB: Query email_audits with joins
    Note right of API: JOIN email_triggers<br/>JOIN users (who sent)<br/>JOIN workflows (if auto)
    
    DB-->>API: Audit records with metadata
    
    API->>API: Format response
    Note right of API: Include:<br/>- Who triggered (user/workflow/system)<br/>- Recipients<br/>- Status & timestamps<br/>- Delivery attempts
    
    API-->>UI: {audits: [...], total: 3}
    
    UI->>UI: Render email history table
    Note right of UI: Columns:<br/>- Date/Time<br/>- Recipients<br/>- Triggered By<br/>- Status<br/>- Actions
    
    UI-->>User: Display email history
    
    alt User clicks "View Details"
        User->>UI: Click on audit row
        UI->>API: GET /api/email-audit/:auditId
        API->>DB: Get full audit record
        DB-->>API: Detailed audit data
        API-->>UI: Full audit details
        UI-->>User: Show modal with:<br/>- Full email content<br/>- Attachments<br/>- Provider response<br/>- Error logs (if any)
    end
```

---

## 5. Workflow Enable Flow (Admin)

```mermaid
sequenceDiagram
    actor Admin
    participant UI as Admin UI
    participant API as Workflow API
    participant DB as Database
    
    Admin->>UI: Navigate to Workflow Management
    UI->>API: GET /api/workflows
    API->>DB: Get all workflow rules
    DB-->>API: Workflows (enabled & disabled)
    API-->>UI: Workflow list
    
    UI-->>Admin: Show workflows with status badges
    Note right of UI: "7-Day Overdue Reminder"<br/>Status: Disabled
    
    Admin->>UI: Click "Enable" button
    
    UI->>API: GET /api/workflows/wf_001/impact-preview
    Note right of UI: Show impact before enabling
    
    API->>DB: Count affected customers
    Note right of API: SELECT COUNT(*) FROM invoices<br/>WHERE status = 'overdue'<br/>AND daysOverdue >= 7
    
    DB-->>API: 42 customers affected
    
    API-->>UI: {impactedCustomers: 42, estimatedEmails: 126}
    
    UI->>UI: Show confirmation dialog
    Note right of UI: "This workflow will send emails to<br/>42 customers (126 invoices).<br/>Continue?"
    
    Admin->>UI: Confirm enable
    
    UI->>API: POST /api/workflows/wf_001/enable
    Note right of UI: {confirmation: true}
    
    API->>DB: Update workflow_rules
    Note right of API: SET enabled = true,<br/>enabled_by = admin_id,<br/>enabled_at = NOW()
    
    DB-->>API: Updated
    
    API->>DB: Insert audit log
    Note right of API: Log: "Admin John enabled<br/>workflow 'wf_001'"
    
    API-->>UI: {success: true, enabledAt: timestamp}
    
    UI-->>Admin: ✅ Workflow enabled successfully
    
    Note over Admin,DB: Workflow now active<br/>and will run on next scheduled check
```

---

## 6. Rate Limit Check Flow

```mermaid
sequenceDiagram
    participant API as Email API
    participant Guard as Email Guard
    participant DB as Database
    
    API->>Guard: Validate email send (customer: CUST-001)
    
    Guard->>DB: Get email_rate_limits
    Note right of Guard: WHERE customer_id = 'CUST-001'<br/>AND window_end > NOW()
    
    alt Rate limit record exists
        DB-->>Guard: {totalEmailsSent: 8, maxTotalEmails: 10}
        
        Guard->>Guard: Check total_emails_sent < max_total_emails
        
        alt Within limit (8 < 10)
            Guard-->>API: ✅ Allowed (2 emails remaining)
            
            API->>API: Process email send
            
            API->>DB: Update email_rate_limits
            Note right of API: SET total_emails_sent = 9,<br/>document_emails_sent += 1
            
        else Limit exceeded (10 >= 10)
            Guard-->>API: ❌ Blocked: Rate limit exceeded<br/>(10/10 emails sent in 24h)
            API-->>API: Return error to user
        end
        
    else No rate limit record (first email in window)
        DB-->>Guard: NULL
        
        Guard->>DB: Insert email_rate_limits
        Note right of Guard: New 24h window<br/>window_start = NOW(),<br/>window_end = NOW() + 24h
        
        Guard-->>API: ✅ Allowed (new window)
    end
```

---

## 7. Customer Creation (No Email)

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Customer API
    participant DB as Database
    participant EmailService as Email Service
    
    User->>UI: Fill customer form
    Note right of UI: Name: "Acme Corp"<br/>Email: "billing@acme.com"<br/>GST: "29ABCDE1234F1Z5"
    
    User->>UI: Click "Save Customer"
    
    UI->>API: POST /api/customers
    Note right of UI: {name, email, gst, ...}
    
    API->>DB: Insert into customers
    DB-->>API: Customer created (ID: CUST-001)
    
    Note over API,EmailService: ❌ NO email service called
    Note over EmailService: Email service is NOT invoked<br/>on customer creation
    
    API-->>UI: {success: true, customer: {...}}
    
    UI-->>User: ✅ Customer created successfully
    Note right of UI: No email notification sent<br/>to customer or user
    
    alt User wants to send welcome email (optional)
        User->>UI: Click "Send Welcome Email" (manual action)
        UI->>API: POST /api/customers/CUST-001/send-welcome
        API->>EmailService: Create manual email trigger
        EmailService->>DB: Insert email_triggers (userId set)
        Note right of EmailService: Explicit user action required
    end
```

---

## 8. Transaction Creation (Draft → No Email)

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Invoice API
    participant DB as Database
    
    User->>UI: Create new invoice
    UI->>UI: Show invoice form
    
    User->>UI: Fill invoice details
    Note right of UI: Customer: CUST-001<br/>Items: Product A ($100)<br/>Due Date: 2026-01-15
    
    User->>UI: Click "Save Draft"
    
    UI->>API: POST /api/invoices
    Note right of UI: {customerId, items, dueDate,<br/>isDraft: true,<br/>NO sendEmail flag}
    
    API->>DB: Insert into invoices
    Note right of API: SET is_draft = true,<br/>auto_email_flag = false
    
    DB-->>API: Invoice created (INV-001)
    
    Note over API: ❌ NO email trigger created
    Note over API: Email send requires<br/>explicit user action
    
    API-->>UI: {success: true, invoice: {...}}
    
    UI-->>User: ✅ Draft invoice saved
    Note right of UI: No email sent (as expected)
    
    alt User finalizes invoice
        User->>UI: Click "Finalize & Send"
        
        UI->>UI: Show send confirmation dialog
        Note right of UI: Radio buttons:<br/>○ Send now<br/>○ Send later<br/>○ Do not send (default)
        
        User->>UI: Select "Send now" & confirm
        
        UI->>API: PATCH /api/invoices/INV-001/finalize
        Note right of UI: {isDraft: false, sendAction: "send_now"}
        
        API->>DB: Update invoice (is_draft = false)
        
        API->>API: Check sendAction
        
        alt sendAction == "send_now"
            API->>API: Call Email Service
            Note right of API: Explicit send requested
        else sendAction == "do_not_send"
            API->>API: Skip email
            Note right of API: No email sent
        end
    end
```

---

## Summary

These sequence diagrams illustrate:

1. **Manual Send:** User-triggered email with full guard checks
2. **Workflow Send:** Automated reminder with condition evaluation
3. **Unsubscribe:** Customer opt-out flow with guard enforcement
4. **Audit Query:** Historical email tracking and reporting
5. **Workflow Enable:** Admin activation with impact preview
6. **Rate Limit:** Per-customer email throttling
7. **Customer Create:** No email on internal business actions
8. **Transaction Draft:** No email until explicit user action

All flows enforce the **default-no-email principle** and require explicit user consent or workflow opt-in for customer communications.
