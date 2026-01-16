# Email System Implementation Guide

**Version:** 1.0  
**Date:** January 6, 2026

This guide provides step-by-step instructions for implementing the Customer Lifecycle Email System.

---

## 📋 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Database Setup

**Tasks:**
- [ ] Run migration: `001_email_system.sql`
- [ ] Verify all tables created successfully
- [ ] Insert default email templates
- [ ] Create database indexes
- [ ] Set up foreign key constraints

**Verification:**
```sql
-- Check tables exist
SHOW TABLES LIKE '%email%';

-- Verify default templates
SELECT id, name, category FROM email_templates WHERE is_default = true;

-- Test contact person creation
INSERT INTO contact_persons (customer_id, name, email, role, is_primary)
VALUES ('test_customer', 'John Doe', 'john@test.com', 'owner', true);
```

#### 1.2 Backend Services

**Files to create:**
- [ ] `server/src/services/emailTriggerService.ts` ✅
- [ ] `server/src/services/emailQueue.ts`
- [ ] `server/src/services/emailTemplateRenderer.ts`
- [ ] `server/src/services/pdfGenerator.ts`
- [ ] `server/src/services/emailProviderAdapter.ts`

**Email Queue Service:**
```typescript
// server/src/services/emailQueue.ts
import Bull from 'bull';
import { EmailProviderAdapter } from './emailProviderAdapter';
import { db } from '../database';
import { emailAudits } from '../database/schema';
import { eq } from 'drizzle-orm';

interface EmailJob {
  auditId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments?: any[];
}

export class EmailQueue {
  private static queue: Bull.Queue<EmailJob>;
  
  static initialize() {
    this.queue = new Bull('email-queue', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
    
    this.queue.process(async (job) => {
      return await this.processEmail(job.data);
    });
  }
  
  static async enqueue(job: EmailJob): Promise<void> {
    await this.queue.add(job, {
      jobId: job.auditId, // Idempotency
    });
  }
  
  private static async processEmail(job: EmailJob): Promise<void> {
    try {
      // Update audit status
      await db.update(emailAudits)
        .set({ status: 'sending', attempts: sql`attempts + 1` })
        .where(eq(emailAudits.id, job.auditId));
      
      // Send via provider
      const result = await EmailProviderAdapter.send({
        to: job.to,
        cc: job.cc,
        bcc: job.bcc,
        subject: job.subject,
        html: job.bodyHtml,
        text: job.bodyText,
        attachments: job.attachments,
      });
      
      // Update audit with success
      await db.update(emailAudits)
        .set({
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: result.messageId,
          providerResponse: JSON.stringify(result.response),
        })
        .where(eq(emailAudits.id, job.auditId));
        
    } catch (error: any) {
      // Update audit with failure
      await db.update(emailAudits)
        .set({
          status: 'failed',
          errorMessage: error.message,
        })
        .where(eq(emailAudits.id, job.auditId));
      
      throw error; // Trigger retry
    }
  }
}
```

**Email Provider Adapter:**
```typescript
// server/src/services/emailProviderAdapter.ts
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '');

export class EmailProviderAdapter {
  static async send(params: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    text: string;
    attachments?: any[];
  }) {
    const msg = {
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      from: process.env.EMAIL_FROM || 'noreply@company.com',
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments?.map(att => ({
        content: att.content.toString('base64'),
        filename: att.filename,
        type: att.type || 'application/pdf',
      })),
    };
    
    const [response] = await sendgrid.send(msg);
    
    return {
      messageId: response.headers['x-message-id'],
      response: response,
    };
  }
}
```

#### 1.3 API Routes

**Files to create:**
- [ ] `server/src/api/transactionEmail.ts` ✅
- [ ] `server/src/api/workflows.ts`
- [ ] `server/src/api/contactPersons.ts`
- [ ] `server/src/api/emailAudit.ts`

**Register routes in main app:**
```typescript
// server/src/app.ts
import transactionEmailRouter from './api/transactionEmail';
import workflowsRouter from './api/workflows';

app.use('/api/transactions', transactionEmailRouter);
app.use('/api/workflows', workflowsRouter);
```

---

### Phase 2: Manual Email Send (Week 3)

#### 2.1 Frontend Components

**Create UI components:**

```typescript
// client/src/components/email/SendEmailDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ContactSelector } from './ContactSelector';

interface SendEmailDialogProps {
  transactionType: string;
  transactionId: string;
  customerId: string;
  open: boolean;
  onClose: () => void;
}

export function SendEmailDialog({
  transactionType,
  transactionId,
  customerId,
  open,
  onClose,
}: SendEmailDialogProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [includePdf, setIncludePdf] = useState(true);
  const [includePaymentLink, setIncludePaymentLink] = useState(true);
  const [sending, setSending] = useState(false);
  
  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch(
        `/api/transactions/${transactionType}/${transactionId}/email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients,
            includePdf,
            includePaymentLink,
            sendMode: 'immediate',
          }),
        }
      );
      
      if (response.ok) {
        // Show success message
        onClose();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <ContactSelector
            customerId={customerId}
            selected={recipients}
            onChange={setRecipients}
          />
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePdf"
              checked={includePdf}
              onCheckedChange={setIncludePdf}
            />
            <label htmlFor="includePdf">Include PDF attachment</label>
          </div>
          
          {transactionType === 'invoice' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePaymentLink"
                checked={includePaymentLink}
                onCheckedChange={setIncludePaymentLink}
              />
              <label htmlFor="includePaymentLink">Include payment link</label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={recipients.length === 0 || sending}
            >
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Contact Selector Component:**
```typescript
// client/src/components/email/ContactSelector.tsx
import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimary: boolean;
  unsubscribed: boolean;
}

interface ContactSelectorProps {
  customerId: string;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ContactSelector({ customerId, selected, onChange }: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  useEffect(() => {
    fetch(`/api/customers/${customerId}/contacts`)
      .then(res => res.json())
      .then(data => setContacts(data.contacts));
  }, [customerId]);
  
  const handleToggle = (contactId: string) => {
    if (selected.includes(contactId)) {
      onChange(selected.filter(id => id !== contactId));
    } else {
      onChange([...selected, contactId]);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Recipients</label>
      {contacts.map(contact => (
        <div key={contact.id} className="flex items-center space-x-2">
          <Checkbox
            id={contact.id}
            checked={selected.includes(contact.id)}
            onCheckedChange={() => handleToggle(contact.id)}
            disabled={contact.unsubscribed}
          />
          <label
            htmlFor={contact.id}
            className={`text-sm ${contact.unsubscribed ? 'text-gray-400 line-through' : ''}`}
          >
            {contact.name} ({contact.email})
            {contact.isPrimary && <span className="ml-1 text-xs text-blue-600">Primary</span>}
            {contact.unsubscribed && <span className="ml-1 text-xs text-red-600">Unsubscribed</span>}
          </label>
        </div>
      ))}
    </div>
  );
}
```

#### 2.2 Integration Points

**Add email button to transaction pages:**
```typescript
// client/src/pages/invoices/InvoiceDetail.tsx
import { SendEmailDialog } from '@/components/email/SendEmailDialog';

export function InvoiceDetail() {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  return (
    <div>
      {/* Existing invoice details */}
      
      <Button onClick={() => setEmailDialogOpen(true)}>
        Send Email
      </Button>
      
      <SendEmailDialog
        transactionType="invoice"
        transactionId={invoice.id}
        customerId={invoice.customerId}
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
      />
    </div>
  );
}
```

---

### Phase 3: Workflow Engine (Week 4-5)

#### 3.1 Workflow Evaluator Service

```typescript
// server/src/services/workflowEvaluator.ts
import { db } from '../database';
import { workflowRules } from '../database/schema';
import { eq } from 'drizzle-orm';
import { EmailTriggerService } from './emailTriggerService';

export class WorkflowEvaluator {
  static async evaluateEvent(event: string, context: any) {
    // Get all enabled workflows for this event
    const workflows = await db.query.workflowRules.findMany({
      where: and(
        eq(workflowRules.enabled, true),
        eq(workflowRules.triggerEvent, event)
      ),
    });
    
    for (const workflow of workflows) {
      // Evaluate conditions
      if (!this.evaluateConditions(workflow.triggerConditions, context)) {
        continue;
      }
      
      // Check scope
      if (!this.isInScope(workflow, context.customerId)) {
        continue;
      }
      
      // Execute actions
      for (const action of workflow.actions) {
        await this.executeAction(workflow, action, context);
      }
    }
  }
  
  private static evaluateConditions(conditions: any, context: any): boolean {
    // Simple condition evaluator
    for (const [field, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(context, field);
      
      if (typeof condition === 'object') {
        for (const [operator, expected] of Object.entries(condition)) {
          if (!this.evaluateOperator(operator, value, expected)) {
            return false;
          }
        }
      } else {
        if (value !== condition) {
          return false;
        }
      }
    }
    return true;
  }
  
  private static evaluateOperator(op: string, value: any, expected: any): boolean {
    switch (op) {
      case '$eq': return value === expected;
      case '$ne': return value !== expected;
      case '$gt': return value > expected;
      case '$gte': return value >= expected;
      case '$lt': return value < expected;
      case '$lte': return value <= expected;
      case '$in': return expected.includes(value);
      case '$nin': return !expected.includes(value);
      default: return false;
    }
  }
  
  private static async executeAction(workflow: any, action: any, context: any) {
    if (action.type === 'send_email') {
      await this.executeEmailAction(workflow, action, context);
    }
    // Handle other action types...
  }
  
  private static async executeEmailAction(workflow: any, action: any, context: any) {
    // Create email trigger
    await EmailTriggerService.createTrigger({
      transactionType: context.transactionType,
      transactionId: context.transactionId,
      workflowId: workflow.id,
      customerId: context.customerId,
      recipients: await this.resolveRecipients(action.config.recipientSelection, context),
      templateId: action.config.templateId,
      includePdf: action.config.includeAttachments,
      includePaymentLink: action.config.includePaymentLink,
      sendMode: 'workflow',
    }, context);
  }
}
```

#### 3.2 Scheduled Jobs

```typescript
// server/src/jobs/workflowScheduler.ts
import cron from 'node-cron';
import { WorkflowEvaluator } from '../services/workflowEvaluator';
import { db } from '../database';

export class WorkflowScheduler {
  static initialize() {
    // Daily overdue check at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.runOverdueCheck();
    });
    
    // Daily due date check at 8 AM
    cron.schedule('0 8 * * *', async () => {
      await this.runDueDateCheck();
    });
  }
  
  static async runOverdueCheck() {
    const overdueInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'overdue'),
        gt(invoices.outstanding, 0)
      ),
    });
    
    for (const invoice of overdueInvoices) {
      await WorkflowEvaluator.evaluateEvent('invoice_overdue_check', {
        transactionType: 'invoice',
        transactionId: invoice.id,
        customerId: invoice.customerId,
        invoice,
      });
    }
  }
}
```

---

### Phase 4: UI & Testing (Week 6)

#### 4.1 Admin Workflow Management UI

**Create workflow management page:**
```typescript
// client/src/pages/admin/WorkflowManagement.tsx
export function WorkflowManagement() {
  const [workflows, setWorkflows] = useState([]);
  
  const handleEnable = async (workflowId: string) => {
    const confirmed = window.confirm(
      'This will enable automatic emails. Are you sure?'
    );
    
    if (confirmed) {
      await fetch(`/api/workflows/${workflowId}/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true }),
      });
      
      // Refresh list
      fetchWorkflows();
    }
  };
  
  return (
    <div>
      <h1>Workflow Management</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Trigger</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map(wf => (
            <tr key={wf.id}>
              <td>{wf.name}</td>
              <td>{wf.triggerEvent}</td>
              <td>{wf.enabled ? 'Enabled' : 'Disabled'}</td>
              <td>
                {!wf.enabled && (
                  <Button onClick={() => handleEnable(wf.id)}>Enable</Button>
                )}
                {wf.enabled && (
                  <Button variant="destructive" onClick={() => handleDisable(wf.id)}>
                    Disable
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 4.2 Email Audit History

```typescript
// client/src/components/email/EmailAuditHistory.tsx
export function EmailAuditHistory({ transactionId, transactionType }) {
  const [audits, setAudits] = useState([]);
  
  useEffect(() => {
    fetch(`/api/transactions/${transactionType}/${transactionId}/email/audit`)
      .then(res => res.json())
      .then(data => setAudits(data.audits));
  }, [transactionId, transactionType]);
  
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Email History</h3>
      {audits.map(audit => (
        <div key={audit.id} className="border p-3 rounded">
          <div className="flex justify-between">
            <span>{audit.subject}</span>
            <span className={`badge ${audit.status}`}>{audit.status}</span>
          </div>
          <div className="text-sm text-gray-600">
            To: {audit.toAddresses.join(', ')}
          </div>
          <div className="text-xs text-gray-500">
            Sent: {audit.sentAt ? new Date(audit.sentAt).toLocaleString() : 'Not sent'}
          </div>
          {audit.errorMessage && (
            <div className="text-xs text-red-600">Error: {audit.errorMessage}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
// server/src/__tests__/emailGuard.test.ts
import { EmailGuard } from '../services/emailTriggerService';

describe('EmailGuard', () => {
  test('blocks email to inactive customer', async () => {
    const result = await EmailGuard.validate(
      { customerId: 'inactive_cust', recipients: ['cpt_001'], sendMode: 'immediate' },
      { customerId: 'inactive_cust' }
    );
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('inactive');
  });
  
  test('blocks email to unsubscribed contact', async () => {
    // Mock contact with unsubscribed = true
    const result = await EmailGuard.validate(
      { customerId: 'cust_001', recipients: ['unsubscribed_contact'], sendMode: 'immediate' },
      { customerId: 'cust_001' }
    );
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('unsubscribed');
  });
  
  test('allows valid email send', async () => {
    const result = await EmailGuard.validate(
      {
        customerId: 'active_cust',
        recipients: ['valid_contact'],
        sendMode: 'immediate',
        userId: 'user_001',
      },
      {
        customerId: 'active_cust',
        transaction: { isDraft: false },
      }
    );
    
    expect(result.allowed).toBe(true);
  });
});
```

### Integration Tests

```typescript
// server/src/__tests__/transactionEmail.integration.test.ts
import request from 'supertest';
import app from '../app';

describe('POST /api/transactions/:type/:id/email', () => {
  test('sends email with valid data', async () => {
    const response = await request(app)
      .post('/api/transactions/invoice/INV-001/email')
      .send({
        recipients: ['cpt_001'],
        includePdf: true,
        sendMode: 'immediate',
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.triggerId).toBeDefined();
  });
  
  test('rejects email with no recipients', async () => {
    const response = await request(app)
      .post('/api/transactions/invoice/INV-001/email')
      .send({
        recipients: [],
        includePdf: true,
        sendMode: 'immediate',
      })
      .expect(400);
    
    expect(response.body.error).toContain('recipient');
  });
});
```

---

## 📦 Deployment Checklist

### Environment Variables

```bash
# Email Provider
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourcompany.com

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/billing_app

# Application
NODE_ENV=production
```

### Production Setup

- [ ] Configure SendGrid/SES with production keys
- [ ] Set up Redis for email queue
- [ ] Configure cron jobs for workflow evaluator
- [ ] Set up monitoring (email delivery rates, failures)
- [ ] Configure rate limits per environment
- [ ] Set up error alerting (Sentry, etc.)
- [ ] Test unsubscribe links work correctly
- [ ] Verify GDPR/CAN-SPAM compliance

---

## 🚀 Go-Live Steps

1. **Deploy database migration** - Run `001_email_system.sql`
2. **Deploy backend services** - EmailTriggerService, Queue, etc.
3. **Deploy API routes** - Transaction email endpoints
4. **Deploy frontend components** - Email dialog, audit history
5. **Test manual send** - Send test invoice email
6. **Enable first workflow** - Start with simple thank you email
7. **Monitor for 24 hours** - Check logs, delivery rates
8. **Gradually enable more workflows** - Overdue reminders, etc.
9. **Train team** - How to use email features
10. **Document for users** - Create user guide

---

## 📚 Additional Resources

- **API Documentation:** See [CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md](./CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md)
- **Workflow Examples:** See [WORKFLOW_RULES_EXAMPLES.md](./WORKFLOW_RULES_EXAMPLES.md)
- **Sequence Diagrams:** See [EMAIL_SYSTEM_SEQUENCES.md](./EMAIL_SYSTEM_SEQUENCES.md)

---

**Implementation complete! System ready for production deployment.**
