# Customer Lifecycle Email System - Quick Reference

**Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Complete Design & Implementation Guide

---

## 📑 Document Index

| Document | Purpose | Key Content |
|----------|---------|-------------|
| **[CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md](./CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md)** | Complete technical specification | Email rules, data models, API endpoints, guard middleware, workflow engine |
| **[EMAIL_SYSTEM_SEQUENCES.md](./EMAIL_SYSTEM_SEQUENCES.md)** | Visual flow diagrams | Sequence diagrams for all email flows (manual send, workflow, unsubscribe, etc.) |
| **[WORKFLOW_RULES_EXAMPLES.md](./WORKFLOW_RULES_EXAMPLES.md)** | Workflow configurations | 15+ ready-to-use workflow examples (overdue reminders, thank you emails, etc.) |
| **[EMAIL_SYSTEM_IMPLEMENTATION_GUIDE.md](./EMAIL_SYSTEM_IMPLEMENTATION_GUIDE.md)** | Step-by-step implementation | Phase-by-phase tasks, code samples, testing, deployment |
| **[Database Migration](./server/database/migrations/001_email_system.sql)** | Database schema | Complete SQL migration for email system tables |
| **[Email Trigger Service](./server/src/services/emailTriggerService.ts)** | Backend service implementation | Email guard, trigger creation, rate limiting |
| **[Transaction Email API](./server/src/api/transactionEmail.ts)** | API routes | Manual send, preview, audit endpoints |

---

## 🎯 Core Principles (Non-Negotiable)

1. **Default to NO email** - Customer emails must be explicit
2. **Transaction-driven** - Only real business events trigger emails, not internal updates
3. **Opt-in automation** - Workflows must be explicitly enabled
4. **Full audit trail** - Every email logged with who/what/when/why
5. **Legal compliance** - Unsubscribe links, consent tracking, GDPR/CAN-SPAM

---

## ✅ Email Rules Summary

### ❌ NO Email Sent (Default)

- Customer creation
- Customer update (email/address/GST changes)
- Contact person creation/update
- Transaction creation (draft or finalized)
- Payment recording
- Internal status changes
- System maintenance events

### ✔️ Email Sent (Explicit Only)

#### Manual Triggers:
- User clicks "Send Email" on transaction
- User clicks "Email Receipt" after payment
- Admin manually sends statement

#### Automated (Opt-In Required):
- Invoice overdue reminders (if workflow enabled)
- Pre-due reminders (if workflow enabled)
- Recurring invoice send (if schedule has auto-email flag)
- Payment thank you (if workflow enabled)
- Portal login credentials (if opt-in)

---

## 🛡️ Email Guard Checks (ALL Must Pass)

```
1. Customer Status        → Must be "active"
2. Transaction State      → Must NOT be draft/void/deleted
3. Recipients Valid       → Must belong to customer, not unsubscribed
4. Send Policy           → Requires explicit user action OR enabled workflow
5. Workflow Opt-In       → Customer must opt-in if workflow requires it
6. Rate Limits           → Must not exceed daily/weekly limits
```

**If ANY check fails → Email is BLOCKED**

---

## 📊 Database Tables

```
contact_persons           → Customer contacts with email preferences
email_triggers           → Intent to send email (who/what/when)
email_audits             → Execution record (sent/failed/bounced)
workflow_rules           → Automation rules (disabled by default)
customer_workflow_opt_ins → Per-customer workflow consent
email_rate_limits        → Per-customer send throttling
email_templates          → Reusable email templates
email_events             → Bounce/unsubscribe tracking
```

---

## 🔧 API Endpoints

### Manual Email Send
```http
POST /api/transactions/:type/:id/email
Body: {
  recipients: ["contact_id_1"],
  includePdf: true,
  includePaymentLink: true,
  sendMode: "immediate"
}
```

### Email Preview
```http
GET /api/transactions/:type/:id/email/preview?recipientId=contact_id
```

### Email Audit History
```http
GET /api/transactions/:type/:id/email/audit
```

### Enable Workflow
```http
POST /api/workflows/:id/enable
Body: { confirmation: true }
```

---

## 🧩 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Database migration
- Email queue service
- Email provider adapter
- Basic API routes

### Phase 2: Manual Email Send (Week 3)
- Send email dialog UI
- Contact selector component
- Email preview
- Audit history viewer

### Phase 3: Workflow Engine (Week 4-5)
- Workflow evaluator service
- Scheduled job runner
- Workflow management UI
- Opt-in tracking

### Phase 4: Testing & Polish (Week 6)
- Unit tests (guard, conditions)
- Integration tests (API, workflows)
- Manual QA testing
- Documentation

---

## 🧪 Testing Checklist

### Manual Tests
- [ ] Create customer → No email sent
- [ ] Update customer email → No email sent
- [ ] Create invoice (draft) → No email sent
- [ ] Finalize invoice + Send → Email sent with PDF
- [ ] Enable workflow → Shows confirmation dialog
- [ ] Unsubscribe contact → Blocked from future emails
- [ ] Send 11 emails in day → 11th blocked (rate limit)
- [ ] Click "Send" twice → Only one email sent (idempotency)

### Automated Tests
- [ ] Email guard blocks inactive customers
- [ ] Email guard blocks unsubscribed contacts
- [ ] Email guard allows valid sends
- [ ] Workflow conditions evaluate correctly
- [ ] Rate limits enforced
- [ ] Audit records created for every send
- [ ] Retry logic works on provider failure

---

## 🚨 Common Pitfalls to Avoid

1. **Don't auto-send on customer create** - Always manual opt-in
2. **Don't send emails on internal updates** - Customer email changes don't notify customer
3. **Don't enable workflows by default** - Require explicit admin action
4. **Don't skip guard checks** - Every send must pass validation
5. **Don't forget audit logging** - Legal requirement for compliance
6. **Don't hardcode recipients** - Must be explicitly selected per send
7. **Don't ignore unsubscribe** - Honor opt-out immediately

---

## 📈 Monitoring Metrics

### Key Metrics to Track:
- Email delivery rate (target: >98%)
- Bounce rate (target: <2%)
- Unsubscribe rate (target: <1%)
- Average send latency (target: <30 seconds)
- Failed send rate (target: <1%)
- Rate limit hits (target: <0.5%)

### Alerts to Set Up:
- Delivery rate drops below 95%
- Error rate exceeds 5%
- Queue length exceeds 1000
- Individual customer hits rate limit
- Provider API errors

---

## 🔐 Security & Compliance

### GDPR Requirements:
- [ ] Customer can view all emails sent to them
- [ ] Customer can request email history deletion
- [ ] Unsubscribe honored immediately
- [ ] Consent tracked for all automation

### CAN-SPAM Requirements:
- [ ] Physical address in email footer
- [ ] Clear sender identification
- [ ] One-click unsubscribe link
- [ ] Opt-out honored within 10 business days

### Data Retention:
- Email audit records: 7 years (financial requirement)
- Email body content: 1 year (then archive)
- Metadata: Indefinite
- PDF attachments: Linked to transaction version

---

## 🎓 Training Materials

### For Staff:
1. **How to send invoice emails** - Use "Send Email" button, select recipients
2. **How to enable workflows** - Admin panel, requires confirmation
3. **How to view email history** - Transaction detail → Email History tab
4. **How to handle unsubscribes** - System automatic, no action needed

### For Customers:
1. **How to update email preferences** - Client portal → Settings
2. **How to unsubscribe from reminders** - Click link in email footer
3. **How to view past invoices** - Client portal → Invoices
4. **How to contact support** - If emails not received

---

## 📞 Support & Troubleshooting

### Common Issues:

**"Email not received"**
- Check customer status (must be active)
- Check contact not unsubscribed
- Check spam folder
- Review email audit history for delivery status

**"Too many emails"**
- Check enabled workflows
- Review rate limit settings
- Disable specific workflows if needed

**"Can't send email"**
- Verify recipient selected
- Check transaction not in draft
- Check customer active
- Review error message in UI

---

## 🚀 Go-Live Checklist

**Pre-Launch:**
- [ ] Database migration completed
- [ ] Email provider configured (SendGrid/SES)
- [ ] Redis queue operational
- [ ] All tests passing
- [ ] Monitoring dashboards set up
- [ ] Error alerting configured
- [ ] Team trained on features

**Launch Day:**
- [ ] Deploy backend services
- [ ] Deploy frontend components
- [ ] Test manual send (invoice email)
- [ ] Monitor logs for errors
- [ ] Verify emails delivered

**Post-Launch (Week 1):**
- [ ] Enable simple workflow (payment thank you)
- [ ] Monitor delivery metrics
- [ ] Gather user feedback
- [ ] Enable overdue reminders
- [ ] Document any issues

**Post-Launch (Month 1):**
- [ ] Review all workflows
- [ ] Optimize templates
- [ ] Adjust rate limits if needed
- [ ] Plan for additional automations

---

## 📚 Additional Resources

### Documentation:
- Technical spec: `CUSTOMER_LIFECYCLE_EMAIL_SYSTEM.md`
- Sequences: `EMAIL_SYSTEM_SEQUENCES.md`
- Workflows: `WORKFLOW_RULES_EXAMPLES.md`
- Implementation: `EMAIL_SYSTEM_IMPLEMENTATION_GUIDE.md`

### Code Files:
- Service: `server/src/services/emailTriggerService.ts`
- API: `server/src/api/transactionEmail.ts`
- Migration: `server/database/migrations/001_email_system.sql`

### External:
- SendGrid API Docs: https://docs.sendgrid.com/
- Bull Queue Docs: https://github.com/OptimalBits/bull
- Handlebars Templates: https://handlebarsjs.com/

---

## ✨ Summary

This email system ensures:
- ✅ No accidental customer emails
- ✅ All communications are intentional and audited
- ✅ Clear separation of internal events vs customer transactions
- ✅ Opt-in automation with explicit control
- ✅ Legal compliance (GDPR, CAN-SPAM, CASL)
- ✅ Full audit trail for every email
- ✅ Rate limiting and error handling
- ✅ Professional, non-spammy customer experience

**Principle:** When in doubt, DO NOT send email. Customer communications must be explicit.

---

**Status:** ✅ Complete design ready for implementation  
**Estimated Implementation Time:** 6 weeks  
**Estimated Testing Time:** 2 weeks  
**Total Time to Production:** 8 weeks

---

**Next Steps:**
1. Review and approve design with stakeholders
2. Begin Phase 1: Database migration
3. Set up development environment
4. Start implementation following guide

---

*Document Version: 1.0 | Last Updated: January 6, 2026*
