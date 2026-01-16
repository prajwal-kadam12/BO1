import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import { EmailTriggerService } from "./src/services/emailTriggerService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const ITEMS_FILE = path.join(DATA_DIR, "items.json");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const SALES_ORDERS_FILE = path.join(DATA_DIR, "salesOrders.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");
const VENDORS_FILE = path.join(DATA_DIR, "vendors.json");
const DELIVERY_CHALLANS_FILE = path.join(DATA_DIR, "deliveryChallans.json");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const DASHBOARD_FILE = path.join(DATA_DIR, "dashboard.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const PURCHASE_ORDERS_FILE = path.join(DATA_DIR, "purchaseOrders.json");
const BILLS_FILE = path.join(DATA_DIR, "bills.json");
const SALESPERSONS_FILE = path.join(DATA_DIR, "salespersons.json");
const CREDIT_NOTES_FILE = path.join(DATA_DIR, "creditNotes.json");
const PAYMENTS_RECEIVED_FILE = path.join(DATA_DIR, "paymentsReceived.json");
const EWAY_BILLS_FILE = path.join(DATA_DIR, "ewayBills.json");
const UNITS_FILE = path.join(DATA_DIR, "units.json");
const TRANSPORTERS_FILE = path.join(DATA_DIR, "transporters.json");
const ORGANIZATIONS_FILE = path.join(DATA_DIR, "organizations.json");
const EMAIL_LOGS_FILE = path.join(DATA_DIR, "emailLogs.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readItems() {
  ensureDataDir();
  if (!fs.existsSync(ITEMS_FILE)) {
    fs.writeFileSync(ITEMS_FILE, JSON.stringify({ items: [] }, null, 2));
    return [];
  }
  const data = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));
  return data.items || [];
}

function writeItems(items: any[]) {
  ensureDataDir();
  fs.writeFileSync(ITEMS_FILE, JSON.stringify({ items }, null, 2));
}

function readOrganizationsData() {
  ensureDataDir();
  if (!fs.existsSync(ORGANIZATIONS_FILE)) {
    const defaultOrg = {
      id: "1",
      name: "Default Organization",
      email: "",
      industry: "Technology",
      location: "India",
      state: "",
      street1: "",
      street2: "",
      city: "",
      postalCode: "",
      currency: "INR",
      language: "English",
      timezone: "IST (Asia/Kolkata)",
      gstRegistered: false,
      gstin: "",
      note: "",
      createdAt: new Date().toISOString()
    };
    const defaultData = { organizations: [defaultOrg], nextOrgId: 2 };
    fs.writeFileSync(ORGANIZATIONS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(ORGANIZATIONS_FILE, "utf-8"));
}

function writeOrganizationsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(ORGANIZATIONS_FILE, JSON.stringify(data, null, 2));
}

function readEmailLogsData() {
  ensureDataDir();
  if (!fs.existsSync(EMAIL_LOGS_FILE)) {
    fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify({ logs: [] }, null, 2));
    return { logs: [] };
  }
  return JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE, "utf-8"));
}

function writeEmailLogsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify(data, null, 2));
}

const DEFAULT_UNITS = [
  { id: "1", name: "box", uqc: "BOX" },
  { id: "2", name: "cm", uqc: "CMS" },
  { id: "3", name: "dz", uqc: "DOZ" },
  { id: "4", name: "ft", uqc: "FTS" },
  { id: "5", name: "g", uqc: "GMS" },
  { id: "6", name: "in", uqc: "INC" },
  { id: "7", name: "kg", uqc: "KGS" },
  { id: "8", name: "km", uqc: "KME" },
  { id: "9", name: "lb", uqc: "LBS" },
  { id: "10", name: "mg", uqc: "MGS" },
  { id: "11", name: "ml", uqc: "MLT" },
  { id: "12", name: "m", uqc: "MTR" },
  { id: "13", name: "pcs", uqc: "PCS" },
  { id: "14", name: "ltr", uqc: "LTR" },
  { id: "15", name: "ton", uqc: "TON" },
  { id: "16", name: "pair", uqc: "PAR" },
  { id: "17", name: "set", uqc: "SET" },
  { id: "18", name: "sqm", uqc: "SQM" },
  { id: "19", name: "sqft", uqc: "SQF" }
];

const DEFAULT_TAX_RATES = [
  { id: "1", name: "GST0", rate: 0, label: "GST0 [0%]" },
  { id: "2", name: "GST5", rate: 5, label: "GST5 [5%]" },
  { id: "3", name: "GST12", rate: 12, label: "GST12 [12%]" },
  { id: "4", name: "GST18", rate: 18, label: "GST18 [18%]" },
  { id: "5", name: "GST28", rate: 28, label: "GST28 [28%]" },
  { id: "6", name: "IGST0", rate: 0, label: "IGST0 [0%]" },
  { id: "7", name: "IGST5", rate: 5, label: "IGST5 [5%]" },
  { id: "8", name: "IGST12", rate: 12, label: "IGST12 [12%]" },
  { id: "9", name: "IGST18", rate: 18, label: "IGST18 [18%]" },
  { id: "10", name: "IGST28", rate: 28, label: "IGST28 [28%]" },
  { id: "11", name: "Exempt", rate: 0, label: "Exempt" }
];

function readUnits() {
  ensureDataDir();
  if (!fs.existsSync(UNITS_FILE)) {
    fs.writeFileSync(UNITS_FILE, JSON.stringify({ units: DEFAULT_UNITS }, null, 2));
    return DEFAULT_UNITS;
  }
  const data = JSON.parse(fs.readFileSync(UNITS_FILE, "utf-8"));
  return data.units || DEFAULT_UNITS;
}

function writeUnits(units: any[]) {
  ensureDataDir();
  fs.writeFileSync(UNITS_FILE, JSON.stringify({ units }, null, 2));
}

function readQuotesData() {
  ensureDataDir();
  if (!fs.existsSync(QUOTES_FILE)) {
    const defaultData = { quotes: [], nextQuoteNumber: 1 };
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(QUOTES_FILE, "utf-8"));
}

function writeQuotesData(data: any) {
  ensureDataDir();
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(data, null, 2));
}

function readCustomersData() {
  ensureDataDir();
  if (!fs.existsSync(CUSTOMERS_FILE)) {
    const defaultData = { customers: [], nextCustomerId: 1 };
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, "utf-8"));
}

function writeCustomersData(data: any) {
  ensureDataDir();
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(data, null, 2));
}

function generateQuoteNumber(num: number): string {
  return `QT-${String(num).padStart(6, '0')}`;
}

function readSalesOrdersData() {
  ensureDataDir();
  if (!fs.existsSync(SALES_ORDERS_FILE)) {
    const defaultData = { salesOrders: [], nextSalesOrderNumber: 1, nextInvoiceNumber: 1 };
    fs.writeFileSync(SALES_ORDERS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(SALES_ORDERS_FILE, "utf-8"));
}

function readSalesOrdersDataFiltered(orgId: string) {
  const data = readSalesOrdersData();
  if (orgId) {
    data.salesOrders = data.salesOrders.filter((so: any) => (so.organizationId || "1") === orgId);
  }
  return data;
}

function writeSalesOrdersData(data: any) {
  ensureDataDir();
  fs.writeFileSync(SALES_ORDERS_FILE, JSON.stringify(data, null, 2));
}

function generateSalesOrderNumber(num: number): string {
  return `SO-${String(num).padStart(5, '0')}`;
}

function generateInvoiceNumber(num: number): string {
  return `INV-${String(num).padStart(5, '0')}`;
}

function readInvoicesData() {
  ensureDataDir();
  if (!fs.existsSync(INVOICES_FILE)) {
    const defaultData = { invoices: [], nextInvoiceNumber: 1 };
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(INVOICES_FILE, "utf-8"));
}

function readInvoicesDataFiltered(orgId: string) {
  const data = readInvoicesData();
  if (orgId) {
    data.invoices = data.invoices.filter((inv: any) => (inv.organizationId || "1") === orgId);
  }
  return data;
}

function readSalespersonsData() {
  ensureDataDir();
  if (!fs.existsSync(SALESPERSONS_FILE)) {
    const defaultData = { salespersons: [], nextSalespersonId: 1 };
    fs.writeFileSync(SALESPERSONS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(SALESPERSONS_FILE, "utf-8"));
}

function writeSalespersonsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(SALESPERSONS_FILE, JSON.stringify(data, null, 2));
}

function readPaymentsReceivedData() {
  ensureDataDir();
  if (!fs.existsSync(PAYMENTS_RECEIVED_FILE)) {
    const defaultData = { paymentsReceived: [], nextPaymentNumber: 1 };
    fs.writeFileSync(PAYMENTS_RECEIVED_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(PAYMENTS_RECEIVED_FILE, "utf-8"));
}

function readPaymentsReceivedDataFiltered(orgId: string) {
  const data = readPaymentsReceivedData();
  if (orgId) {
    data.paymentsReceived = data.paymentsReceived.filter((pr: any) => (pr.organizationId || "1") === orgId);
  }
  return data;
}

function writePaymentsReceivedData(data: any) {
  ensureDataDir();
  fs.writeFileSync(PAYMENTS_RECEIVED_FILE, JSON.stringify(data, null, 2));
}

function generatePaymentNumber(num: number): string {
  return String(num);
}

function readEWayBillsData() {
  ensureDataDir();
  if (!fs.existsSync(EWAY_BILLS_FILE)) {
    const defaultData = { ewayBills: [], nextEWayBillNumber: 1 };
    fs.writeFileSync(EWAY_BILLS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(EWAY_BILLS_FILE, "utf-8"));
}

function writeEWayBillsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(EWAY_BILLS_FILE, JSON.stringify(data, null, 2));
}

function generateEWayBillNumber(num: number): string {
  return `EWB-${String(num).padStart(6, '0')}`;
}

// Helper function for currency formatting on server
function formatCurrencyServer(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const intPart = Math.floor(num);
  const rupees = intPart;

  if (rupees >= 10000000) {
    const crores = Math.floor(rupees / 10000000);
    const remaining = rupees % 10000000;
    let result = convertLessThanThousand(crores) + ' Crore';
    if (remaining > 0) result += ' ' + numberToWords(remaining).replace('Indian Rupee ', '').replace(' Only', '');
    return 'Indian Rupee ' + result + ' Only';
  }
  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000);
    const remaining = rupees % 100000;
    let result = convertLessThanThousand(lakhs) + ' Lakh';
    if (remaining > 0) result += ' ' + numberToWords(remaining).replace('Indian Rupee ', '').replace(' Only', '');
    return 'Indian Rupee ' + result + ' Only';
  }
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000);
    const remaining = rupees % 1000;
    let result = convertLessThanThousand(thousands) + ' Thousand';
    if (remaining > 0) result += ' ' + convertLessThanThousand(remaining);
    return 'Indian Rupee ' + result + ' Only';
  }
  return 'Indian Rupee ' + convertLessThanThousand(rupees) + ' Only';
}

function readCreditNotesData() {
  ensureDataDir();
  if (!fs.existsSync(CREDIT_NOTES_FILE)) {
    const defaultData = { creditNotes: [], nextCreditNoteNumber: 1 };
    fs.writeFileSync(CREDIT_NOTES_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(CREDIT_NOTES_FILE, "utf-8"));
}

function writeCreditNotesData(data: any) {
  ensureDataDir();
  fs.writeFileSync(CREDIT_NOTES_FILE, JSON.stringify(data, null, 2));
}

function generateCreditNoteNumber(num: number): string {
  return `CN-${String(num).padStart(5, '0')}`;
}


function writeInvoicesData(data: any) {
  ensureDataDir();
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(data, null, 2));
}

function readVendorsData() {
  ensureDataDir();
  if (!fs.existsSync(VENDORS_FILE)) {
    const defaultData = { vendors: [], nextVendorId: 1 };
    fs.writeFileSync(VENDORS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(VENDORS_FILE, "utf-8"));
}

function readVendorsDataFiltered(orgId: string) {
  const data = readVendorsData();
  if (orgId) {
    data.vendors = data.vendors.filter((v: any) => (v.organizationId || "1") === orgId);
  }
  return data;
}

function writeVendorsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(VENDORS_FILE, JSON.stringify(data, null, 2));
}

function readDeliveryChallansData() {
  ensureDataDir();
  if (!fs.existsSync(DELIVERY_CHALLANS_FILE)) {
    const defaultData = { deliveryChallans: [], nextChallanNumber: 1 };
    fs.writeFileSync(DELIVERY_CHALLANS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DELIVERY_CHALLANS_FILE, "utf-8"));
}

function writeDeliveryChallansData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DELIVERY_CHALLANS_FILE, JSON.stringify(data, null, 2));
}

function generateChallanNumber(num: number): string {
  return `DC-${String(num).padStart(5, '0')}`;
}

function readExpensesData() {
  ensureDataDir();
  if (!fs.existsSync(EXPENSES_FILE)) {
    const defaultData = {
      expenses: [],
      mileageRecords: [],
      mileageSettings: {
        associateEmployeesToExpenses: false,
        defaultMileageCategory: "Fuel/Mileage Expense",
        defaultUnit: "km",
        mileageRates: []
      },
      nextExpenseId: 1,
      nextMileageId: 1
    };
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(EXPENSES_FILE, "utf-8"));
}

function readExpensesDataFiltered(orgId: string) {
  const data = readExpensesData();
  if (orgId) {
    data.expenses = data.expenses.filter((exp: any) => (exp.organizationId || "1") === orgId);
  }
  return data;
}

function writeExpensesData(data: any) {
  ensureDataDir();
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(data, null, 2));
}

function generateExpenseNumber(num: number): string {
  return `EXP-${String(num).padStart(5, '0')}`;
}

function readDashboardData() {
  ensureDataDir();
  if (!fs.existsSync(DASHBOARD_FILE)) {
    const defaultData = {
      summary: { totalReceivables: { totalUnpaid: 0, current: 0, overdue: 0 }, totalPayables: { totalUnpaid: 0, current: 0, overdue: 0 } },
      cashFlow: [],
      incomeExpense: [],
      topExpenses: []
    };
    fs.writeFileSync(DASHBOARD_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DASHBOARD_FILE, "utf-8"));
}

function writeDashboardData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DASHBOARD_FILE, JSON.stringify(data, null, 2));
}

function readReportsData() {
  ensureDataDir();
  if (!fs.existsSync(REPORTS_FILE)) {
    const defaultData = {
      profitAndLoss: { totalIncome: 0, totalExpenses: 0, netProfit: 0, monthlyData: [] },
      salesByCustomer: [],
      expenseBreakdown: []
    };
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
}

function writeReportsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(data, null, 2));
}

function readPurchaseOrdersData() {
  ensureDataDir();
  if (!fs.existsSync(PURCHASE_ORDERS_FILE)) {
    const defaultData = { purchaseOrders: [], nextPurchaseOrderNumber: 1 };
    fs.writeFileSync(PURCHASE_ORDERS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(PURCHASE_ORDERS_FILE, "utf-8"));
}

function writePurchaseOrdersData(data: any) {
  ensureDataDir();
  fs.writeFileSync(PURCHASE_ORDERS_FILE, JSON.stringify(data, null, 2));
}

function generatePurchaseOrderNumber(num: number): string {
  return `PO-2025-${String(num).padStart(4, '0')}`;
}

function readBillsData() {
  ensureDataDir();
  if (!fs.existsSync(BILLS_FILE)) {
    const defaultData = {
      bills: [],
      nextBillNumber: 1,
      accounts: [
        { id: '1', name: 'Cost of Goods Sold', type: 'expense' },
        { id: '2', name: 'Office Supplies', type: 'expense' },
        { id: '3', name: 'Software', type: 'expense' },
        { id: '4', name: 'Professional Services', type: 'expense' },
        { id: '5', name: 'Utilities', type: 'expense' },
        { id: '6', name: 'Rent', type: 'expense' },
        { id: '7', name: 'Travel Expense', type: 'expense' },
        { id: '8', name: 'Marketing', type: 'expense' }
      ],
      taxes: [
        { id: '1', name: 'IGST18', rate: 18 },
        { id: '2', name: 'CGST9', rate: 9 },
        { id: '3', name: 'SGST9', rate: 9 },
        { id: '4', name: 'GST5', rate: 5 },
        { id: '5', name: 'GST12', rate: 12 },
        { id: '6', name: 'GST28', rate: 28 }
      ]
    };
    fs.writeFileSync(BILLS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(BILLS_FILE, "utf-8"));
}

function readBillsDataFiltered(orgId: string) {
  const data = readBillsData();
  if (orgId) {
    data.bills = data.bills.filter((bill: any) => (bill.organizationId || "1") === orgId);
  }
  return data;
}

function writeBillsData(data: any) {
  ensureDataDir();
  fs.writeFileSync(BILLS_FILE, JSON.stringify(data, null, 2));
}

function generateBillNumber(num: number): string {
  return String(num);
}

// Payments Made Helper Functions (defined early for use in bills record-payment)
const PAYMENTS_MADE_FILE_PATH = path.join(DATA_DIR, "paymentsMade.json");

function readPaymentsMadeDataGlobal() {
  ensureDataDir();
  if (!fs.existsSync(PAYMENTS_MADE_FILE_PATH)) {
    const defaultData = { paymentsMade: [], nextPaymentNumber: 1 };
    fs.writeFileSync(PAYMENTS_MADE_FILE_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(PAYMENTS_MADE_FILE_PATH, "utf-8"));
}

function readPaymentsMadeDataFiltered(orgId: string) {
  const data = readPaymentsMadeDataGlobal();
  if (orgId) {
    data.paymentsMade = data.paymentsMade.filter((pm: any) => (pm.organizationId || "1") === orgId);
  }
  return data;
}

function writePaymentsMadeDataGlobal(data: any) {
  ensureDataDir();
  fs.writeFileSync(PAYMENTS_MADE_FILE_PATH, JSON.stringify(data, null, 2));
}

function generatePaymentMadeNumberGlobal(num: number): string {
  return `PM-${String(num).padStart(5, '0')}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Organizations API
  app.get("/api/organizations", (req: Request, res: Response) => {
    try {
      const data = readOrganizationsData();
      res.json({ success: true, data: data.organizations });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read organizations" });
    }
  });

  app.get("/api/organizations/:id", (req: Request, res: Response) => {
    try {
      const data = readOrganizationsData();
      const org = data.organizations.find((o: any) => o.id === req.params.id);
      if (!org) {
        return res.status(404).json({ success: false, error: "Organization not found" });
      }
      res.json({ success: true, data: org });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read organization" });
    }
  });

  app.post("/api/organizations", (req: Request, res: Response) => {
    try {
      const data = readOrganizationsData();
      const newOrg = {
        id: String(data.nextOrgId),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      data.organizations.push(newOrg);
      data.nextOrgId += 1;
      writeOrganizationsData(data);
      res.status(201).json({ success: true, data: newOrg });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create organization" });
    }
  });

  app.put("/api/organizations/:id", (req: Request, res: Response) => {
    try {
      const data = readOrganizationsData();
      const index = data.organizations.findIndex((o: any) => o.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Organization not found" });
      }
      data.organizations[index] = { ...data.organizations[index], ...req.body };
      writeOrganizationsData(data);
      res.json({ success: true, data: data.organizations[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update organization" });
    }
  });

  // Customers API
  app.get("/api/customers", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      res.json({ success: true, data: data.customers });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read customers" });
    }
  });

  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const newCustomer = {
        id: String(data.nextCustomerId),
        ...req.body,
        communicationPreferences: {
          invoiceReminders: false,
          recurringInvoiceAutoEmail: false,
          paymentReceipts: false,
          portalNotifications: false
        },
        createdAt: new Date().toISOString()
      };

      data.customers.push(newCustomer);
      data.nextCustomerId += 1;
      writeCustomersData(data);

      // Send Notification Email
      try {
        const orgData = readOrganizationsData();
        const orgEmail = orgData.organizations[0]?.email || process.env.SMTP_USER;

        await EmailTriggerService.createTrigger({
          customerId: newCustomer.id,
          recipients: [newCustomer.email],
          customSubject: `Welcome to ${orgData.organizations[0]?.name || 'Our Company'}`,
          customBody: `<p>Hi ${newCustomer.displayName || newCustomer.name},</p><p>Your account has been successfully created.</p>`,
          sendMode: 'immediate'
        }, { customer: newCustomer });
      } catch (emailError) {
        console.error("Failed to send customer creation email:", emailError);
      }

      res.status(201).json({ success: true, data: newCustomer });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Customer not found" });
      }

      data.customers[index] = { ...data.customers[index], ...req.body, updatedAt: new Date().toISOString() };
      writeCustomersData(data);
      const updatedCustomer = data.customers[index];

      // Send Notification Email
      try {
        const orgData = readOrganizationsData();
        await EmailTriggerService.createTrigger({
          customerId: updatedCustomer.id,
          recipients: [updatedCustomer.email],
          customSubject: `Account Updated - ${orgData.organizations[0]?.name || 'Our Company'}`,
          customBody: `<p>Hi ${updatedCustomer.displayName || updatedCustomer.name},</p><p>Your customer profile has been updated.</p>`,
          sendMode: 'immediate'
        }, { customer: updatedCustomer });
      } catch (emailError) {
        console.error("Failed to send customer update email:", emailError);
      }

      res.json({ success: true, data: updatedCustomer });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Customer not found" });
      }

      const deletedCustomer = data.customers[index];
      data.customers.splice(index, 1);
      writeCustomersData(data);

      // Send Notification Email to Org (handled via BCC in service)
      try {
        const orgData = readOrganizationsData();
        const orgEmail = orgData.organizations[0]?.email || process.env.SMTP_USER;
        if (orgEmail) {
          await EmailTriggerService.createTrigger({
            customerId: deletedCustomer.id,
            recipients: [orgEmail],
            customSubject: `Customer Deleted: ${deletedCustomer.displayName || deletedCustomer.name}`,
            customBody: `<p>A customer account has been removed from the system.</p><p>Name: ${deletedCustomer.name}</p><p>Email: ${deletedCustomer.email}</p>`,
            sendMode: 'immediate'
          }, { customer: deletedCustomer });
        }
      } catch (emailError) {
        console.error("Failed to send customer deletion email:", emailError);
      }

      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete customer" });
    }
  });

  // Statement Email API
  app.post("/api/customers/:id/statement/send", async (req: Request, res: Response) => {
    try {
      const customersData = readCustomersData();
      const customer = customersData.customers.find((c: any) => c.id === req.params.id);
      if (!customer) return res.status(404).json({ success: false, error: "Customer not found" });

      const { recipients, cc, bcc, subject, body, pdfData } = req.body;

      // Prepare attachments if PDF data is provided
      const attachments = pdfData ? [{
        filename: `statement_${customer.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        content: Buffer.from(pdfData, 'base64'),
        contentType: 'application/pdf'
      }] : undefined;

      console.log(`[STATEMENT_SEND] Triggering email for customer ${customer.id}. PDF included: ${!!pdfData}. PDF size (base64): ${pdfData ? pdfData.length : 0}`);

      const recipientEmails = recipients && recipients.length > 0 ? recipients : (customer.email ? [customer.email] : []);

      if (recipientEmails.length === 0) {
        throw new Error("Customer has no email address and no recipients were provided");
      }

      // Process body to convert newlines and markdown-style formatting to HTML
      let processedBody = body || `<p>Please find your statement attached.</p>`;
      if (body) {
        processedBody = body
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/\*(.*?)\*/g, '<i>$1</i>')
          .replace(/__(.*?)__/g, '<u>$1</u>')
          .replace(/~~(.*?)~~/g, '<s>$1</s>');
      }

      // Move Buffer conversion inside the background task to keep the request fast
      const triggerParams: any = {
        customerId: customer.id,
        recipients: recipientEmails,
        ccRecipients: cc,
        bccRecipients: bcc,
        customSubject: subject || `Statement from ${readOrganizationsData().organizations[0]?.name}`,
        customBody: processedBody,
        sendMode: 'immediate',
        attachments: pdfData ? [{
          filename: `statement_${customer.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          content: pdfData,
          contentType: 'application/pdf'
        }] : undefined
      };

      EmailTriggerService.createTrigger(triggerParams, { customer }).catch(err => {
        console.error(`[STATEMENT_SEND] Triggering failed for customer ${customer.id}:`, err);
      });
      res.json({ success: true, message: "Statement email processing started in background" });
    } catch (error: any) {
      console.error('Error in /api/customers/:id/statement/send:', error);
      res.status(500).json({ success: false, error: error.message || "Internal server error during email processing" });
    }
  });

  // Email Communication API
  app.get("/api/email/logs", (req: Request, res: Response) => {
    try {
      const { transactionId, customerId } = req.query;
      const data = readEmailLogsData();
      let logs = data.logs || [];

      if (transactionId) {
        logs = logs.filter((log: any) => log.transactionId === transactionId);
      }
      if (customerId) {
        logs = logs.filter((log: any) => log.customerId === customerId);
      }

      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch email logs" });
    }
  });

  app.post("/api/email/send", (req: Request, res: Response) => {
    try {
      const { customerId, transactionId, transactionType, subject, body, recipient, fromEmail, type = "manual" } = req.body;

      // Mock status generation for variety
      const status = Math.random() > 0.1 ? "sent" : "failed";
      const errorMessage = status === "failed" ? "SMTP Server Timeout" : undefined;

      const logData = {
        id: Math.random().toString(36).substr(2, 9),
        customerId,
        transactionId,
        transactionType,
        type, // manual, automated, workflow
        status,
        errorMessage,
        subject,
        body,
        recipient,
        fromEmail,
        sentAt: new Date().toISOString()
      };

      const data = readEmailLogsData();
      data.logs.push(logData);
      writeEmailLogsData(data);

      console.log(`[EMAIL_SENT] [${type.toUpperCase()}] from ${fromEmail} to ${recipient}: ${subject} [Status: ${status}]`);

      res.json({ success: true, message: status === "sent" ? "Email sent and logged" : "Email failed to send", data: logData });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // Automated Reminder Trigger (Mock)
  app.post("/api/invoices/:id/send-reminder", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoice = data.invoices.find((inv: any) => inv.id === req.params.id);
      if (!invoice) return res.status(404).json({ success: false, error: "Invoice not found" });

      const customersData = readCustomersData();
      const customer = customersData.customers.find((c: any) => c.id === invoice.customerId);

      if (!customer || !customer.communicationPreferences?.invoiceReminders) {
        return res.status(400).json({ success: false, error: "Customer has reminders disabled" });
      }

      if (invoice.status === "PAID") {
        return res.status(400).json({ success: false, error: "Invoice is already paid" });
      }

      // Trigger automated email
      console.log(`[AUTOMATED_REMINDER] Sent to ${customer.email} for Invoice ${invoice.invoiceNumber}`);

      res.json({ success: true, message: "Automated reminder triggered" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to trigger reminder" });
    }
  });

  // Units API
  app.get("/api/units", (req: Request, res: Response) => {
    try {
      const units = readUnits();
      res.json({ success: true, data: units });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read units" });
    }
  });

  app.post("/api/units", (req: Request, res: Response) => {
    try {
      const units = readUnits();
      const { name, uqc } = req.body;

      // Validate required fields
      if (!name || !uqc) {
        return res.status(400).json({ success: false, error: "Unit name and UQC are required" });
      }

      // Check for duplicate unit name
      const existingUnit = units.find((u: any) => u.name.toLowerCase() === name.toLowerCase());
      if (existingUnit) {
        return res.status(400).json({ success: false, error: "Unit name already exists" });
      }

      // Check for duplicate UQC
      const existingUqc = units.find((u: any) => u.uqc.toUpperCase() === uqc.toUpperCase());
      if (existingUqc) {
        return res.status(400).json({ success: false, error: "UQC code already exists" });
      }

      const newUnit = {
        id: Date.now().toString(),
        name: name.toLowerCase(),
        uqc: uqc.toUpperCase()
      };
      units.push(newUnit);
      writeUnits(units);
      res.status(201).json({ success: true, data: newUnit });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create unit" });
    }
  });

  app.put("/api/units/:id", (req: Request, res: Response) => {
    try {
      const units = readUnits();
      const index = units.findIndex((u: any) => u.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Unit not found" });
      }

      const { name, uqc } = req.body;

      // Check for duplicate unit name (excluding current unit)
      const existingUnit = units.find((u: any, i: number) =>
        i !== index && u.name.toLowerCase() === name.toLowerCase()
      );
      if (existingUnit) {
        return res.status(400).json({ success: false, error: "Unit name already exists" });
      }

      // Check for duplicate UQC (excluding current unit)
      const existingUqc = units.find((u: any, i: number) =>
        i !== index && u.uqc.toUpperCase() === uqc.toUpperCase()
      );
      if (existingUqc) {
        return res.status(400).json({ success: false, error: "UQC code already exists" });
      }

      units[index] = {
        ...units[index],
        name: name.toLowerCase(),
        uqc: uqc.toUpperCase()
      };
      writeUnits(units);
      res.json({ success: true, data: units[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", (req: Request, res: Response) => {
    try {
      const units = readUnits();
      const index = units.findIndex((u: any) => u.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Unit not found" });
      }
      units.splice(index, 1);
      writeUnits(units);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete unit" });
    }
  });

  // Tax Rates API
  app.get("/api/taxRates", (req: Request, res: Response) => {
    try {
      res.json({ success: true, data: DEFAULT_TAX_RATES });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read tax rates" });
    }
  });

  // Items API
  app.get("/api/items", (req: Request, res: Response) => {
    try {
      let items = readItems();
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const status = req.query.status as string;
      const orgId = req.headers['x-organization-id'] as string;

      // Filter by Organization ID (if provided, otherwise show all/default)
      // For migration: if item has no orgId, treat as belonging to org "1"
      if (orgId) {
        items = items.filter((item: any) => {
          const itemOrgId = item.organizationId || "1";
          return itemOrgId === orgId;
        });
      }

      // Filter by status
      if (status === 'active') {
        items = items.filter((item: any) => item.isActive === true);
      } else if (status === 'inactive') {
        items = items.filter((item: any) => item.isActive === false);
      }
      // 'all' or no status returns all items

      const offset = (page - 1) * limit;
      const paginatedItems = items.slice(offset, offset + limit);

      res.json({
        success: true,
        data: paginatedItems,
        meta: {
          page,
          limit,
          total: items.length,
          totalPages: Math.ceil(items.length / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to read items" });
    }
  });

  app.get("/api/items/:id", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const item = items.find((i: any) => i.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to read item" });
    }
  });

  app.post("/api/items", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const newItem = {
        id: Date.now().toString(),
        ...req.body,
        isActive: true,
        organizationId: req.headers['x-organization-id'] || "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      items.push(newItem);
      writeItems(items);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const index = items.findIndex((i: any) => i.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Item not found" });
      }
      items[index] = {
        ...items[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      writeItems(items);
      res.json(items[index]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const index = items.findIndex((i: any) => i.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Item not found" });
      }
      items.splice(index, 1);
      writeItems(items);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Clone an item
  app.post("/api/items/:id/clone", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const item = items.find((i: any) => i.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      const clonedItem = {
        ...item,
        id: Date.now().toString(),
        name: `${item.name} (Copy)`,
        organizationId: req.headers['x-organization-id'] || item.organizationId || "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      items.push(clonedItem);
      writeItems(items);
      res.status(201).json(clonedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to clone item" });
    }
  });

  // Toggle item active status
  app.patch("/api/items/:id/status", (req: Request, res: Response) => {
    try {
      const items = readItems();
      const index = items.findIndex((i: any) => i.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Item not found" });
      }
      items[index] = {
        ...items[index],
        isActive: req.body.isActive,
        updatedAt: new Date().toISOString()
      };
      writeItems(items);
      res.json(items[index]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item status" });
    }
  });

  // Customers API
  app.get("/api/customers", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const invoicesData = readInvoicesData();
      const orgId = req.headers['x-organization-id'] as string;

      let customers = data.customers;
      if (orgId) {
        customers = customers.filter((c: any) => (c.organizationId || "1") === orgId);
      }

      // Calculate outstanding receivables for each customer
      const customersWithReceivables = customers.map((customer: any) => {
        // Find all invoices for this customer
        const customerInvoices = invoicesData.invoices.filter((inv: any) => inv.customerId === customer.id);

        // Calculate total outstanding receivables (sum of balanceDue from unpaid/partially paid invoices)
        const outstandingReceivables = customerInvoices.reduce((total: number, inv: any) => {
          return total + (inv.balanceDue || 0);
        }, 0);

        return {
          ...customer,
          outstandingReceivables: outstandingReceivables
        };
      });

      res.json({ success: true, data: customersWithReceivables });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const customer = data.customers.find((c: any) => c.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      // Calculate outstanding receivables for this customer
      const invoicesData = readInvoicesData();
      const customerInvoices = invoicesData.invoices.filter((inv: any) => inv.customerId === customer.id);
      const outstandingReceivables = customerInvoices.reduce((total: number, inv: any) => {
        return total + (inv.balanceDue || 0);
      }, 0);

      const customerWithReceivables = {
        ...customer,
        outstandingReceivables: outstandingReceivables
      };

      res.json({ success: true, data: customerWithReceivables });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const newCustomer = {
        id: String(data.nextCustomerId),
        ...req.body,
        status: req.body.status || "active",
        organizationId: req.headers['x-organization-id'] || "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.customers.push(newCustomer);
      data.nextCustomerId += 1;
      writeCustomersData(data);
      res.status(201).json({ success: true, data: newCustomer });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      data.customers[index] = {
        ...data.customers[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      writeCustomersData(data);
      res.json({ success: true, data: data.customers[index] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      data.customers.splice(index, 1);
      writeCustomersData(data);
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete customer" });
    }
  });

  app.post("/api/customers/:id/clone", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const customer = data.customers.find((c: any) => c.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      const clonedCustomer = {
        ...customer,
        id: String(data.nextCustomerId),
        name: `${customer.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.customers.push(clonedCustomer);
      data.nextCustomerId += 1;
      writeCustomersData(data);
      res.status(201).json({ success: true, data: clonedCustomer });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to clone customer" });
    }
  });

  app.patch("/api/customers/:id/status", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      data.customers[index] = {
        ...data.customers[index],
        status: req.body.status,
        updatedAt: new Date().toISOString()
      };
      writeCustomersData(data);
      res.json({ success: true, data: data.customers[index] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update customer status" });
    }
  });

  // Customer Comments API
  app.get("/api/customers/:id/comments", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const customer = data.customers.find((c: any) => c.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      res.json({ success: true, data: customer.comments || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch comments" });
    }
  });

  app.post("/api/customers/:id/comments", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const index = data.customers.findIndex((c: any) => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      const newComment = {
        id: String(Date.now()),
        text: req.body.text,
        author: req.body.author || "Admin User",
        createdAt: new Date().toISOString()
      };
      if (!data.customers[index].comments) {
        data.customers[index].comments = [];
      }
      data.customers[index].comments.push(newComment);
      writeCustomersData(data);
      res.status(201).json({ success: true, data: newComment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add comment" });
    }
  });

  // Customer Transactions API
  app.get("/api/customers/:id/transactions", (req: Request, res: Response) => {
    try {
      const customerId = req.params.id;
      const invoicesData = readInvoicesData();
      const quotesData = readQuotesData();
      const salesOrdersData = readSalesOrdersData();
      const paymentsData = readPaymentsReceivedData();

      const customerInvoices = (invoicesData.invoices || []).filter((inv: any) => inv.customerId === customerId);
      const customerQuotes = (quotesData.quotes || []).filter((q: any) => q.customerId === customerId);
      const customerSalesOrders = (salesOrdersData.salesOrders || []).filter((so: any) => so.customerId === customerId);
      const customerPayments = (paymentsData.paymentsReceived || []).filter((payment: any) => payment.customerId === customerId);

      res.json({
        success: true,
        data: {
          invoices: customerInvoices.map((inv: any) => ({
            id: inv.id,
            type: 'invoice',
            date: inv.date || inv.invoiceDate,
            number: inv.invoiceNumber,
            orderNumber: inv.salesOrderNumber || '',
            amount: inv.total || 0,
            balance: inv.balanceDue || inv.total || 0,
            status: inv.status || 'Draft'
          })),
          customerPayments: customerPayments.map((payment: any) => ({
            id: payment.id,
            type: 'payment',
            date: payment.date,
            number: payment.paymentNumber,
            referenceNumber: payment.referenceNumber || '',
            amount: payment.amount || 0,
            unusedCredits: payment.unusedAmount || 0,
            mode: payment.mode || 'Cash',
            status: payment.status || 'Received'
          })),
          quotes: customerQuotes.map((q: any) => ({
            id: q.id,
            type: 'quote',
            date: q.date,
            number: q.quoteNumber,
            orderNumber: q.referenceNumber || '',
            amount: q.total || 0,
            balance: 0,
            status: q.status || 'Draft'
          })),
          salesOrders: customerSalesOrders.map((so: any) => ({
            id: so.id,
            type: 'salesOrder',
            date: so.date || so.salesOrderDate,
            number: so.salesOrderNumber,
            orderNumber: so.referenceNumber || '',
            amount: so.total || 0,
            balance: 0,
            status: so.status || 'Draft'
          })),
          deliveryChallans: [],
          recurringInvoices: [],
          expenses: [],
          projects: [],
          journals: [],
          bills: [],
          creditNotes: []
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
  });

  // Customer Mails API
  app.get("/api/customers/:id/mails", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const customer = data.customers.find((c: any) => c.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }
      res.json({ success: true, data: customer.mails || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch mails" });
    }
  });

  // Customer Activities API
  app.get("/api/customers/:id/activities", (req: Request, res: Response) => {
    try {
      const data = readCustomersData();
      const customer = data.customers.find((c: any) => c.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      // Generate activities from transactions
      const activities: any[] = [];
      const customerId = req.params.id;

      // Get invoices for this customer
      try {
        const invoicesData = readInvoicesData();
        const customerInvoices = invoicesData.invoices.filter((inv: any) => inv.customerId === customerId);
        customerInvoices.forEach((inv: any) => {
          activities.push({
            id: `activity-inv-${inv.id}`,
            type: 'invoice',
            title: `Invoice ${inv.invoiceNumber} Created`,
            description: `Invoice created for ${formatCurrencyServer(inv.total || 0)}`,
            user: 'System',
            date: inv.createdAt || inv.date,
            time: new Date(inv.createdAt || inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get payments for this customer
      try {
        const paymentsData = readPaymentsReceivedData();
        const customerPayments = paymentsData.paymentsReceived.filter((p: any) => p.customerId === customerId);
        customerPayments.forEach((payment: any) => {
          activities.push({
            id: `activity-pay-${payment.id}`,
            type: 'payment',
            title: `Payment ${payment.paymentNumber} Received`,
            description: `Payment of ${formatCurrencyServer(payment.amount || 0)} received`,
            user: 'System',
            date: payment.createdAt || payment.date,
            time: new Date(payment.createdAt || payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get quotes for this customer
      try {
        const quotesData = readQuotesData();
        const customerQuotes = quotesData.quotes.filter((q: any) => q.customerId === customerId);
        customerQuotes.forEach((quote: any) => {
          activities.push({
            id: `activity-quote-${quote.id}`,
            type: 'quote',
            title: `Quote ${quote.quoteNumber} Created`,
            description: `Quote created for ${formatCurrencyServer(quote.total || 0)}`,
            user: 'System',
            date: quote.createdAt || quote.date,
            time: new Date(quote.createdAt || quote.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get sales orders for this customer
      try {
        const salesOrdersData = readSalesOrdersData();
        const customerSalesOrders = salesOrdersData.salesOrders.filter((so: any) => so.customerId === customerId);
        customerSalesOrders.forEach((so: any) => {
          activities.push({
            id: `activity-so-${so.id}`,
            type: 'sales_order',
            title: `Sales Order ${so.salesOrderNumber} Created`,
            description: `Sales order created for ${formatCurrencyServer(so.total || 0)}`,
            user: 'System',
            date: so.createdAt || so.date,
            time: new Date(so.createdAt || so.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get credit notes for this customer
      try {
        const creditNotesData = readCreditNotesData();
        const customerCreditNotes = creditNotesData.creditNotes.filter((cn: any) => cn.customerId === customerId);
        customerCreditNotes.forEach((cn: any) => {
          activities.push({
            id: `activity-cn-${cn.id}`,
            type: 'credit_note',
            title: `Credit Note ${cn.creditNoteNumber} Created`,
            description: `Credit note for ${formatCurrencyServer(cn.total || 0)}`,
            user: 'System',
            date: cn.createdAt || cn.date,
            time: new Date(cn.createdAt || cn.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Add customer creation activity
      if (customer.createdAt) {
        activities.push({
          id: `activity-customer-created-${customer.id}`,
          type: 'customer',
          title: 'Customer Created',
          description: `Customer ${customer.displayName || customer.name} was created`,
          user: 'System',
          date: customer.createdAt,
          time: new Date(customer.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });
      }

      // Sort by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ success: true, data: activities });
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ success: false, message: "Failed to fetch activities" });
    }
  });

  // Customer Purchased Items API
  app.get("/api/customers/:id/purchased-items", (req: Request, res: Response) => {
    try {
      const invoicesData = readInvoicesData();
      const customerId = req.params.id;

      // Get all invoices for this customer
      const customerInvoices = invoicesData.invoices.filter((invoice: any) => invoice.customerId === customerId);

      // Extract all unique items from these invoices
      const purchasedItems = new Map();

      customerInvoices.forEach((invoice: any) => {
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach((item: any) => {
            const itemKey = item.itemId || item.name; // Use itemId if available, otherwise name
            if (purchasedItems.has(itemKey)) {
              // Update quantity and last purchase date
              const existing = purchasedItems.get(itemKey);
              existing.totalQuantity += item.quantity || 0;
              existing.lastPurchaseDate = invoice.date > existing.lastPurchaseDate ? invoice.date : existing.lastPurchaseDate;
              existing.totalAmount += item.amount || 0;
              existing.purchaseCount += 1;
            } else {
              // Add new item
              purchasedItems.set(itemKey, {
                id: item.itemId || `${item.name}-${Math.random().toString(36).substr(2, 9)}`,
                itemId: item.itemId,
                name: item.name,
                description: item.description || '',
                unit: item.unit || 'pcs',
                lastRate: item.rate || 0,
                totalQuantity: item.quantity || 0,
                lastPurchaseDate: invoice.date,
                totalAmount: item.amount || 0,
                purchaseCount: 1,
                tax: item.tax || 0,
                taxName: item.taxName || 'none'
              });
            }
          });
        }
      });

      // Convert Map to Array and sort by last purchase date (most recent first)
      const itemsArray = Array.from(purchasedItems.values()).sort((a, b) =>
        new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
      );

      res.json({ success: true, data: itemsArray });
    } catch (error) {
      console.error('Error fetching customer purchased items:', error);
      res.status(500).json({ success: false, message: "Failed to fetch customer purchased items" });
    }
  });

  // Quotes API
  app.get("/api/quotes/next-number", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const nextNumber = generateQuoteNumber(data.nextQuoteNumber);
      res.json({ success: true, data: { quoteNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next quote number" });
    }
  });

  app.get("/api/quotes", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quotes = data.quotes.map((quote: any) => ({
        id: quote.id,
        date: quote.date,
        quoteNumber: quote.quoteNumber,
        referenceNumber: quote.referenceNumber,
        customerName: quote.customerName,
        status: quote.status,
        convertedTo: quote.convertedTo,
        total: quote.total
      }));
      res.json({ success: true, data: quotes });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quote = data.quotes.find((q: any) => q.id === req.params.id);
      if (!quote) {
        return res.status(404).json({ success: false, message: "Quote not found" });
      }
      res.json({ success: true, data: quote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quoteNumber = generateQuoteNumber(data.nextQuoteNumber);
      const now = new Date().toISOString();

      const newQuote = {
        id: String(Date.now()),
        quoteNumber,
        referenceNumber: req.body.referenceNumber || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        expiryDate: req.body.expiryDate || '',
        customerId: req.body.customerId || '',
        customerName: req.body.customerName || '',
        billingAddress: req.body.billingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        shippingAddress: req.body.shippingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        salesperson: req.body.salesperson || '',
        projectName: req.body.projectName || '',
        subject: req.body.subject || '',
        placeOfSupply: req.body.placeOfSupply || '',
        pdfTemplate: req.body.pdfTemplate || 'Standard Template',
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        shippingCharges: req.body.shippingCharges || 0,
        tdsType: req.body.tdsType || '',
        tdsAmount: req.body.tdsAmount || 0,
        cgst: req.body.cgst || 0,
        sgst: req.body.sgst || 0,
        igst: req.body.igst || 0,
        adjustment: req.body.adjustment || 0,
        total: req.body.total || 0,
        customerNotes: req.body.customerNotes || 'Looking forward for your business.',
        termsAndConditions: req.body.termsAndConditions || '',
        status: req.body.status || 'DRAFT',
        emailRecipients: req.body.emailRecipients || [],
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Quote created for ₹${req.body.total?.toLocaleString('en-IN') || '0.00'}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      data.quotes.unshift(newQuote);
      data.nextQuoteNumber += 1;
      writeQuotesData(data);

      res.status(201).json({ success: true, data: newQuote });
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ success: false, message: 'Failed to create quote' });
    }
  });

  app.put("/api/quotes/:id", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const now = new Date().toISOString();
      const existingQuote = data.quotes[quoteIndex];

      const updatedQuote = {
        ...existingQuote,
        ...req.body,
        id: existingQuote.id,
        quoteNumber: existingQuote.quoteNumber,
        createdAt: existingQuote.createdAt,
        updatedAt: now,
        activityLogs: [
          ...existingQuote.activityLogs,
          {
            id: String(existingQuote.activityLogs.length + 1),
            timestamp: now,
            action: 'updated',
            description: 'Quote has been updated',
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      data.quotes[quoteIndex] = updatedQuote;
      writeQuotesData(data);

      res.json({ success: true, data: updatedQuote });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update quote' });
    }
  });

  app.patch("/api/quotes/:id/status", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const now = new Date().toISOString();
      const existingQuote = data.quotes[quoteIndex];
      const newStatus = req.body.status;

      let actionDescription = '';
      switch (newStatus) {
        case 'SENT':
          actionDescription = 'Quote has been sent';
          break;
        case 'ACCEPTED':
          actionDescription = 'Quote marked as accepted';
          break;
        case 'DECLINED':
          actionDescription = 'Quote marked as declined';
          break;
        default:
          actionDescription = `Quote status changed to ${newStatus}`;
      }

      existingQuote.status = newStatus;
      existingQuote.updatedAt = now;
      existingQuote.activityLogs.push({
        id: String(existingQuote.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || 'Admin User'
      });

      data.quotes[quoteIndex] = existingQuote;
      writeQuotesData(data);

      res.json({ success: true, data: existingQuote });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update quote status' });
    }
  });

  app.delete("/api/quotes/:id", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      data.quotes.splice(quoteIndex, 1);
      writeQuotesData(data);

      res.json({ success: true, message: 'Quote deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete quote' });
    }
  });

  // Sales Orders API
  app.get("/api/sales-orders/next-number", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const nextNumber = generateSalesOrderNumber(data.nextSalesOrderNumber);
      res.json({ success: true, data: { salesOrderNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next sales order number" });
    }
  });

  app.get("/api/sales-orders", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const salesOrders = data.salesOrders.map((order: any) => ({
        id: order.id,
        date: order.date,
        salesOrderNumber: order.salesOrderNumber,
        referenceNumber: order.referenceNumber,
        customerName: order.customerName,
        orderStatus: order.orderStatus,
        invoiceStatus: order.invoiceStatus,
        paymentStatus: order.paymentStatus,
        total: order.total,
        expectedShipmentDate: order.expectedShipmentDate
      }));
      res.json({ success: true, data: salesOrders });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch sales orders" });
    }
  });

  app.get("/api/sales-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const salesOrder = data.salesOrders.find((o: any) => o.id === req.params.id);
      if (!salesOrder) {
        return res.status(404).json({ success: false, message: "Sales order not found" });
      }
      res.json({ success: true, data: salesOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch sales order" });
    }
  });

  app.post("/api/sales-orders", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const salesOrderNumber = generateSalesOrderNumber(data.nextSalesOrderNumber);
      const now = new Date().toISOString();

      const newSalesOrder = {
        id: String(Date.now()),
        organizationId: req.headers['x-organization-id'] || "1",
        salesOrderNumber,
        referenceNumber: req.body.referenceNumber || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        expectedShipmentDate: req.body.expectedShipmentDate || '',
        customerId: req.body.customerId || '',
        customerName: req.body.customerName || '',
        billingAddress: req.body.billingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        shippingAddress: req.body.shippingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        paymentTerms: req.body.paymentTerms || 'Due on Receipt',
        deliveryMethod: req.body.deliveryMethod || '',
        salesperson: req.body.salesperson || '',
        placeOfSupply: req.body.placeOfSupply || '',
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        shippingCharges: req.body.shippingCharges || 0,
        tdsType: req.body.tdsType || '',
        tdsAmount: req.body.tdsAmount || 0,
        cgst: req.body.cgst || 0,
        sgst: req.body.sgst || 0,
        igst: req.body.igst || 0,
        adjustment: req.body.adjustment || 0,
        total: req.body.total || 0,
        customerNotes: req.body.customerNotes || 'Thanks for your business.',
        termsAndConditions: req.body.termsAndConditions || '',
        orderStatus: req.body.orderStatus || 'DRAFT',
        invoiceStatus: 'Not Invoiced',
        paymentStatus: 'Unpaid',
        shipmentStatus: 'Pending',
        invoices: [],
        pdfTemplate: req.body.pdfTemplate || 'Standard Template',
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Sales Order created for ₹${req.body.total?.toLocaleString('en-IN') || '0.00'}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      data.salesOrders.unshift(newSalesOrder);
      data.nextSalesOrderNumber += 1;
      writeSalesOrdersData(data);

      res.status(201).json({ success: true, data: newSalesOrder });
    } catch (error) {
      console.error('Error creating sales order:', error);
      res.status(500).json({ success: false, message: 'Failed to create sales order' });
    }
  });

  app.put("/api/sales-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const orderIndex = data.salesOrders.findIndex((o: any) => o.id === req.params.id);

      if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sales order not found' });
      }

      const now = new Date().toISOString();
      const existingOrder = data.salesOrders[orderIndex];

      const updatedOrder = {
        ...existingOrder,
        ...req.body,
        id: existingOrder.id,
        salesOrderNumber: existingOrder.salesOrderNumber,
        createdAt: existingOrder.createdAt,
        updatedAt: now,
        activityLogs: [
          ...existingOrder.activityLogs,
          {
            id: String(existingOrder.activityLogs.length + 1),
            timestamp: now,
            action: 'updated',
            description: 'Sales Order has been updated',
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      data.salesOrders[orderIndex] = updatedOrder;
      writeSalesOrdersData(data);

      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update sales order' });
    }
  });

  app.patch("/api/sales-orders/:id/status", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const orderIndex = data.salesOrders.findIndex((o: any) => o.id === req.params.id);

      if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sales order not found' });
      }

      const now = new Date().toISOString();
      const existingOrder = data.salesOrders[orderIndex];
      const newStatus = req.body.orderStatus;

      let actionDescription = `Status changed to ${newStatus}`;

      existingOrder.orderStatus = newStatus;
      existingOrder.updatedAt = now;
      existingOrder.activityLogs.push({
        id: String(existingOrder.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || 'Admin User'
      });

      data.salesOrders[orderIndex] = existingOrder;
      writeSalesOrdersData(data);

      res.json({ success: true, data: existingOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update sales order status' });
    }
  });

  app.post("/api/sales-orders/:id/convert-to-invoice", (req: Request, res: Response) => {
    try {
      const salesOrderData = readSalesOrdersData();
      const invoiceData = readInvoicesData();
      const orderIndex = salesOrderData.salesOrders.findIndex((o: any) => o.id === req.params.id);

      if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sales order not found' });
      }

      const now = new Date().toISOString();
      const existingOrder = salesOrderData.salesOrders[orderIndex];
      const invoiceNumber = generateInvoiceNumber(invoiceData.nextInvoiceNumber);

      // Create full invoice in invoices data file
      const newInvoice = {
        id: invoiceNumber,
        invoiceNumber: invoiceNumber,
        customerId: existingOrder.customerId,
        customerName: existingOrder.customerName,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        billingAddress: existingOrder.billingAddress || {},
        shippingAddress: existingOrder.shippingAddress || {},
        items: existingOrder.items.map((item: any) => ({
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          hsnSac: item.hsnSac,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount,
          discountType: item.discountType,
          tax: item.tax,
          taxName: item.taxName,
          amount: item.amount
        })),
        subTotal: existingOrder.subTotal || 0,
        cgst: existingOrder.cgst || 0,
        sgst: existingOrder.sgst || 0,
        igst: existingOrder.igst || 0,
        shippingCharges: existingOrder.shippingCharges || 0,
        adjustment: existingOrder.adjustment || 0,
        total: existingOrder.total,
        balanceDue: existingOrder.total,
        amountPaid: 0,
        payments: [],
        customerNotes: existingOrder.customerNotes || '',
        termsAndConditions: existingOrder.termsAndConditions || '',
        paymentTerms: existingOrder.paymentTerms || 'Due on Receipt',
        referenceNumber: req.body.referenceNumber || '',
        createdAt: now,
        updatedAt: now
      };

      // Add invoice to invoices file
      invoiceData.invoices.push(newInvoice);
      invoiceData.nextInvoiceNumber += 1;
      writeInvoicesData(invoiceData);

      // Update sales order
      existingOrder.invoices.push({
        id: invoiceNumber,
        invoiceNumber: invoiceNumber,
        date: newInvoice.date,
        dueDate: newInvoice.dueDate,
        status: 'DRAFT',
        amount: existingOrder.total,
        balanceDue: existingOrder.total
      });
      existingOrder.invoiceStatus = 'Invoiced';
      existingOrder.orderStatus = 'CLOSED';
      existingOrder.updatedAt = now;

      existingOrder.items = existingOrder.items.map((item: any) => ({
        ...item,
        invoicedQty: item.quantity,
        invoiceStatus: 'Invoiced'
      }));

      existingOrder.activityLogs.push({
        id: String(existingOrder.activityLogs.length + 1),
        timestamp: now,
        action: 'invoiced',
        description: `Invoice ${invoiceNumber} created`,
        user: req.body.createdBy || 'Admin User'
      });

      salesOrderData.salesOrders[orderIndex] = existingOrder;
      writeSalesOrdersData(salesOrderData);

      res.json({ success: true, data: { salesOrder: existingOrder, invoice: newInvoice } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to convert to invoice' });
    }
  });

  app.delete("/api/sales-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readSalesOrdersData();
      const orderIndex = data.salesOrders.findIndex((o: any) => o.id === req.params.id);

      if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sales order not found' });
      }

      data.salesOrders.splice(orderIndex, 1);
      writeSalesOrdersData(data);

      res.json({ success: true, message: 'Sales order deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete sales order' });
    }
  });

  // Invoices API
  app.get("/api/invoices/next-number", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const nextNumber = generateInvoiceNumber(data.nextInvoiceNumber);
      res.json({ success: true, data: { invoiceNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next invoice number" });
    }
  });

  app.get("/api/invoices", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const { customerId } = req.query;

      let invoices = data.invoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        amount: invoice.total || invoice.amount || 0,
        status: invoice.status || 'DRAFT',
        terms: invoice.paymentTerms || 'Due on Receipt',
        balanceDue: invoice.balanceDue || invoice.total || invoice.amount || 0
      }));

      // Filter by customerId if provided
      if (customerId) {
        invoices = invoices.filter((invoice: any) => invoice.customerId === customerId);
      }

      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoice = data.invoices.find((i: any) => i.id === req.params.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
      }
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoiceNumber = generateInvoiceNumber(data.nextInvoiceNumber);
      const now = new Date().toISOString();

      // Calculate totals from items if not provided or zero
      let calculatedSubTotal = req.body.subTotal || 0;
      let calculatedTotal = req.body.total || 0;
      let calculatedCgst = req.body.cgst || 0;
      let calculatedSgst = req.body.sgst || 0;
      let calculatedIgst = req.body.igst || 0;

      const items = req.body.items || [];

      // If total is 0 or not provided, calculate from items
      if (calculatedTotal === 0 && items.length > 0) {
        let itemsSubTotal = 0;
        let itemsTotalTax = 0;

        items.forEach((item: any) => {
          const qty = item.quantity || item.ordered || 0;
          const rate = item.rate || 0;
          const itemAmount = qty * rate;
          const discountAmount = item.discountType === 'percentage'
            ? (itemAmount * (item.discount || 0)) / 100
            : (item.discount || 0);
          const taxableAmount = itemAmount - discountAmount;
          const taxRate = item.tax || 0;
          const taxAmount = (taxableAmount * taxRate) / 100;

          itemsSubTotal += taxableAmount;
          itemsTotalTax += taxAmount;

          // Update item amount if not set
          if (!item.amount || item.amount === 0) {
            item.amount = taxableAmount + taxAmount;
          }
        });

        calculatedSubTotal = itemsSubTotal;
        calculatedTotal = itemsSubTotal + itemsTotalTax + (req.body.shippingCharges || 0) + (req.body.adjustment || 0);
        calculatedIgst = itemsTotalTax;
      }

      const newInvoice = {
        id: String(Date.now()),
        organizationId: req.headers['x-organization-id'] || "1",
        invoiceNumber,
        referenceNumber: req.body.referenceNumber || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
        customerId: req.body.customerId || '',
        customerName: req.body.customerName || '',
        billingAddress: req.body.billingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        shippingAddress: req.body.shippingAddress || { street: '', city: '', state: '', country: 'India', pincode: '' },
        salesperson: req.body.salesperson || '',
        placeOfSupply: req.body.placeOfSupply || '',
        paymentTerms: req.body.paymentTerms || 'Due on Receipt',
        items: items,
        subTotal: calculatedSubTotal,
        shippingCharges: req.body.shippingCharges || 0,
        cgst: calculatedCgst,
        sgst: calculatedSgst,
        igst: calculatedIgst,
        adjustment: req.body.adjustment || 0,
        total: calculatedTotal,
        amountPaid: req.body.amountPaid || 0,
        balanceDue: calculatedTotal,
        customerNotes: req.body.customerNotes || '',
        termsAndConditions: req.body.termsAndConditions || '',
        status: req.body.status || 'PENDING',
        sourceType: req.body.salesOrderId ? 'sales_order' : (req.body.sourceType || null),
        sourceId: req.body.salesOrderId || req.body.sourceId || null,
        sourceNumber: req.body.sourceNumber || null,
        pdfTemplate: req.body.pdfTemplate || 'Standard Template',
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        payments: [],
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Invoice created for ₹${calculatedTotal?.toLocaleString('en-IN') || '0.00'}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      data.invoices.unshift(newInvoice);
      data.nextInvoiceNumber += 1;
      writeInvoicesData(data);

      // If salesOrderId is provided, update the sales order's invoices array
      if (req.body.salesOrderId) {
        try {
          const salesOrderData = readSalesOrdersData();
          const orderIndex = salesOrderData.salesOrders.findIndex((o: any) => o.id === req.body.salesOrderId);

          if (orderIndex !== -1) {
            const existingOrder = salesOrderData.salesOrders[orderIndex];

            // Add invoice to sales order's invoices array
            if (!existingOrder.invoices) {
              existingOrder.invoices = [];
            }

            existingOrder.invoices.push({
              id: newInvoice.id,
              invoiceNumber: newInvoice.invoiceNumber,
              date: newInvoice.date,
              dueDate: newInvoice.dueDate,
              status: newInvoice.status,
              amount: newInvoice.total,
              balanceDue: newInvoice.balanceDue
            });

            // Update sales order statuses
            existingOrder.invoiceStatus = 'Invoiced';
            existingOrder.updatedAt = now;

            // Update items as invoiced if convertAll is true
            if (req.body.convertAll) {
              existingOrder.items = existingOrder.items.map((item: any) => ({
                ...item,
                invoicedQty: item.quantity || item.ordered,
                invoiceStatus: 'Invoiced'
              }));
              existingOrder.orderStatus = 'CLOSED';
            } else if (req.body.selectedItemIds) {
              // Update only selected items
              existingOrder.items = existingOrder.items.map((item: any) => {
                if (req.body.selectedItemIds.includes(item.id)) {
                  return {
                    ...item,
                    invoicedQty: item.quantity || item.ordered,
                    invoiceStatus: 'Invoiced'
                  };
                }
                return item;
              });

              // Check if all items are invoiced
              const allInvoiced = existingOrder.items.every((item: any) => item.invoiceStatus === 'Invoiced');
              if (allInvoiced) {
                existingOrder.orderStatus = 'CLOSED';
              }
            }

            // Add activity log
            existingOrder.activityLogs = existingOrder.activityLogs || [];
            existingOrder.activityLogs.push({
              id: String(existingOrder.activityLogs.length + 1),
              timestamp: now,
              action: 'invoiced',
              description: `Invoice ${newInvoice.invoiceNumber} created`,
              user: req.body.createdBy || 'Admin User'
            });

            salesOrderData.salesOrders[orderIndex] = existingOrder;
            writeSalesOrdersData(salesOrderData);
          }
        } catch (soError) {
          console.error('Error updating sales order:', soError);
          // Don't fail the invoice creation if sales order update fails
        }
      }

      res.status(201).json({ success: true, data: newInvoice });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
  });

  app.put("/api/invoices/:id", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoiceIndex = data.invoices.findIndex((i: any) => i.id === req.params.id);

      if (invoiceIndex === -1) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const now = new Date().toISOString();
      const existingInvoice = data.invoices[invoiceIndex];

      const updatedInvoice = {
        ...existingInvoice,
        ...req.body,
        id: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        createdAt: existingInvoice.createdAt,
        updatedAt: now,
        activityLogs: [
          ...existingInvoice.activityLogs,
          {
            id: String(existingInvoice.activityLogs.length + 1),
            timestamp: now,
            action: 'updated',
            description: 'Invoice has been updated',
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      // Preserve payments and recalculate balance due correctly
      updatedInvoice.amountPaid = existingInvoice.amountPaid || 0;
      updatedInvoice.payments = existingInvoice.payments || [];
      updatedInvoice.balanceDue = Math.max(0, (updatedInvoice.total || 0) - updatedInvoice.amountPaid);

      // Update status based on balance due
      if (updatedInvoice.balanceDue <= 0) {
        updatedInvoice.status = 'PAID';
      } else if (updatedInvoice.amountPaid > 0) {
        updatedInvoice.status = 'PARTIALLY_PAID';
      }

      data.invoices[invoiceIndex] = updatedInvoice;
      writeInvoicesData(data);

      res.json({ success: true, data: updatedInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update invoice' });
    }
  });

  app.patch("/api/invoices/:id/status", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoiceIndex = data.invoices.findIndex((i: any) => i.id === req.params.id);

      if (invoiceIndex === -1) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const now = new Date().toISOString();
      const existingInvoice = data.invoices[invoiceIndex];
      const newStatus = req.body.status;

      let actionDescription = `Status changed to ${newStatus}`;
      if (newStatus === 'SENT') actionDescription = 'Invoice has been sent';
      if (newStatus === 'PAID') actionDescription = 'Invoice marked as paid';

      existingInvoice.status = newStatus;
      existingInvoice.updatedAt = now;
      existingInvoice.activityLogs.push({
        id: String(existingInvoice.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || 'Admin User'
      });

      data.invoices[invoiceIndex] = existingInvoice;
      writeInvoicesData(data);

      res.json({ success: true, data: existingInvoice });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update invoice status' });
    }
  });

  app.post("/api/invoices/:id/record-payment", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoiceIndex = data.invoices.findIndex((i: any) => i.id === req.params.id);

      if (invoiceIndex === -1) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const now = new Date().toISOString();
      const existingInvoice = data.invoices[invoiceIndex];
      const paymentAmount = req.body.amount || 0;
      const paymentDate = req.body.date || new Date().toISOString();

      const payment = {
        id: String(Date.now()),
        date: paymentDate,
        amount: paymentAmount,
        paymentMode: req.body.paymentMode || 'Cash',
        reference: req.body.reference || '',
        notes: req.body.notes || ''
      };

      existingInvoice.payments.push(payment);
      existingInvoice.amountPaid = (existingInvoice.amountPaid || 0) + paymentAmount;
      existingInvoice.balanceDue = existingInvoice.total - existingInvoice.amountPaid;

      if (existingInvoice.balanceDue <= 0) {
        existingInvoice.status = 'PAID';
        existingInvoice.balanceDue = 0;
      } else {
        existingInvoice.status = 'PARTIALLY_PAID';
      }

      existingInvoice.updatedAt = now;
      existingInvoice.activityLogs.push({
        id: String(existingInvoice.activityLogs.length + 1),
        timestamp: now,
        action: 'payment_recorded',
        description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded`,
        user: req.body.recordedBy || 'Admin User'
      });

      data.invoices[invoiceIndex] = existingInvoice;
      writeInvoicesData(data);

      // Also create a record in Payments Received
      const paymentsData = readPaymentsReceivedData();
      const paymentNumber = generatePaymentNumber(paymentsData.nextPaymentNumber);

      const newPaymentReceived = {
        id: `pr-${Date.now()}`,
        paymentNumber,
        date: paymentDate.split('T')[0],
        referenceNumber: req.body.reference || '',
        customerId: existingInvoice.customerId || '',
        customerName: existingInvoice.customerName || '',
        customerEmail: existingInvoice.customerEmail || '',
        invoices: [{
          invoiceId: existingInvoice.id,
          invoiceNumber: existingInvoice.invoiceNumber,
          invoiceDate: existingInvoice.date,
          invoiceAmount: existingInvoice.total,
          amountDue: existingInvoice.balanceDue,
          paymentAmount: paymentAmount
        }],
        mode: req.body.paymentMode || 'Cash',
        depositTo: 'Petty Cash',
        amount: paymentAmount,
        unusedAmount: 0,
        bankCharges: 0,
        tax: '',
        taxAmount: 0,
        notes: req.body.notes || `Payment for ${existingInvoice.invoiceNumber}`,
        attachments: [],
        sendThankYou: false,
        status: 'PAID',
        paymentType: 'invoice_payment',
        placeOfSupply: existingInvoice.placeOfSupply || '',
        descriptionOfSupply: '',
        amountInWords: numberToWords(paymentAmount),
        journalEntries: [],
        createdAt: now
      };

      paymentsData.paymentsReceived.push(newPaymentReceived);
      paymentsData.nextPaymentNumber++;
      writePaymentsReceivedData(paymentsData);

      res.json({ success: true, data: existingInvoice, paymentReceived: newPaymentReceived });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
  });

  app.delete("/api/invoices/:id", (req: Request, res: Response) => {
    try {
      const data = readInvoicesData();
      const invoiceIndex = data.invoices.findIndex((i: any) => i.id === req.params.id);

      if (invoiceIndex === -1) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      data.invoices.splice(invoiceIndex, 1);
      writeInvoicesData(data);

      res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete invoice' });
    }
  });

  // Quote to Invoice/Sales Order conversion
  app.post("/api/quotes/:id/convert-to-invoice", (req: Request, res: Response) => {
    try {
      const quotesData = readQuotesData();
      const quoteIndex = quotesData.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const quote = quotesData.quotes[quoteIndex];
      const invoicesData = readInvoicesData();
      const now = new Date().toISOString();
      const invoiceNumber = generateInvoiceNumber(invoicesData.nextInvoiceNumber);

      const newInvoice = {
        id: String(Date.now()),
        invoiceNumber,
        referenceNumber: quote.referenceNumber || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerId: quote.customerId,
        customerName: quote.customerName,
        billingAddress: quote.billingAddress,
        shippingAddress: quote.shippingAddress,
        salesperson: quote.salesperson,
        placeOfSupply: quote.placeOfSupply,
        paymentTerms: 'Net 30',
        items: quote.items,
        subTotal: quote.subTotal,
        shippingCharges: quote.shippingCharges,
        cgst: quote.cgst,
        sgst: quote.sgst,
        igst: quote.igst,
        adjustment: quote.adjustment,
        total: quote.total,
        amountPaid: 0,
        balanceDue: quote.total,
        customerNotes: quote.customerNotes,
        termsAndConditions: quote.termsAndConditions,
        status: 'PENDING',
        sourceType: 'quote',
        sourceId: quote.id,
        sourceNumber: quote.quoteNumber,
        pdfTemplate: quote.pdfTemplate,
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        payments: [],
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Invoice created from Quote ${quote.quoteNumber}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      invoicesData.invoices.unshift(newInvoice);
      invoicesData.nextInvoiceNumber += 1;
      writeInvoicesData(invoicesData);

      // Update quote status
      quote.status = 'CONVERTED';
      quote.convertedTo = 'invoice';
      quote.updatedAt = now;
      quote.activityLogs.push({
        id: String(quote.activityLogs.length + 1),
        timestamp: now,
        action: 'converted',
        description: `Converted to Invoice ${invoiceNumber}`,
        user: req.body.createdBy || 'Admin User',
        link: `/invoices/${newInvoice.id}`
      });
      quotesData.quotes[quoteIndex] = quote;
      writeQuotesData(quotesData);

      res.status(201).json({ success: true, data: { quote, invoice: newInvoice } });
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to convert quote to invoice' });
    }
  });

  app.post("/api/quotes/:id/convert-to-sales-order", (req: Request, res: Response) => {
    try {
      const quotesData = readQuotesData();
      const quoteIndex = quotesData.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const quote = quotesData.quotes[quoteIndex];
      const salesOrdersData = readSalesOrdersData();
      const now = new Date().toISOString();
      const salesOrderNumber = generateSalesOrderNumber(salesOrdersData.nextSalesOrderNumber);

      const newSalesOrder = {
        id: String(Date.now()),
        salesOrderNumber,
        referenceNumber: quote.referenceNumber || '',
        date: new Date().toISOString().split('T')[0],
        expectedShipmentDate: '',
        customerId: quote.customerId,
        customerName: quote.customerName,
        billingAddress: quote.billingAddress,
        shippingAddress: quote.shippingAddress,
        paymentTerms: 'Due on Receipt',
        deliveryMethod: '',
        salesperson: quote.salesperson,
        placeOfSupply: quote.placeOfSupply,
        items: quote.items.map((item: any) => ({
          ...item,
          invoicedQty: 0,
          invoiceStatus: 'Not Invoiced'
        })),
        subTotal: quote.subTotal,
        shippingCharges: quote.shippingCharges,
        cgst: quote.cgst,
        sgst: quote.sgst,
        igst: quote.igst,
        adjustment: quote.adjustment,
        total: quote.total,
        customerNotes: quote.customerNotes,
        termsAndConditions: quote.termsAndConditions,
        orderStatus: 'CONFIRMED',
        invoiceStatus: 'Not Invoiced',
        paymentStatus: 'Unpaid',
        shipmentStatus: 'Pending',
        invoices: [],
        sourceType: 'quote',
        sourceId: quote.id,
        sourceNumber: quote.quoteNumber,
        pdfTemplate: quote.pdfTemplate,
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Sales Order created from Quote ${quote.quoteNumber}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      salesOrdersData.salesOrders.unshift(newSalesOrder);
      salesOrdersData.nextSalesOrderNumber += 1;
      writeSalesOrdersData(salesOrdersData);

      // Update quote status
      quote.status = 'CONVERTED';
      quote.convertedTo = 'sales-order';
      quote.updatedAt = now;
      quote.activityLogs.push({
        id: String(quote.activityLogs.length + 1),
        timestamp: now,
        action: 'converted',
        description: `Converted to Sales Order ${salesOrderNumber}`,
        user: req.body.createdBy || 'Admin User',
        link: `/sales-orders/${newSalesOrder.id}`
      });
      quotesData.quotes[quoteIndex] = quote;
      writeQuotesData(quotesData);

      res.status(201).json({ success: true, data: { quote, salesOrder: newSalesOrder } });
    } catch (error) {
      console.error('Error converting quote to sales order:', error);
      res.status(500).json({ success: false, message: 'Failed to convert quote to sales order' });
    }
  });

  app.patch("/api/quotes/:id/send", (req: Request, res: Response) => {
    try {
      const data = readQuotesData();
      const quoteIndex = data.quotes.findIndex((q: any) => q.id === req.params.id);

      if (quoteIndex === -1) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const now = new Date().toISOString();
      const quote = data.quotes[quoteIndex];

      quote.status = 'SENT';
      quote.updatedAt = now;
      quote.activityLogs.push({
        id: String(quote.activityLogs.length + 1),
        timestamp: now,
        action: 'sent',
        description: 'Quote has been sent to customer',
        user: req.body.sentBy || 'Admin User'
      });

      data.quotes[quoteIndex] = quote;
      writeQuotesData(data);

      res.json({ success: true, data: quote });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to send quote' });
    }
  });

  // Vendors API
  app.get("/api/vendors", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const billsData = readBillsData();

      // Calculate payables for each vendor based on opening balance and outstanding bills
      const vendorsWithPayables = data.vendors.map((vendor: any) => {
        const vendorBills = billsData.bills.filter((bill: any) => bill.vendorId === vendor.id);
        const outstandingBills = vendorBills.reduce((total: number, bill: any) => {
          if (bill.status !== 'PAID' && bill.status !== 'VOID') {
            return total + (bill.balanceDue || bill.total - (bill.amountPaid || 0));
          }
          return total;
        }, 0);

        // Include opening balance in payables calculation
        const totalPayables = (vendor.openingBalance || 0) + outstandingBills;

        return {
          ...vendor,
          payables: totalPayables
        };
      });

      res.json({ success: true, data: vendorsWithPayables });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendor = data.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }

      // Calculate payables for this vendor based on opening balance and outstanding bills
      const billsData = readBillsData();
      const vendorBills = billsData.bills.filter((bill: any) => bill.vendorId === vendor.id);
      const outstandingBills = vendorBills.reduce((total: number, bill: any) => {
        if (bill.status !== 'PAID' && bill.status !== 'VOID') {
          return total + (bill.balanceDue || bill.total - (bill.amountPaid || 0));
        }
        return total;
      }, 0);

      // Include opening balance in payables calculation
      const totalPayables = (vendor.openingBalance || 0) + outstandingBills;

      const vendorWithPayables = {
        ...vendor,
        payables: totalPayables
      };

      res.json({ success: true, data: vendorWithPayables });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const newVendor = {
        id: String(data.nextVendorId),
        organizationId: req.headers['x-organization-id'] || "1",
        ...req.body,
        status: req.body.status || "active",
        payables: 0,
        unusedCredits: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.vendors.push(newVendor);
      data.nextVendorId += 1;
      writeVendorsData(data);
      res.status(201).json({ success: true, data: newVendor });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create vendor" });
    }
  });

  app.put("/api/vendors/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const index = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      data.vendors[index] = {
        ...data.vendors[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      writeVendorsData(data);
      res.json({ success: true, data: data.vendors[index] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update vendor" });
    }
  });

  app.delete("/api/vendors/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const index = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      data.vendors.splice(index, 1);
      writeVendorsData(data);
      res.json({ success: true, message: "Vendor deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete vendor" });
    }
  });

  app.post("/api/vendors/:id/clone", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendor = data.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      const clonedVendor = {
        ...vendor,
        id: String(data.nextVendorId),
        displayName: `${vendor.displayName} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.vendors.push(clonedVendor);
      data.nextVendorId += 1;
      writeVendorsData(data);
      res.status(201).json({ success: true, data: clonedVendor });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to clone vendor" });
    }
  });

  app.patch("/api/vendors/:id/status", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const index = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      data.vendors[index] = {
        ...data.vendors[index],
        status: req.body.status,
        updatedAt: new Date().toISOString()
      };
      writeVendorsData(data);
      res.json({ success: true, data: data.vendors[index] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update vendor status" });
    }
  });

  // Vendor Comments API
  app.get("/api/vendors/:id/comments", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendor = data.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      res.json({ success: true, data: vendor.comments || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch comments" });
    }
  });

  app.post("/api/vendors/:id/comments", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const index = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      const newComment = {
        id: String(Date.now()),
        text: req.body.text,
        author: req.body.author || "Admin User",
        createdAt: new Date().toISOString()
      };
      if (!data.vendors[index].comments) {
        data.vendors[index].comments = [];
      }
      data.vendors[index].comments.push(newComment);
      writeVendorsData(data);
      res.status(201).json({ success: true, data: newComment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add comment" });
    }
  });

  // Vendor Transactions API
  app.get("/api/vendors/:id/transactions", (req: Request, res: Response) => {
    try {
      const vendorId = req.params.id;
      const billsData = readBillsData();
      const purchaseOrdersData = readPurchaseOrdersData();
      const expensesData = readExpensesData();
      const paymentsMadeData = readPaymentsMadeDataGlobal ? readPaymentsMadeDataGlobal() : { paymentsMade: [] };
      const vendorCreditsData = (typeof readVendorCreditsData === 'function') ? readVendorCreditsData() : { vendorCredits: [] };

      const vendorBills = (billsData.bills || []).filter((b: any) => b.vendorId === vendorId);
      const vendorPurchaseOrders = (purchaseOrdersData.purchaseOrders || []).filter((po: any) => po.vendorId === vendorId);
      const vendorExpenses = (expensesData.expenses || []).filter((e: any) => e.vendorId === vendorId);
      const vendorPayments = (paymentsMadeData.paymentsMade || []).filter((p: any) => p.vendorId === vendorId);
      const vendorCredits = (vendorCreditsData.vendorCredits || []).filter((vc: any) => vc.vendorId === vendorId);

      res.json({
        success: true,
        data: {
          bills: vendorBills.map((b: any) => ({
            id: b.id,
            type: 'bill',
            date: b.billDate || b.date,
            number: b.billNumber,
            orderNumber: b.orderNumber || '',
            vendor: b.vendorName || '',
            amount: b.total || 0,
            balance: b.balanceDue || b.total || 0,
            status: b.status || 'Draft'
          })),
          billPayments: vendorPayments.map((p: any) => ({
            id: p.id,
            type: 'payment',
            date: p.paymentDate || p.date,
            number: p.paymentNumber,
            referenceNumber: p.referenceNumber || '',
            vendor: p.vendorName || '',
            amount: p.amount || 0,
            balance: 0,
            status: 'Applied'
          })),
          expenses: vendorExpenses.map((e: any) => ({
            id: e.id,
            type: 'expense',
            date: e.date,
            number: e.expenseNumber || '',
            invoiceNumber: e.invoiceNumber || '',
            vendor: e.vendorName || '',
            paidThrough: e.paidThrough || '',
            customer: e.customerName || '',
            amount: e.amount || 0,
            balance: 0,
            status: e.status || 'Unbilled'
          })),
          purchaseOrders: vendorPurchaseOrders.map((po: any) => ({
            id: po.id,
            type: 'purchaseOrder',
            date: po.date || po.purchaseOrderDate,
            number: po.purchaseOrderNumber,
            referenceNumber: po.referenceNumber || '',
            deliveryDate: po.expectedDeliveryDate || '',
            amount: po.total || 0,
            balance: 0,
            status: po.status || 'Draft'
          })),
          vendorCredits: vendorCredits.map((vc: any) => ({
            id: vc.id,
            type: 'vendorCredit',
            date: vc.creditNoteDate || vc.date,
            number: vc.creditNoteNumber,
            vendor: vc.vendorName || '',
            amount: vc.total || vc.amount || 0,
            balance: vc.balance || 0,
            status: vc.status || 'Open'
          })),
          journals: []
        }
      });
    } catch (error) {
      console.error('Error fetching vendor transactions:', error);
      res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
  });

  // Vendor Statement Send API
  app.post("/api/vendors/:id/statement/send", async (req: Request, res: Response) => {
    try {
      const vendorsData = readVendorsData();
      const vendor = vendorsData.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

      const { recipients, cc, bcc, subject, body, pdfData } = req.body;

      // Prepare attachments if PDF data is provided
      const attachments = pdfData ? [{
        filename: `statement_${vendor.displayName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        content: Buffer.from(pdfData, 'base64'),
        contentType: 'application/pdf'
      }] : undefined;

      console.log(`[VENDOR_STATEMENT_SEND] Triggering email for vendor ${vendor.id}. PDF included: ${!!pdfData}. PDF size (base64): ${pdfData ? pdfData.length : 0}`);

      const recipientEmails = recipients && recipients.length > 0 ? recipients : (vendor.email ? [vendor.email] : []);

      if (recipientEmails.length === 0) {
        throw new Error("Vendor has no email address and no recipients were provided");
      }

      // Process body to convert newlines and markdown-style formatting to HTML
      let processedBody = body || `<p>Please find your statement attached.</p>`;
      if (body) {
        processedBody = body
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          .replace(/\*(.*?)\*/g, '<i>$1</i>')
          .replace(/__(.*?)__/g, '<u>$1</u>')
          .replace(/~~(.*?)~~/g, '<s>$1</s>');
      }

      // Add activity log
      if (!vendor.mails) vendor.mails = [];
      vendor.mails.push({
        id: Math.random().toString(36).substr(2, 9),
        to: recipientEmails.join(', '),
        subject: subject || `Statement of Accounts`,
        date: new Date().toISOString(),
        status: 'Sent',
        type: 'Statement'
      });

      // Also add to activities
      if (!vendor.activities) vendor.activities = [];
      vendor.activities.push({
        id: Math.random().toString(36).substr(2, 9),
        title: 'Statement Sent',
        description: `Statement sent to ${recipientEmails.join(', ')}`,
        date: new Date().toISOString(),
        user: 'System'
      });

      writeVendorsData(vendorsData);

      // Trigger actual email sending (reusing EmailTriggerService)
      try {
        await EmailTriggerService.createTrigger({
          vendorId: vendor.id,
          recipients: recipientEmails,
          cc: cc,
          bcc: bcc,
          customSubject: subject,
          customBody: processedBody,
          sendMode: 'immediate',
          attachments: attachments
        }, { vendor: vendor });
      } catch (emailError) {
        console.error("Failed to trigger vendor statement email sending:", emailError);
        // We still return success but maybe log the error
      }

      res.json({ success: true, message: "Statement sent successfully" });
    } catch (error: any) {
      console.error('Error sending vendor statement:', error);
      res.status(500).json({ success: false, message: error.message || "Failed to send statement" });
    }
  });

  // Vendor Mails API
  app.get("/api/vendors/:id/mails", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendor = data.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }
      res.json({ success: true, data: vendor.mails || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch mails" });
    }
  });

  // Vendor Activities API
  app.get("/api/vendors/:id/activities", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendor = data.vendors.find((v: any) => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }

      // Generate activities from transactions
      const activities: any[] = [];
      const vendorId = req.params.id;

      // Get bills for this vendor
      try {
        const billsData = readBillsData();
        const vendorBills = billsData.bills.filter((bill: any) => bill.vendorId === vendorId);
        vendorBills.forEach((bill: any) => {
          activities.push({
            id: `activity-bill-${bill.id}`,
            type: 'bill',
            title: `Bill ${bill.billNumber} Created`,
            description: `Bill created for ${formatCurrencyServer(bill.total || 0)}`,
            user: 'System',
            date: bill.createdAt || bill.date,
            time: new Date(bill.createdAt || bill.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get payments made to this vendor
      try {
        const paymentsMadeData = readPaymentsMadeData();
        const vendorPayments = paymentsMadeData.paymentsMade.filter((p: any) => p.vendorId === vendorId);
        vendorPayments.forEach((payment: any) => {
          activities.push({
            id: `activity-payment-${payment.id}`,
            type: 'payment',
            title: `Payment ${payment.paymentNumber} Made`,
            description: `Payment of ${formatCurrencyServer(payment.amount || 0)} made`,
            user: 'System',
            date: payment.createdAt || payment.date,
            time: new Date(payment.createdAt || payment.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get purchase orders for this vendor
      try {
        const purchaseOrdersData = readPurchaseOrdersData();
        const vendorPOs = purchaseOrdersData.purchaseOrders.filter((po: any) => po.vendorId === vendorId);
        vendorPOs.forEach((po: any) => {
          activities.push({
            id: `activity-po-${po.id}`,
            type: 'purchase_order',
            title: `Purchase Order ${po.purchaseOrderNumber} Created`,
            description: `Purchase order created for ${formatCurrencyServer(po.total || 0)}`,
            user: 'System',
            date: po.createdAt || po.date,
            time: new Date(po.createdAt || po.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Get vendor credits for this vendor
      try {
        const vendorCreditsData = readVendorCreditsData();
        const vendorCreditsList = vendorCreditsData.vendorCredits.filter((vc: any) => vc.vendorId === vendorId);
        vendorCreditsList.forEach((vc: any) => {
          activities.push({
            id: `activity-vc-${vc.id}`,
            type: 'vendor_credit',
            title: `Vendor Credit ${vc.vendorCreditNumber} Created`,
            description: `Vendor credit for ${formatCurrencyServer(vc.total || 0)}`,
            user: 'System',
            date: vc.createdAt || vc.date,
            time: new Date(vc.createdAt || vc.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          });
        });
      } catch (e) { /* ignore */ }

      // Add vendor creation activity
      if (vendor.createdAt) {
        activities.push({
          id: `activity-vendor-created-${vendor.id}`,
          type: 'vendor',
          title: 'Vendor Created',
          description: `Vendor ${vendor.displayName || vendor.name} was created`,
          user: 'System',
          date: vendor.createdAt,
          time: new Date(vendor.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });
      }

      // Sort by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ success: true, data: activities });
    } catch (error) {
      console.error('Error fetching vendor activities:', error);
      res.status(500).json({ success: false, message: "Failed to fetch activities" });
    }
  });

  // Vendor Attachments API
  app.post("/api/vendors/:id/attachments", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendorIndex = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (vendorIndex === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }

      if (!data.vendors[vendorIndex].attachments) {
        data.vendors[vendorIndex].attachments = [];
      }

      const files = ((req as any).files as any[]) || [];
      const newAttachments = files.map((file: any) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.originalname || file.name || 'file',
        size: file.size || 0,
        type: file.mimetype || file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString()
      }));

      data.vendors[vendorIndex].attachments.push(...newAttachments);
      data.vendors[vendorIndex].updatedAt = new Date().toISOString();
      writeVendorsData(data);

      res.status(201).json({ success: true, data: newAttachments });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to upload attachments" });
    }
  });

  app.delete("/api/vendors/:id/attachments/:attachmentId", (req: Request, res: Response) => {
    try {
      const data = readVendorsData();
      const vendorIndex = data.vendors.findIndex((v: any) => v.id === req.params.id);
      if (vendorIndex === -1) {
        return res.status(404).json({ success: false, message: "Vendor not found" });
      }

      if (!data.vendors[vendorIndex].attachments) {
        return res.status(404).json({ success: false, message: "Attachment not found" });
      }

      const attachmentIndex = data.vendors[vendorIndex].attachments.findIndex(
        (a: any) => a.id === req.params.attachmentId
      );

      if (attachmentIndex === -1) {
        return res.status(404).json({ success: false, message: "Attachment not found" });
      }

      data.vendors[vendorIndex].attachments.splice(attachmentIndex, 1);
      data.vendors[vendorIndex].updatedAt = new Date().toISOString();
      writeVendorsData(data);

      res.json({ success: true, message: "Attachment deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete attachment" });
    }
  });

  // Delivery Challans API
  app.get("/api/delivery-challans/next-number", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const nextNumber = generateChallanNumber(data.nextChallanNumber);
      res.json({ success: true, data: { challanNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next challan number" });
    }
  });

  app.get("/api/delivery-challans", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const challans = data.deliveryChallans.map((challan: any) => ({
        id: challan.id,
        challanNumber: challan.challanNumber,
        referenceNumber: challan.referenceNumber,
        customerName: challan.customerName,
        customerId: challan.customerId,
        date: challan.date,
        amount: challan.total,
        status: challan.status,
        invoiceStatus: challan.invoiceStatus || '',
        challanType: challan.challanType
      }));
      res.json({ success: true, data: challans });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch delivery challans" });
    }
  });

  app.get("/api/delivery-challans/:id", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const challan = data.deliveryChallans.find((c: any) => c.id === req.params.id);
      if (!challan) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }
      res.json({ success: true, data: challan });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch delivery challan" });
    }
  });

  app.post("/api/delivery-challans", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const challanNumber = generateChallanNumber(data.nextChallanNumber);
      const now = new Date().toISOString();

      const newChallan = {
        id: String(Date.now()),
        challanNumber,
        referenceNumber: req.body.referenceNumber || '',
        date: req.body.date,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        challanType: req.body.challanType,
        billingAddress: req.body.billingAddress || {},
        shippingAddress: req.body.shippingAddress || {},
        placeOfSupply: req.body.placeOfSupply || '',
        gstin: req.body.gstin || '',
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        cgst: req.body.cgst || 0,
        sgst: req.body.sgst || 0,
        igst: req.body.igst || 0,
        adjustment: req.body.adjustment || 0,
        total: req.body.total || 0,
        customerNotes: req.body.customerNotes || '',
        termsAndConditions: req.body.termsAndConditions || '',
        status: req.body.status || 'DRAFT',
        invoiceStatus: '',
        invoiceId: null,
        createdAt: now,
        updatedAt: now,
        activityLogs: [{
          id: '1',
          timestamp: now,
          action: 'created',
          description: `Delivery challan ${challanNumber} created`,
          user: req.body.createdBy || 'Admin User'
        }]
      };

      data.deliveryChallans.push(newChallan);
      data.nextChallanNumber += 1;
      writeDeliveryChallansData(data);

      res.status(201).json({ success: true, data: newChallan });
    } catch (error) {
      console.error('Error creating delivery challan:', error);
      res.status(500).json({ success: false, message: "Failed to create delivery challan" });
    }
  });

  app.put("/api/delivery-challans/:id", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const index = data.deliveryChallans.findIndex((c: any) => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }

      const existingChallan = data.deliveryChallans[index];
      const now = new Date().toISOString();

      const updatedChallan = {
        ...existingChallan,
        ...req.body,
        id: existingChallan.id,
        challanNumber: existingChallan.challanNumber,
        updatedAt: now,
        activityLogs: [
          ...existingChallan.activityLogs,
          {
            id: String(existingChallan.activityLogs.length + 1),
            timestamp: now,
            action: 'updated',
            description: 'Delivery challan updated',
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      data.deliveryChallans[index] = updatedChallan;
      writeDeliveryChallansData(data);

      res.json({ success: true, data: updatedChallan });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update delivery challan" });
    }
  });

  app.delete("/api/delivery-challans/:id", (req: Request, res: Response) => {
    try {
      const data = readDeliveryChallansData();
      const index = data.deliveryChallans.findIndex((c: any) => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }

      data.deliveryChallans.splice(index, 1);
      writeDeliveryChallansData(data);

      res.json({ success: true, message: "Delivery challan deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete delivery challan" });
    }
  });

  app.post("/api/delivery-challans/:id/convert-to-invoice", (req: Request, res: Response) => {
    try {
      const challansData = readDeliveryChallansData();
      const challanIndex = challansData.deliveryChallans.findIndex((c: any) => c.id === req.params.id);

      if (challanIndex === -1) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }

      const challan = challansData.deliveryChallans[challanIndex];
      const invoicesData = readInvoicesData();
      const invoiceNumber = generateInvoiceNumber(invoicesData.nextInvoiceNumber);
      const now = new Date().toISOString();

      const newInvoice = {
        id: String(Date.now()),
        invoiceNumber,
        referenceNumber: challan.challanNumber,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerId: challan.customerId,
        customerName: challan.customerName,
        billingAddress: challan.billingAddress,
        shippingAddress: challan.shippingAddress,
        salesperson: '',
        placeOfSupply: challan.placeOfSupply,
        paymentTerms: 'Net 30',
        items: challan.items,
        subTotal: challan.subTotal,
        shippingCharges: 0,
        cgst: challan.cgst,
        sgst: challan.sgst,
        igst: challan.igst,
        adjustment: challan.adjustment,
        total: challan.total,
        amountPaid: 0,
        balanceDue: challan.total,
        customerNotes: challan.customerNotes,
        termsAndConditions: challan.termsAndConditions,
        status: 'PENDING',
        sourceType: 'delivery_challan',
        sourceId: challan.id,
        sourceNumber: challan.challanNumber,
        createdAt: now,
        updatedAt: now,
        activityLogs: [{
          id: '1',
          timestamp: now,
          action: 'created',
          description: `Invoice ${invoiceNumber} created from delivery challan ${challan.challanNumber}`,
          user: req.body.createdBy || 'Admin User'
        }]
      };

      invoicesData.invoices.push(newInvoice);
      invoicesData.nextInvoiceNumber += 1;
      writeInvoicesData(invoicesData);

      challan.invoiceStatus = 'INVOICED';
      challan.invoiceId = newInvoice.id;
      challan.updatedAt = now;
      challan.activityLogs.push({
        id: String(challan.activityLogs.length + 1),
        timestamp: now,
        action: 'converted',
        description: `Converted to invoice ${invoiceNumber}`,
        user: req.body.createdBy || 'Admin User'
      });

      challansData.deliveryChallans[challanIndex] = challan;
      writeDeliveryChallansData(challansData);

      res.json({ success: true, data: { challan, invoice: newInvoice } });
    } catch (error) {
      console.error('Error converting to invoice:', error);
      res.status(500).json({ success: false, message: "Failed to convert to invoice" });
    }
  });

  app.patch("/api/delivery-challans/:id/status", (req: Request, res: Response) => {
    try {
      const challansData = readDeliveryChallansData();
      const challanIndex = challansData.deliveryChallans.findIndex((c: any) => c.id === req.params.id);

      if (challanIndex === -1) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }

      const challan = challansData.deliveryChallans[challanIndex];
      const now = new Date().toISOString();

      challan.status = req.body.status;
      challan.updatedAt = now;

      if (!challan.activityLogs) challan.activityLogs = [];
      challan.activityLogs.push({
        id: String(challan.activityLogs.length + 1),
        timestamp: now,
        action: 'status_changed',
        description: `Status changed to ${req.body.status}`,
        user: req.body.user || 'Admin User'
      });

      challansData.deliveryChallans[challanIndex] = challan;
      writeDeliveryChallansData(challansData);

      res.json({ success: true, data: challan });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update status" });
    }
  });

  app.post("/api/delivery-challans/:id/clone", (req: Request, res: Response) => {
    try {
      const challansData = readDeliveryChallansData();
      const originalChallan = challansData.deliveryChallans.find((c: any) => c.id === req.params.id);

      if (!originalChallan) {
        return res.status(404).json({ success: false, message: "Delivery challan not found" });
      }

      const now = new Date().toISOString();
      const newChallanNumber = generateChallanNumber(challansData.nextChallanNumber);

      const clonedChallan = {
        ...originalChallan,
        id: String(Date.now()),
        challanNumber: newChallanNumber,
        status: 'DRAFT',
        invoiceStatus: null,
        invoiceId: null,
        createdAt: now,
        updatedAt: now,
        activityLogs: [{
          id: '1',
          timestamp: now,
          action: 'created',
          description: `Cloned from ${originalChallan.challanNumber}`,
          user: req.body.user || 'Admin User'
        }]
      };

      challansData.deliveryChallans.push(clonedChallan);
      challansData.nextChallanNumber += 1;
      writeDeliveryChallansData(challansData);

      res.json({ success: true, data: clonedChallan });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to clone delivery challan" });
    }
  });

  // Expenses API
  app.get("/api/expenses", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const sortBy = req.query.sortBy as string || 'createdTime';
      const sortOrder = req.query.sortOrder as string || 'desc';

      let expenses = [...data.expenses];

      expenses.sort((a: any, b: any) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        if (sortBy === 'amount') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        if (sortOrder === 'desc') {
          return aVal > bVal ? -1 : 1;
        }
        return aVal > bVal ? 1 : -1;
      });

      res.json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const expense = data.expenses.find((e: any) => e.id === req.params.id);
      if (!expense) {
        return res.status(404).json({ success: false, message: "Expense not found" });
      }
      res.json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const now = new Date().toISOString();
      const expenseNumber = generateExpenseNumber(data.nextExpenseId);

      const newExpense = {
        id: String(data.nextExpenseId),
        organizationId: req.headers['x-organization-id'] || "1",
        expenseNumber,
        date: req.body.date || new Date().toISOString().split('T')[0],
        expenseAccount: req.body.expenseAccount || '',
        amount: req.body.amount || 0,
        currency: req.body.currency || 'INR',
        paidThrough: req.body.paidThrough || '',
        expenseType: req.body.expenseType || 'services',
        sac: req.body.sac || '',
        vendorId: req.body.vendorId || '',
        vendorName: req.body.vendorName || '',
        gstTreatment: req.body.gstTreatment || '',
        sourceOfSupply: req.body.sourceOfSupply || '',
        destinationOfSupply: req.body.destinationOfSupply || '',
        reverseCharge: req.body.reverseCharge || false,
        tax: req.body.tax || '',
        taxAmount: req.body.taxAmount || 0,
        amountIs: req.body.amountIs || 'tax_exclusive',
        invoiceNumber: req.body.invoiceNumber || '',
        notes: req.body.notes || '',
        customerId: req.body.customerId || '',
        customerName: req.body.customerName || '',
        reportingTags: req.body.reportingTags || [],
        isBillable: req.body.isBillable || false,
        status: req.body.status || 'recorded',
        attachments: req.body.attachments || [],
        createdAt: now,
        updatedAt: now,
        createdTime: now
      };

      data.expenses.unshift(newExpense);
      data.nextExpenseId += 1;
      writeExpensesData(data);

      res.status(201).json({ success: true, data: newExpense });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ success: false, message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const index = data.expenses.findIndex((e: any) => e.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Expense not found" });
      }

      data.expenses[index] = {
        ...data.expenses[index],
        ...req.body,
        id: data.expenses[index].id,
        expenseNumber: data.expenses[index].expenseNumber,
        createdAt: data.expenses[index].createdAt,
        updatedAt: new Date().toISOString()
      };

      writeExpensesData(data);
      res.json({ success: true, data: data.expenses[index] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const index = data.expenses.findIndex((e: any) => e.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Expense not found" });
      }

      data.expenses.splice(index, 1);
      writeExpensesData(data);

      res.json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete expense" });
    }
  });

  // Mileage API
  app.get("/api/mileage", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      res.json({ success: true, data: data.mileageRecords });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch mileage records" });
    }
  });

  app.post("/api/mileage", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const now = new Date().toISOString();

      const newMileage = {
        id: String(data.nextMileageId),
        date: req.body.date || new Date().toISOString().split('T')[0],
        employee: req.body.employee || '',
        calculationMethod: req.body.calculationMethod || 'distance_travelled',
        distance: req.body.distance || 0,
        unit: req.body.unit || 'km',
        startOdometer: req.body.startOdometer || 0,
        endOdometer: req.body.endOdometer || 0,
        amount: req.body.amount || 0,
        currency: req.body.currency || 'INR',
        paidThrough: req.body.paidThrough || '',
        vendorId: req.body.vendorId || '',
        vendorName: req.body.vendorName || '',
        invoiceNumber: req.body.invoiceNumber || '',
        notes: req.body.notes || '',
        customerId: req.body.customerId || '',
        customerName: req.body.customerName || '',
        reportingTags: req.body.reportingTags || [],
        status: 'recorded',
        createdAt: now,
        updatedAt: now
      };

      data.mileageRecords.unshift(newMileage);
      data.nextMileageId += 1;
      writeExpensesData(data);

      res.status(201).json({ success: true, data: newMileage });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create mileage record" });
    }
  });

  app.delete("/api/mileage/:id", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const index = data.mileageRecords.findIndex((m: any) => m.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Mileage record not found" });
      }

      data.mileageRecords.splice(index, 1);
      writeExpensesData(data);

      res.json({ success: true, message: "Mileage record deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete mileage record" });
    }
  });

  // Mileage Settings API
  app.get("/api/mileage-settings", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      res.json({ success: true, data: data.mileageSettings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch mileage settings" });
    }
  });

  app.put("/api/mileage-settings", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      data.mileageSettings = {
        ...data.mileageSettings,
        ...req.body
      };
      writeExpensesData(data);
      res.json({ success: true, data: data.mileageSettings });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update mileage settings" });
    }
  });

  app.post("/api/mileage-settings/rates", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const newRate = {
        id: String(Date.now()),
        startDate: req.body.startDate,
        rate: req.body.rate,
        currency: req.body.currency || 'INR'
      };
      data.mileageSettings.mileageRates.push(newRate);
      writeExpensesData(data);
      res.status(201).json({ success: true, data: newRate });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add mileage rate" });
    }
  });

  app.delete("/api/mileage-settings/rates/:id", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const index = data.mileageSettings.mileageRates.findIndex((r: any) => r.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Mileage rate not found" });
      }

      data.mileageSettings.mileageRates.splice(index, 1);
      writeExpensesData(data);

      res.json({ success: true, message: "Mileage rate deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete mileage rate" });
    }
  });

  // Bulk import expenses
  app.post("/api/expenses/import", (req: Request, res: Response) => {
    try {
      const data = readExpensesData();
      const importedExpenses = req.body.expenses || [];
      const now = new Date().toISOString();

      const newExpenses = importedExpenses.map((expense: any, index: number) => ({
        id: String(data.nextExpenseId + index),
        expenseNumber: generateExpenseNumber(data.nextExpenseId + index),
        ...expense,
        status: 'recorded',
        createdAt: now,
        updatedAt: now,
        createdTime: now
      }));

      data.expenses = [...newExpenses, ...data.expenses];
      data.nextExpenseId += importedExpenses.length;
      writeExpensesData(data);

      res.status(201).json({ success: true, data: newExpenses, message: `${newExpenses.length} expenses imported successfully` });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to import expenses" });
    }
  });

  // Dashboard API
  app.get("/api/dashboard", (req: Request, res: Response) => {
    try {
      const data = readDashboardData();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/dashboard/summary", (req: Request, res: Response) => {
    try {
      const data = readDashboardData();
      res.json({ success: true, data: data.summary });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch summary" });
    }
  });

  app.get("/api/dashboard/cash-flow", (req: Request, res: Response) => {
    try {
      const data = readDashboardData();
      res.json({ success: true, data: data.cashFlow });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch cash flow" });
    }
  });

  app.get("/api/dashboard/income-expense", (req: Request, res: Response) => {
    try {
      const data = readDashboardData();
      res.json({ success: true, data: data.incomeExpense });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch income expense" });
    }
  });

  app.get("/api/dashboard/top-expenses", (req: Request, res: Response) => {
    try {
      const data = readDashboardData();
      res.json({ success: true, data: data.topExpenses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch top expenses" });
    }
  });

  app.put("/api/dashboard", (req: Request, res: Response) => {
    try {
      const data = req.body;
      writeDashboardData(data);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update dashboard data" });
    }
  });

  // Reports API
  app.get("/api/reports", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch reports data" });
    }
  });

  app.get("/api/reports/profit-loss", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.profitAndLoss });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch profit and loss" });
    }
  });

  app.get("/api/reports/sales-by-customer", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.salesByCustomer });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch sales by customer" });
    }
  });

  app.get("/api/reports/expense-breakdown", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.expenseBreakdown });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch expense breakdown" });
    }
  });

  app.get("/api/reports/tax-summary", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.taxSummary });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch tax summary" });
    }
  });

  app.get("/api/reports/receivables-aging", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.receivablesAging });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch receivables aging" });
    }
  });

  app.get("/api/reports/payables-aging", (req: Request, res: Response) => {
    try {
      const data = readReportsData();
      res.json({ success: true, data: data.payablesAging });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch payables aging" });
    }
  });

  app.put("/api/reports", (req: Request, res: Response) => {
    try {
      const data = req.body;
      writeReportsData(data);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update reports data" });
    }
  });

  // Purchase Orders API
  app.get("/api/purchase-orders/next-number", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const nextNumber = generatePurchaseOrderNumber(data.nextPurchaseOrderNumber);
      res.json({ success: true, data: { purchaseOrderNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next purchase order number" });
    }
  });

  app.get("/api/purchase-orders", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      res.json({ success: true, data: data.purchaseOrders });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchase-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const purchaseOrder = data.purchaseOrders.find((po: any) => po.id === req.params.id);
      if (!purchaseOrder) {
        return res.status(404).json({ success: false, message: "Purchase order not found" });
      }
      res.json({ success: true, data: purchaseOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchase-orders", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const purchaseOrderNumber = generatePurchaseOrderNumber(data.nextPurchaseOrderNumber);
      const now = new Date().toISOString();

      const newPurchaseOrder = {
        id: String(Date.now()),
        purchaseOrderNumber,
        referenceNumber: req.body.referenceNumber || '',
        date: req.body.date || new Date().toISOString().split('T')[0],
        deliveryDate: req.body.deliveryDate || '',
        vendorId: req.body.vendorId || '',
        vendorName: req.body.vendorName || '',
        vendorAddress: req.body.vendorAddress || {},
        deliveryAddress: req.body.deliveryAddress || {},
        deliveryAddressType: req.body.deliveryAddressType || 'organization',
        paymentTerms: req.body.paymentTerms || 'Due on Receipt',
        shipmentPreference: req.body.shipmentPreference || '',
        reverseCharge: req.body.reverseCharge || false,
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        discountType: req.body.discountType || 'percent',
        discountValue: req.body.discountValue || 0,
        discountAmount: req.body.discountAmount || 0,
        taxType: req.body.taxType || 'TDS',
        taxCategory: req.body.taxCategory || '',
        taxAmount: req.body.taxAmount || 0,
        adjustment: req.body.adjustment || 0,
        adjustmentDescription: req.body.adjustmentDescription || '',
        total: req.body.total || 0,
        notes: req.body.notes || '',
        termsAndConditions: req.body.termsAndConditions || '',
        attachments: req.body.attachments || [],
        status: req.body.status || 'ISSUED',
        receiveStatus: req.body.receiveStatus || 'YET TO BE RECEIVED',
        billedStatus: req.body.billedStatus || 'YET TO BE BILLED',
        pdfTemplate: req.body.pdfTemplate || 'Standard Template',
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Purchase Order created for ₹${req.body.total?.toLocaleString('en-IN') || '0.00'}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      data.purchaseOrders.unshift(newPurchaseOrder);
      data.nextPurchaseOrderNumber += 1;
      writePurchaseOrdersData(data);

      res.status(201).json({ success: true, data: newPurchaseOrder });
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ success: false, message: 'Failed to create purchase order' });
    }
  });

  app.put("/api/purchase-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const poIndex = data.purchaseOrders.findIndex((po: any) => po.id === req.params.id);

      if (poIndex === -1) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      const now = new Date().toISOString();
      const existingPO = data.purchaseOrders[poIndex];

      const updatedPO = {
        ...existingPO,
        ...req.body,
        id: existingPO.id,
        purchaseOrderNumber: existingPO.purchaseOrderNumber,
        createdAt: existingPO.createdAt,
        updatedAt: now,
        activityLogs: [
          ...existingPO.activityLogs,
          {
            id: String(existingPO.activityLogs.length + 1),
            timestamp: now,
            action: 'updated',
            description: 'Purchase Order has been updated',
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      data.purchaseOrders[poIndex] = updatedPO;
      writePurchaseOrdersData(data);

      res.json({ success: true, data: updatedPO });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update purchase order' });
    }
  });

  app.patch("/api/purchase-orders/:id/status", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const poIndex = data.purchaseOrders.findIndex((po: any) => po.id === req.params.id);

      if (poIndex === -1) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      const now = new Date().toISOString();
      const existingPO = data.purchaseOrders[poIndex];
      const newStatus = req.body.status;

      let actionDescription = `Status changed to ${newStatus}`;
      if (newStatus === 'ISSUED') actionDescription = 'Purchase Order has been issued';
      if (newStatus === 'CLOSED') actionDescription = 'Purchase Order has been closed';
      if (newStatus === 'CANCELLED') actionDescription = 'Purchase Order has been cancelled';
      if (newStatus === 'RECEIVED') actionDescription = 'Purchase Order has been received';

      existingPO.status = newStatus;
      if (newStatus === 'RECEIVED') {
        existingPO.receiveStatus = 'RECEIVED';
      }
      existingPO.updatedAt = now;
      existingPO.activityLogs.push({
        id: String(existingPO.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || 'Admin User'
      });

      data.purchaseOrders[poIndex] = existingPO;
      writePurchaseOrdersData(data);

      res.json({ success: true, data: existingPO });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update purchase order status' });
    }
  });

  app.post("/api/purchase-orders/:id/convert-to-bill", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const poIndex = data.purchaseOrders.findIndex((po: any) => po.id === req.params.id);

      if (poIndex === -1) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      const now = new Date().toISOString();
      const purchaseOrder = data.purchaseOrders[poIndex];

      purchaseOrder.billedStatus = 'BILLED';
      purchaseOrder.updatedAt = now;
      purchaseOrder.activityLogs.push({
        id: String(purchaseOrder.activityLogs.length + 1),
        timestamp: now,
        action: 'converted_to_bill',
        description: 'Purchase Order converted to Bill',
        user: req.body.convertedBy || 'Admin User'
      });

      data.purchaseOrders[poIndex] = purchaseOrder;
      writePurchaseOrdersData(data);

      res.json({ success: true, data: purchaseOrder, message: 'Purchase Order converted to Bill' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to convert to bill' });
    }
  });

  app.delete("/api/purchase-orders/:id", (req: Request, res: Response) => {
    try {
      const data = readPurchaseOrdersData();
      const poIndex = data.purchaseOrders.findIndex((po: any) => po.id === req.params.id);

      if (poIndex === -1) {
        return res.status(404).json({ success: false, message: 'Purchase order not found' });
      }

      data.purchaseOrders.splice(poIndex, 1);
      writePurchaseOrdersData(data);

      res.json({ success: true, message: 'Purchase order deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete purchase order' });
    }
  });

  // Bills API
  app.get("/api/bills/next-number", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const nextNumber = generateBillNumber(data.nextBillNumber);
      res.json({ success: true, data: { billNumber: nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next bill number" });
    }
  });

  app.get("/api/bills/accounts", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      res.json({ success: true, data: data.accounts || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/bills/taxes", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      res.json({ success: true, data: data.taxes || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch taxes" });
    }
  });

  app.get("/api/bills", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const vendorId = req.query.vendorId as string;

      let bills = data.bills;

      // Filter by vendor if vendorId is provided
      if (vendorId) {
        bills = bills.filter((b: any) => b.vendorId === vendorId);
      }

      // Show all bills regardless of payment status
      // Removed filter that was hiding PAID bills

      // Sort by bill date (newest first) for better UX
      bills.sort((a: any, b: any) => {
        const dateA = new Date(a.billDate || a.date || 0).getTime();
        const dateB = new Date(b.billDate || b.date || 0).getTime();
        return dateB - dateA;
      });

      // Fetch payments made that are linked to bills
      try {
        const paymentsMadeData = readPaymentsMadeData();
        console.log(`[Bills GET] Processing ${bills.length} bills with ${paymentsMadeData.paymentsMade.length} total payments`);

        bills = bills.map((bill: any) => {
          const linkedPayments = paymentsMadeData.paymentsMade
            .filter((pm: any) => {
              // Exclude payments created via Record Payment button
              // Check both the paymentSource field and the notes pattern
              if (pm.paymentSource === 'record_payment') return false;
              if (pm.notes && /^Payment for Bill #/i.test(pm.notes)) return false;
              return pm.billPayments && pm.billPayments[bill.id];
            })
            .map((pm: any) => {
              const billPayment = pm.billPayments[bill.id];
              const amount = typeof billPayment === 'number' ? billPayment : (billPayment?.amountPaid || 0);
              return {
                paymentId: pm.id,
                paymentNumber: pm.paymentNumber,
                amount: amount,
                date: pm.paymentDate || pm.date,
                mode: pm.paymentMode || pm.mode
              };
            });

          if (linkedPayments.length > 0) {
            console.log(`[Bill ${bill.billNumber}] Found ${linkedPayments.length} payments`);
          }

          return {
            ...bill,
            paymentsMadeApplied: linkedPayments
          };
        });
      } catch (error) {
        console.error('[Bills GET] Error fetching payments made:', error);
        // If there's an error reading payments made, continue without them
        bills = bills.map((bill: any) => ({
          ...bill,
          paymentsMadeApplied: []
        }));
      }

      res.json({ success: true, data: bills });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch bills" });
    }
  });

  app.get("/api/bills/:id", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const bill = data.bills.find((b: any) => b.id === req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, message: "Bill not found" });
      }

      // Fetch payments made that are linked to this bill
      try {
        const paymentsMadeData = readPaymentsMadeData();
        const linkedPayments = paymentsMadeData.paymentsMade
          .filter((pm: any) => {
            // Exclude payments created via Record Payment button
            // Check both the paymentSource field and the notes pattern
            if (pm.paymentSource === 'record_payment') return false;
            if (pm.notes && /^Payment for Bill #/i.test(pm.notes)) return false;
            return pm.billPayments && pm.billPayments[bill.id];
          })
          .map((pm: any) => {
            const billPayment = pm.billPayments[bill.id];
            const amount = typeof billPayment === 'number' ? billPayment : (billPayment?.amountPaid || 0);
            return {
              paymentId: pm.id,
              paymentNumber: pm.paymentNumber,
              amount: amount,
              date: pm.paymentDate || pm.date,
              mode: pm.paymentMode || pm.mode
            };
          });

        console.log(`[Bill ${bill.id}] Found ${linkedPayments.length} payments made:`, linkedPayments);

        // Add paymentsMadeApplied to the bill response
        bill.paymentsMadeApplied = linkedPayments;
      } catch (error) {
        console.error('[Bill GET] Error fetching payments made:', error);
        // If there's an error reading payments made, just continue without them
        bill.paymentsMadeApplied = [];
      }

      res.json({ success: true, data: bill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch bill" });
    }
  });

  app.post("/api/bills", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const billNumber = req.body.billNumber || generateBillNumber(data.nextBillNumber);
      const now = new Date().toISOString();

      const newBill = {
        id: String(Date.now()),
        organizationId: req.headers['x-organization-id'] || "1",
        billNumber,
        orderNumber: req.body.orderNumber || '',
        vendorId: req.body.vendorId || '',
        vendorName: req.body.vendorName || '',
        vendorAddress: req.body.vendorAddress || {
          street1: '',
          street2: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
          gstin: ''
        },
        billDate: req.body.billDate || new Date().toISOString().split('T')[0],
        dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
        paymentTerms: req.body.paymentTerms || 'Due on Receipt',
        reverseCharge: req.body.reverseCharge || false,
        subject: req.body.subject || '',
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        discountType: req.body.discountType || 'percent',
        discountValue: req.body.discountValue || 0,
        discountAmount: req.body.discountAmount || 0,
        taxType: req.body.taxType || 'TDS',
        taxCategory: req.body.taxCategory || '',
        taxAmount: req.body.taxAmount || 0,
        adjustment: req.body.adjustment || 0,
        adjustmentDescription: req.body.adjustmentDescription || '',
        total: req.body.total || 0,
        amountPaid: req.body.amountPaid || 0,
        balanceDue: req.body.balanceDue || req.body.total || 0,
        notes: req.body.notes || '',
        attachments: req.body.attachments || [],
        status: req.body.status || 'OPEN',
        pdfTemplate: req.body.pdfTemplate || 'Standard Template',
        journalEntries: req.body.journalEntries || [],
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || 'Admin User',
        activityLogs: [
          {
            id: '1',
            timestamp: now,
            action: 'created',
            description: `Bill created for ₹${req.body.total?.toLocaleString('en-IN') || '0.00'}`,
            user: req.body.createdBy || 'Admin User'
          }
        ]
      };

      data.bills.unshift(newBill);
      data.nextBillNumber += 1;
      writeBillsData(data);

      res.status(201).json({ success: true, data: newBill });
    } catch (error) {
      console.error('Error creating bill:', error);
      res.status(500).json({ success: false, message: 'Failed to create bill' });
    }
  });

  app.put("/api/bills/:id", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const billIndex = data.bills.findIndex((b: any) => b.id === req.params.id);

      if (billIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const now = new Date().toISOString();
      const existingBill = data.bills[billIndex];

      // CRITICAL: Preserve payment and credit tracking
      // These fields must NEVER be lost when editing a bill
      const preservedFields = {
        id: existingBill.id,
        billNumber: existingBill.billNumber,
        createdAt: existingBill.createdAt,
        // Preserve all payment tracking
        paymentsRecorded: existingBill.paymentsRecorded || [],
        creditsApplied: existingBill.creditsApplied || [],
      };

      // Calculate total payments from payments made (via payment records)
      const paymentsMadeData = readPaymentsMadeData();
      const relatedPayments = paymentsMadeData.paymentsMade.filter((pm: any) => {
        return pm.billPayments && pm.billPayments[existingBill.id];
      });

      const totalPaymentsMade = relatedPayments.reduce((sum: number, pm: any) => {
        const billPayment = pm.billPayments[existingBill.id];
        const amount = typeof billPayment === 'number' ? billPayment : (billPayment?.amountPaid || 0);
        return sum + amount;
      }, 0);

      // Calculate total credits applied
      const totalCreditsApplied = (existingBill.creditsApplied || []).reduce(
        (sum: number, credit: any) => sum + (credit.amount || 0),
        0
      );

      // NEW BILL TOTAL from request
      const newTotal = req.body.total || existingBill.total;

      // CRITICAL CALCULATION: Balance Due = Bill Total - (Payments Made + Credits Applied)
      const totalAdjustments = totalPaymentsMade + totalCreditsApplied;
      const newBalanceDue = Math.max(0, newTotal - totalAdjustments);
      const newAmountPaid = totalAdjustments;

      // Determine status based on balance
      let newStatus = 'OPEN';
      if (newBalanceDue === 0 && newTotal > 0) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0 && newBalanceDue > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else if (req.body.status === 'VOID') {
        newStatus = 'VOID';
      }

      const updatedBill = {
        ...existingBill,
        ...req.body,
        ...preservedFields,
        // Override with recalculated values
        total: newTotal,
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
        updatedAt: now,
        activityLogs: [
          ...(existingBill.activityLogs || []),
          {
            id: String((existingBill.activityLogs?.length || 0) + 1),
            timestamp: now,
            action: 'updated',
            description: `Bill updated. New total: ₹${newTotal.toFixed(2)}, Balance due: ₹${newBalanceDue.toFixed(2)}`,
            user: req.body.updatedBy || 'Admin User'
          }
        ]
      };

      data.bills[billIndex] = updatedBill;
      writeBillsData(data);

      res.json({ success: true, data: updatedBill });
    } catch (error) {
      console.error('Bill update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update bill' });
    }
  });

  app.patch("/api/bills/:id/status", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const billIndex = data.bills.findIndex((b: any) => b.id === req.params.id);

      if (billIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const now = new Date().toISOString();
      const existingBill = data.bills[billIndex];
      const newStatus = req.body.status;

      let actionDescription = `Status changed to ${newStatus}`;
      if (newStatus === 'PAID') actionDescription = 'Bill has been paid';
      if (newStatus === 'OVERDUE') actionDescription = 'Bill is overdue';
      if (newStatus === 'VOID') actionDescription = 'Bill has been voided';

      existingBill.status = newStatus;
      existingBill.updatedAt = now;
      if (newStatus === 'PAID') {
        existingBill.amountPaid = existingBill.total;
        existingBill.balanceDue = 0;
      }
      existingBill.activityLogs = existingBill.activityLogs || [];
      existingBill.activityLogs.push({
        id: String(existingBill.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || 'Admin User'
      });

      data.bills[billIndex] = existingBill;
      writeBillsData(data);

      res.json({ success: true, data: existingBill });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update bill status' });
    }
  });

  app.post("/api/bills/:id/record-payment", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const billIndex = data.bills.findIndex((b: any) => b.id === req.params.id);

      if (billIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const now = new Date().toISOString();
      const bill = data.bills[billIndex];
      const paymentAmount = req.body.amount || 0;

      // Initialize paymentsRecorded array if not exists
      if (!bill.paymentsRecorded) {
        bill.paymentsRecorded = [];
      }

      // Track this payment
      bill.paymentsRecorded.push({
        paymentId: req.body.paymentId || `direct-${Date.now()}`,
        paymentNumber: req.body.paymentNumber || null,
        amount: paymentAmount,
        date: req.body.paymentDate || now.split('T')[0],
        mode: req.body.paymentMode || 'Manual'
      });

      // Recalculate totals
      const totalPayments = bill.paymentsRecorded.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const totalCredits = (bill.creditsApplied || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      bill.amountPaid = totalPayments + totalCredits;
      bill.balanceDue = Math.max(0, bill.total - bill.amountPaid);
      bill.status = bill.balanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      bill.updatedAt = now;
      bill.activityLogs = bill.activityLogs || [];
      bill.activityLogs.push({
        id: String(bill.activityLogs.length + 1),
        timestamp: now,
        action: 'payment',
        description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded`,
        user: req.body.recordedBy || 'Admin User'
      });

      data.bills[billIndex] = bill;
      writeBillsData(data);

      // Also create a record in Payments Made
      const paymentsMadeData = readPaymentsMadeDataGlobal();
      const paymentNumber = generatePaymentMadeNumberGlobal(paymentsMadeData.nextPaymentNumber);

      const newPayment = {
        id: `pm-${Date.now()}`,
        paymentNumber,
        vendorId: bill.vendorId,
        vendorName: bill.vendorName,
        gstTreatment: bill.gstTreatment || '',
        sourceOfSupply: bill.sourceOfSupply || '',
        destinationOfSupply: bill.destinationOfSupply || '',
        descriptionOfSupply: '',
        paymentAmount: paymentAmount,
        reverseCharge: bill.reverseCharge || false,
        tds: '',
        paymentDate: req.body.paymentDate || now.split('T')[0],
        paymentMode: req.body.paymentMode || 'Cash',
        paidThrough: req.body.paidThrough || 'Petty Cash',
        depositTo: req.body.depositTo || 'prepaid_expenses',
        reference: req.body.reference || '',
        notes: req.body.notes || `Payment for Bill #${bill.billNumber}`,
        billPayments: {
          [bill.id]: {
            billId: bill.id,
            billNumber: bill.billNumber,
            billAmount: bill.total,
            amountPaid: paymentAmount
          }
        },
        paymentType: 'bill_payment',
        paymentSource: 'record_payment', // Mark this payment as created via Record Payment
        status: 'PAID',
        createdAt: now,
        updatedAt: now
      };

      paymentsMadeData.paymentsMade.push(newPayment);
      paymentsMadeData.nextPaymentNumber++;
      writePaymentsMadeDataGlobal(paymentsMadeData);

      res.json({ success: true, data: bill, payment: newPayment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
  });

  app.delete("/api/bills/:id", (req: Request, res: Response) => {
    try {
      const data = readBillsData();
      const billIndex = data.bills.findIndex((b: any) => b.id === req.params.id);

      if (billIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      data.bills.splice(billIndex, 1);
      writeBillsData(data);

      res.json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete bill' });
    }
  });

  // Credit Notes API
  app.get("/api/credit-notes", (_req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      res.json({ success: true, data: data.creditNotes });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch credit notes" });
    }
  });

  app.get("/api/credit-notes/next-number", (_req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const nextNumber = generateCreditNoteNumber(data.nextCreditNoteNumber || 1);
      res.json({ success: true, data: nextNumber });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next credit note number" });
    }
  });

  app.get("/api/credit-notes/:id", (req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const creditNote = data.creditNotes.find((cn: any) => cn.id === req.params.id);
      if (!creditNote) {
        return res.status(404).json({ success: false, message: "Credit note not found" });
      }
      res.json({ success: true, data: creditNote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch credit note" });
    }
  });

  app.post("/api/credit-notes", (req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const now = new Date().toISOString();
      const creditNoteNumber = generateCreditNoteNumber(data.nextCreditNoteNumber || 1);

      const newCreditNote = {
        id: String(Date.now()),
        creditNoteNumber,
        referenceNumber: req.body.referenceNumber || "",
        date: req.body.date || new Date().toISOString().split('T')[0],
        customerId: req.body.customerId || "",
        customerName: req.body.customerName || "",
        invoiceId: req.body.invoiceId || "",
        invoiceNumber: req.body.invoiceNumber || "",
        reason: req.body.reason || "",
        salesperson: req.body.salesperson || "",
        subject: req.body.subject || "",
        billingAddress: req.body.billingAddress || { street: "", city: "", state: "", country: "India", pincode: "" },
        gstin: req.body.gstin || "",
        placeOfSupply: req.body.placeOfSupply || "",
        items: req.body.items || [],
        subTotal: req.body.subTotal || 0,
        shippingCharges: req.body.shippingCharges || 0,
        tdsType: req.body.tdsType || "",
        tdsAmount: req.body.tdsAmount || 0,
        cgst: req.body.cgst || 0,
        sgst: req.body.sgst || 0,
        igst: req.body.igst || 0,
        adjustment: req.body.adjustment || 0,
        total: req.body.total || 0,
        creditsRemaining: req.body.total || 0,
        customerNotes: req.body.customerNotes || "",
        termsAndConditions: req.body.termsAndConditions || "",
        status: req.body.status || "OPEN",
        pdfTemplate: req.body.pdfTemplate || "Standard Template",
        createdAt: now,
        updatedAt: now,
        createdBy: req.body.createdBy || "Admin User",
        activityLogs: [
          {
            id: "1",
            timestamp: now,
            action: "created",
            description: `Credit Note created for ₹${(req.body.total || 0).toLocaleString('en-IN')}`,
            user: req.body.createdBy || "Admin User"
          }
        ]
      };

      data.creditNotes.unshift(newCreditNote);
      data.nextCreditNoteNumber = (data.nextCreditNoteNumber || 1) + 1;
      writeCreditNotesData(data);

      res.json({ success: true, data: newCreditNote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create credit note" });
    }
  });

  app.put("/api/credit-notes/:id", (req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const index = data.creditNotes.findIndex((cn: any) => cn.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Credit note not found" });
      }

      const now = new Date().toISOString();
      const existingCreditNote = data.creditNotes[index];

      const updatedCreditNote = {
        ...existingCreditNote,
        ...req.body,
        id: existingCreditNote.id,
        creditNoteNumber: existingCreditNote.creditNoteNumber,
        createdAt: existingCreditNote.createdAt,
        updatedAt: now
      };

      updatedCreditNote.activityLogs = existingCreditNote.activityLogs || [];
      updatedCreditNote.activityLogs.push({
        id: String(updatedCreditNote.activityLogs.length + 1),
        timestamp: now,
        action: "updated",
        description: "Credit Note has been updated",
        user: req.body.updatedBy || "Admin User"
      });

      data.creditNotes[index] = updatedCreditNote;
      writeCreditNotesData(data);

      res.json({ success: true, data: updatedCreditNote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update credit note" });
    }
  });

  app.patch("/api/credit-notes/:id/status", (req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const index = data.creditNotes.findIndex((cn: any) => cn.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Credit note not found" });
      }

      const now = new Date().toISOString();
      const creditNote = data.creditNotes[index];
      const newStatus = req.body.status;

      let actionDescription = `Status changed to ${newStatus}`;
      if (newStatus === 'CLOSED') actionDescription = 'Credit Note has been closed';
      if (newStatus === 'VOID') actionDescription = 'Credit Note has been voided';

      creditNote.status = newStatus;
      creditNote.updatedAt = now;
      creditNote.activityLogs = creditNote.activityLogs || [];
      creditNote.activityLogs.push({
        id: String(creditNote.activityLogs.length + 1),
        timestamp: now,
        action: newStatus.toLowerCase(),
        description: actionDescription,
        user: req.body.updatedBy || "Admin User"
      });

      data.creditNotes[index] = creditNote;
      writeCreditNotesData(data);

      res.json({ success: true, data: creditNote });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update credit note status" });
    }
  });

  app.delete("/api/credit-notes/:id", (req: Request, res: Response) => {
    try {
      const data = readCreditNotesData();
      const index = data.creditNotes.findIndex((cn: any) => cn.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Credit note not found" });
      }

      data.creditNotes.splice(index, 1);
      writeCreditNotesData(data);

      res.json({ success: true, message: "Credit note deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete credit note" });
    }
  });

  // Salespersons API
  app.get("/api/salespersons", (_req, res) => {
    try {
      const data = readSalespersonsData();
      res.json({ success: true, data: data.salespersons });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch salespersons" });
    }
  });

  app.post("/api/salespersons", (req, res) => {
    try {
      const data = readSalespersonsData();
      const newSalesperson = {
        id: String(data.nextSalespersonId++),
        ...req.body,
        createdAt: new Date().toISOString()
      };

      data.salespersons.push(newSalesperson);
      writeSalespersonsData(data);

      res.json({ success: true, data: newSalesperson });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create salesperson" });
    }
  });

  app.delete("/api/salespersons/:id", (req, res) => {
    try {
      const data = readSalespersonsData();
      const index = data.salespersons.findIndex((s: any) => s.id === req.params.id);

      if (index !== -1) {
        data.salespersons.splice(index, 1);
        writeSalespersonsData(data);
        res.json({ success: true, message: "Salesperson deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Salesperson not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete salesperson" });
    }
  });

  // Payments Received API
  app.get("/api/payments-received", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const { customerId } = req.query;

      let payments = data.paymentsReceived;

      // Filter by customerId if provided
      if (customerId) {
        payments = payments.filter((payment: any) => payment.customerId === customerId);
      }

      res.json({ success: true, data: payments });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch payments received" });
    }
  });

  app.get("/api/payments-received/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const payment = data.paymentsReceived.find((p: any) => p.id === req.params.id);

      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments-received", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const now = new Date().toISOString();
      const paymentNumber = generatePaymentNumber(data.nextPaymentNumber);

      const newPayment = {
        id: `pr-${Date.now()}`,
        organizationId: req.headers['x-organization-id'] || "1",
        paymentNumber,
        ...req.body,
        amountInWords: numberToWords(req.body.amount || 0),
        createdAt: now,
        status: req.body.status || 'PAID'
      };

      data.paymentsReceived.push(newPayment);
      data.nextPaymentNumber++;
      writePaymentsReceivedData(data);

      // Update invoice balances if invoices are included in the payment
      if (req.body.invoices && Array.isArray(req.body.invoices)) {
        const invoicesData = readInvoicesData();
        let invoicesUpdated = false;

        req.body.invoices.forEach((paymentInvoice: any) => {
          const invoiceIndex = invoicesData.invoices.findIndex((inv: any) => inv.id === paymentInvoice.invoiceId);
          if (invoiceIndex !== -1) {
            const invoice = invoicesData.invoices[invoiceIndex];
            const currentBalance = invoice.balanceDue || invoice.total || 0;
            const newBalance = Math.max(0, currentBalance - (paymentInvoice.paymentAmount || 0));

            invoicesData.invoices[invoiceIndex] = {
              ...invoice,
              balanceDue: newBalance,
              amountPaid: (invoice.amountPaid || 0) + (paymentInvoice.paymentAmount || 0),
              status: newBalance === 0 ? 'PAID' : newBalance < (invoice.total || 0) ? 'PARTIALLY_PAID' : invoice.status,
              updatedAt: now
            };

            // Add payment record to invoice
            if (!invoice.payments) {
              invoicesData.invoices[invoiceIndex].payments = [];
            }
            invoicesData.invoices[invoiceIndex].payments.push({
              id: newPayment.id,
              date: paymentInvoice.paymentReceivedDate || req.body.date,
              amount: paymentInvoice.paymentAmount,
              paymentMode: req.body.mode || 'Cash',
              reference: req.body.referenceNumber || '',
              notes: req.body.notes || ''
            });

            invoicesUpdated = true;
          }
        });

        if (invoicesUpdated) {
          writeInvoicesData(invoicesData);
        }
      }

      res.json({ success: true, data: newPayment });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ success: false, message: "Failed to create payment" });
    }
  });

  app.put("/api/payments-received/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const index = data.paymentsReceived.findIndex((p: any) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const updatedPayment = {
        ...data.paymentsReceived[index],
        ...req.body,
        amountInWords: numberToWords(req.body.amount || data.paymentsReceived[index].amount),
        updatedAt: new Date().toISOString()
      };

      data.paymentsReceived[index] = updatedPayment;
      writePaymentsReceivedData(data);

      res.json({ success: true, data: updatedPayment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update payment" });
    }
  });

  app.delete("/api/payments-received/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const index = data.paymentsReceived.findIndex((p: any) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      data.paymentsReceived.splice(index, 1);
      writePaymentsReceivedData(data);

      res.json({ success: true, message: "Payment deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete payment" });
    }
  });

  app.patch("/api/payments-received/:id/refund", (req: Request, res: Response) => {
    try {
      const data = readPaymentsReceivedData();
      const index = data.paymentsReceived.findIndex((p: any) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const payment = data.paymentsReceived[index];
      const refundAmount = req.body.refundAmount || payment.amount;
      const now = new Date().toISOString();

      payment.status = 'REFUNDED';
      payment.refundedAt = now;
      payment.refundAmount = refundAmount;

      data.paymentsReceived[index] = payment;
      writePaymentsReceivedData(data);

      // Also update linked invoices if any
      if (payment.invoices && payment.invoices.length > 0) {
        const invoicesData = readInvoicesData();

        payment.invoices.forEach((paymentInvoice: any) => {
          const invoiceIndex = invoicesData.invoices.findIndex((inv: any) => inv.id === paymentInvoice.invoiceId);
          if (invoiceIndex !== -1) {
            const invoice = invoicesData.invoices[invoiceIndex];

            // Initialize refunds array if not exists
            if (!invoice.refunds) {
              invoice.refunds = [];
            }

            // Add refund record
            invoice.refunds.push({
              id: `ref-${Date.now()}`,
              paymentId: payment.id,
              paymentNumber: payment.paymentNumber,
              amount: paymentInvoice.paymentAmount || refundAmount,
              date: now,
              reason: req.body.reason || 'Payment refunded'
            });

            // Update amounts
            invoice.amountRefunded = (invoice.amountRefunded || 0) + (paymentInvoice.paymentAmount || refundAmount);
            invoice.amountPaid = Math.max(0, (invoice.amountPaid || 0) - (paymentInvoice.paymentAmount || refundAmount));
            invoice.balanceDue = invoice.total - invoice.amountPaid;

            // Update status
            if (invoice.balanceDue >= invoice.total) {
              invoice.status = 'SENT';
            } else if (invoice.balanceDue > 0) {
              invoice.status = 'PARTIALLY_PAID';
            }

            invoice.updatedAt = now;
            invoice.activityLogs = invoice.activityLogs || [];
            invoice.activityLogs.push({
              id: String(invoice.activityLogs.length + 1),
              timestamp: now,
              action: 'refund_recorded',
              description: `Refund of ₹${(paymentInvoice.paymentAmount || refundAmount).toLocaleString('en-IN')} recorded from Payment #${payment.paymentNumber}`,
              user: req.body.refundedBy || 'Admin User'
            });

            invoicesData.invoices[invoiceIndex] = invoice;
          }
        });

        writeInvoicesData(invoicesData);
      }

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to refund payment" });
    }
  });

  // Refund from invoice - creates refund record and updates payment
  app.post("/api/invoices/:id/refund", (req: Request, res: Response) => {
    try {
      const invoicesData = readInvoicesData();
      const invoiceIndex = invoicesData.invoices.findIndex((i: any) => i.id === req.params.id);

      if (invoiceIndex === -1) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const invoice = invoicesData.invoices[invoiceIndex];
      const refundAmount = req.body.amount || 0;
      const now = new Date().toISOString();

      // Validate refund amount
      if (refundAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Refund amount must be greater than 0' });
      }

      if (refundAmount > (invoice.amountPaid || 0)) {
        return res.status(400).json({ success: false, message: 'Refund amount cannot exceed amount paid' });
      }

      // Initialize refunds array if not exists
      if (!invoice.refunds) {
        invoice.refunds = [];
      }

      // Add refund record
      const refundId = `ref-${Date.now()}`;
      invoice.refunds.push({
        id: refundId,
        paymentId: req.body.paymentId || null,
        paymentNumber: req.body.paymentNumber || null,
        amount: refundAmount,
        date: now,
        reason: req.body.reason || 'Refund processed',
        mode: req.body.mode || 'Cash'
      });

      // Update amounts
      invoice.amountRefunded = (invoice.amountRefunded || 0) + refundAmount;
      invoice.amountPaid = Math.max(0, (invoice.amountPaid || 0) - refundAmount);
      invoice.balanceDue = invoice.total - invoice.amountPaid;

      // Update status
      if (invoice.balanceDue >= invoice.total) {
        invoice.status = 'SENT';
      } else if (invoice.balanceDue > 0) {
        invoice.status = 'PARTIALLY_PAID';
      }

      invoice.updatedAt = now;
      invoice.activityLogs = invoice.activityLogs || [];
      invoice.activityLogs.push({
        id: String(invoice.activityLogs.length + 1),
        timestamp: now,
        action: 'refund_recorded',
        description: `Refund of ₹${refundAmount.toLocaleString('en-IN')} processed`,
        user: req.body.refundedBy || 'Admin User'
      });

      invoicesData.invoices[invoiceIndex] = invoice;
      writeInvoicesData(invoicesData);

      // Also update linked payment if paymentId is provided
      if (req.body.paymentId) {
        const paymentsData = readPaymentsReceivedData();
        const paymentIndex = paymentsData.paymentsReceived.findIndex((p: any) => p.id === req.body.paymentId);

        if (paymentIndex !== -1) {
          const payment = paymentsData.paymentsReceived[paymentIndex];
          payment.status = 'REFUNDED';
          payment.refundedAt = now;
          payment.refundAmount = (payment.refundAmount || 0) + refundAmount;

          paymentsData.paymentsReceived[paymentIndex] = payment;
          writePaymentsReceivedData(paymentsData);
        }
      }

      // Create a new payment record for the refund in Payments Received
      const paymentsData = readPaymentsReceivedData();
      const refundPayment = {
        id: `pr-ref-${Date.now()}`,
        paymentNumber: `REF-${generatePaymentNumber(paymentsData.nextPaymentNumber)}`,
        date: now.split('T')[0],
        referenceNumber: '',
        customerId: invoice.customerId || '',
        customerName: invoice.customerName || '',
        customerEmail: invoice.customerEmail || '',
        invoices: [{
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.date,
          invoiceAmount: invoice.total,
          refundAmount: refundAmount
        }],
        mode: req.body.mode || 'Cash',
        depositTo: 'Petty Cash',
        amount: -refundAmount,
        unusedAmount: 0,
        bankCharges: 0,
        tax: '',
        taxAmount: 0,
        notes: req.body.reason || `Refund for ${invoice.invoiceNumber}`,
        attachments: [],
        sendThankYou: false,
        status: 'REFUNDED',
        paymentType: 'refund',
        placeOfSupply: invoice.placeOfSupply || '',
        descriptionOfSupply: '',
        amountInWords: `Refund: ${numberToWords(refundAmount)}`,
        journalEntries: [],
        createdAt: now,
        isRefund: true,
        originalInvoiceId: invoice.id
      };

      paymentsData.paymentsReceived.push(refundPayment);
      paymentsData.nextPaymentNumber++;
      writePaymentsReceivedData(paymentsData);

      res.json({ success: true, data: invoice, refundPayment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to process refund' });
    }
  });

  // Get unpaid invoices for a customer
  app.get("/api/customers/:customerId/unpaid-invoices", (req: Request, res: Response) => {
    try {
      const invoicesData = readInvoicesData();
      const unpaidInvoices = invoicesData.invoices
        .filter((inv: any) =>
          inv.customerId === req.params.customerId &&
          inv.status !== 'PAID' &&
          (inv.balanceDue > 0 || 0)
        )
        .map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          date: inv.date,
          amount: inv.total || inv.amount || 0,
          balanceDue: inv.balanceDue || inv.total || 0,
          status: inv.status
        }));

      res.json({ success: true, data: unpaidInvoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch unpaid invoices" });
    }
  });

  // E-Way Bills Routes
  app.get("/api/eway-bills", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const { transactionType, status, period } = req.query;

      let filteredBills = data.ewayBills || [];

      if (transactionType && transactionType !== 'all') {
        filteredBills = filteredBills.filter((bill: any) => bill.documentType === transactionType);
      }

      if (status && status !== 'all') {
        filteredBills = filteredBills.filter((bill: any) => bill.status === status);
      }

      if (period && period !== 'all') {
        const now = new Date();
        let startDate = new Date();

        switch (period) {
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        filteredBills = filteredBills.filter((bill: any) =>
          new Date(bill.date) >= startDate
        );
      }

      res.json({ success: true, data: filteredBills });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch e-way bills" });
    }
  });

  app.get("/api/eway-bills/next-number", (_req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const nextNumber = generateEWayBillNumber(data.nextEWayBillNumber);
      res.json({ success: true, data: { nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next e-way bill number" });
    }
  });

  app.get("/api/eway-bills/:id", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const ewayBill = data.ewayBills.find((b: any) => b.id === req.params.id);

      if (!ewayBill) {
        return res.status(404).json({ success: false, message: "E-Way Bill not found" });
      }

      res.json({ success: true, data: ewayBill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch e-way bill" });
    }
  });

  app.post("/api/eway-bills", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const now = new Date().toISOString();
      const ewayBillNumber = generateEWayBillNumber(data.nextEWayBillNumber);

      // Calculate expiry date (15 days from now for most cases)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      const newEWayBill = {
        id: `ewb-${Date.now()}`,
        ewayBillNumber,
        documentType: req.body.documentType || 'invoices',
        transactionSubType: req.body.transactionSubType || 'supply',
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        customerGstin: req.body.customerGstin || '',
        documentNumber: req.body.documentNumber,
        documentId: req.body.documentId,
        date: req.body.date || now.split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        transactionType: req.body.transactionType || 'regular',
        dispatchFrom: req.body.dispatchFrom || {},
        billFrom: req.body.billFrom || {},
        billTo: req.body.billTo || {},
        shipTo: req.body.shipTo || {},
        placeOfDelivery: req.body.placeOfDelivery || '',
        transporter: req.body.transporter || '',
        distance: req.body.distance || 0,
        modeOfTransportation: req.body.modeOfTransportation || 'road',
        vehicleType: req.body.vehicleType || 'regular',
        vehicleNo: req.body.vehicleNo || '',
        transporterDocNo: req.body.transporterDocNo || '',
        transporterDocDate: req.body.transporterDocDate || '',
        items: req.body.items || [],
        total: req.body.total || 0,
        status: req.body.status || 'NOT_GENERATED',
        createdAt: now,
        updatedAt: now
      };

      data.ewayBills.push(newEWayBill);
      data.nextEWayBillNumber++;
      writeEWayBillsData(data);

      res.json({ success: true, data: newEWayBill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create e-way bill" });
    }
  });

  app.put("/api/eway-bills/:id", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const index = data.ewayBills.findIndex((b: any) => b.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "E-Way Bill not found" });
      }

      const updatedEWayBill = {
        ...data.ewayBills[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      data.ewayBills[index] = updatedEWayBill;
      writeEWayBillsData(data);

      res.json({ success: true, data: updatedEWayBill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update e-way bill" });
    }
  });

  app.patch("/api/eway-bills/:id/generate", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const index = data.ewayBills.findIndex((b: any) => b.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "E-Way Bill not found" });
      }

      const ewayBill = data.ewayBills[index];
      ewayBill.status = 'GENERATED';
      ewayBill.generatedAt = new Date().toISOString();

      // Set expiry date to 15 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);
      ewayBill.expiryDate = expiryDate.toISOString().split('T')[0];

      data.ewayBills[index] = ewayBill;
      writeEWayBillsData(data);

      res.json({ success: true, data: ewayBill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to generate e-way bill" });
    }
  });

  app.patch("/api/eway-bills/:id/cancel", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const index = data.ewayBills.findIndex((b: any) => b.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "E-Way Bill not found" });
      }

      const ewayBill = data.ewayBills[index];
      ewayBill.status = 'CANCELLED';
      ewayBill.cancelledAt = new Date().toISOString();
      ewayBill.cancelReason = req.body.reason || '';

      data.ewayBills[index] = ewayBill;
      writeEWayBillsData(data);

      res.json({ success: true, data: ewayBill });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to cancel e-way bill" });
    }
  });

  app.delete("/api/eway-bills/:id", (req: Request, res: Response) => {
    try {
      const data = readEWayBillsData();
      const index = data.ewayBills.findIndex((b: any) => b.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "E-Way Bill not found" });
      }

      data.ewayBills.splice(index, 1);
      writeEWayBillsData(data);

      res.json({ success: true, message: "E-Way Bill deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete e-way bill" });
    }
  });

  // Get pending invoices for e-way bill generation
  app.get("/api/eway-bills/pending-invoices", (_req: Request, res: Response) => {
    try {
      const invoicesData = readInvoicesData();
      const ewayBillsData = readEWayBillsData();

      // Get invoice IDs that already have e-way bills
      const invoicesWithEWayBills = new Set(
        ewayBillsData.ewayBills
          .filter((b: any) => b.documentType === 'invoices')
          .map((b: any) => b.documentId)
      );

      // Filter invoices that don't have e-way bills yet
      const pendingInvoices = invoicesData.invoices.filter((inv: any) =>
        !invoicesWithEWayBills.has(inv.id) &&
        inv.status !== 'DRAFT' &&
        inv.status !== 'CANCELLED'
      );

      res.json({ success: true, data: pendingInvoices });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch pending invoices" });
    }
  });

  // Get pending credit notes for e-way bill generation
  app.get("/api/eway-bills/pending-credit-notes", (_req: Request, res: Response) => {
    try {
      const creditNotesData = readCreditNotesData();
      const ewayBillsData = readEWayBillsData();

      // Get credit note IDs that already have e-way bills
      const creditNotesWithEWayBills = new Set(
        ewayBillsData.ewayBills
          .filter((b: any) => b.documentType === 'credit_notes')
          .map((b: any) => b.documentId)
      );

      // Filter credit notes that don't have e-way bills yet
      const pendingCreditNotes = creditNotesData.creditNotes.filter((cn: any) =>
        !creditNotesWithEWayBills.has(cn.id) &&
        cn.status !== 'DRAFT' &&
        cn.status !== 'CANCELLED'
      );

      res.json({ success: true, data: pendingCreditNotes });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch pending credit notes" });
    }
  });

  // Get pending delivery challans for e-way bill generation
  app.get("/api/eway-bills/pending-delivery-challans", (_req: Request, res: Response) => {
    try {
      const deliveryChallansData = readDeliveryChallansData();
      const ewayBillsData = readEWayBillsData();

      // Get delivery challan IDs that already have e-way bills
      const challansWithEWayBills = new Set(
        ewayBillsData.ewayBills
          .filter((b: any) => b.documentType === 'delivery_challans')
          .map((b: any) => b.documentId)
      );

      // Filter delivery challans that don't have e-way bills yet
      const pendingChallans = deliveryChallansData.deliveryChallans.filter((dc: any) =>
        !challansWithEWayBills.has(dc.id) &&
        dc.status !== 'DRAFT' &&
        dc.status !== 'CANCELLED'
      );

      res.json({ success: true, data: pendingChallans });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch pending delivery challans" });
    }
  });

  // ========== PAYMENTS MADE API ==========
  const PAYMENTS_MADE_FILE = path.join(DATA_DIR, "paymentsMade.json");

  function readPaymentsMadeData() {
    ensureDataDir();
    if (!fs.existsSync(PAYMENTS_MADE_FILE)) {
      const defaultData = { paymentsMade: [], nextPaymentNumber: 1 };
      fs.writeFileSync(PAYMENTS_MADE_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(fs.readFileSync(PAYMENTS_MADE_FILE, "utf-8"));
  }

  function writePaymentsMadeData(data: any) {
    ensureDataDir();
    fs.writeFileSync(PAYMENTS_MADE_FILE, JSON.stringify(data, null, 2));
  }

  function generatePaymentMadeNumber(num: number): string {
    return `PM-${String(num).padStart(5, '0')}`;
  }

  app.get("/api/payments-made", (_req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      res.json({ success: true, data: data.paymentsMade || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch payments made" });
    }
  });

  app.get("/api/payments-made/next-number", (_req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      const nextNumber = generatePaymentMadeNumber(data.nextPaymentNumber);
      res.json({ success: true, data: { nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next payment number" });
    }
  });

  app.get("/api/payments-made/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      const payment = data.paymentsMade.find((p: any) => p.id === req.params.id);

      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      res.json({ success: true, data: payment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments-made", (req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      const now = new Date().toISOString();

      // Always generate payment number server-side to avoid corrupted data
      const paymentNumber = generatePaymentMadeNumber(data.nextPaymentNumber);

      // Handle both 'amount' and 'paymentAmount' field names
      const paymentAmount = req.body.paymentAmount || req.body.amount || 0;

      const newPayment = {
        id: `pm-${Date.now()}`,
        organizationId: req.headers['x-organization-id'] || "1",
        paymentNumber,
        vendorId: req.body.vendorId,
        vendorName: req.body.vendorName,
        gstTreatment: req.body.gstTreatment || '',
        sourceOfSupply: req.body.sourceOfSupply || '',
        destinationOfSupply: req.body.destinationOfSupply || '',
        descriptionOfSupply: req.body.descriptionOfSupply || '',
        paymentAmount: paymentAmount,
        reverseCharge: req.body.reverseCharge || false,
        tds: req.body.tds || '',
        paymentDate: req.body.paymentDate || now.split('T')[0],
        paymentMode: req.body.paymentMode || 'Cash',
        paidThrough: req.body.paidThrough || 'Petty Cash',
        depositTo: req.body.depositTo || 'prepaid_expenses',
        reference: req.body.reference || '',
        notes: req.body.notes || '',
        billPayments: req.body.billPayments || {},
        paymentType: req.body.paymentType || 'bill_payment',
        status: req.body.status || 'PAID',
        createdAt: now,
        updatedAt: now
      };

      data.paymentsMade.push(newPayment);
      data.nextPaymentNumber++;
      writePaymentsMadeData(data);

      // CRITICAL FIX: Update bills after payment is recorded
      // This ensures balanceDue and amountPaid are updated correctly
      try {
        const billsData = readBillsData();
        const billPayments = req.body.billPayments || {};

        // Build enriched billPayments object for storage (with bill details)
        const enrichedBillPayments: Record<string, any> = {};

        // Update each bill that received a payment
        billsData.bills = billsData.bills.map((bill: any) => {
          const billPaymentEntry = billPayments[bill.id];

          // Handle both formats:
          // 1. Frontend format: { payment: 298, paymentMadeOn: "..." }
          // 2. Direct amount format: number (for backwards compatibility)
          let paymentAmount = 0;
          if (billPaymentEntry) {
            if (typeof billPaymentEntry === 'number') {
              paymentAmount = billPaymentEntry;
            } else if (typeof billPaymentEntry === 'object' && billPaymentEntry.payment !== undefined) {
              paymentAmount = Number(billPaymentEntry.payment) || 0;
            } else if (typeof billPaymentEntry === 'object' && billPaymentEntry.amountPaid !== undefined) {
              paymentAmount = Number(billPaymentEntry.amountPaid) || 0;
            }
          }

          if (paymentAmount > 0) {
            // Update bill's amountPaid and balanceDue
            const newAmountPaid = (bill.amountPaid || 0) + paymentAmount;
            const newBalanceDue = Math.max(0, (bill.total || 0) - newAmountPaid);

            // Determine new status based on balanceDue
            let newStatus = 'OPEN';
            if (newBalanceDue === 0) {
              newStatus = 'PAID';
            } else if (newAmountPaid > 0 && newBalanceDue > 0) {
              newStatus = 'PARTIALLY_PAID';
            }

            // Build enriched bill payment entry for storage
            enrichedBillPayments[bill.id] = {
              billId: bill.id,
              billNumber: bill.billNumber,
              billAmount: bill.total,
              amountPaid: paymentAmount
            };

            // Add activity log for this payment
            const activityLog = {
              id: String(Date.now()),
              timestamp: now,
              action: 'payment',
              description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded via ${newPayment.paymentNumber}`,
              user: 'System'
            };

            return {
              ...bill,
              amountPaid: newAmountPaid,
              balanceDue: newBalanceDue,
              status: newStatus,
              updatedAt: now,
              activityLogs: [...(bill.activityLogs || []), activityLog]
            };
          }
          return bill;
        });

        writeBillsData(billsData);

        // Update the stored payment with enriched billPayments (includes bill details)
        if (Object.keys(enrichedBillPayments).length > 0) {
          newPayment.billPayments = enrichedBillPayments;
          // Re-write payments data with enriched billPayments
          data.paymentsMade[data.paymentsMade.length - 1] = newPayment;
          writePaymentsMadeData(data);
        }
      } catch (billError) {
        console.error("Warning: Could not update bills after payment", billError);
        // Don't fail the payment if bill update fails, but log the error
      }

      res.json({ success: true, data: newPayment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create payment" });
    }
  });

  app.put("/api/payments-made/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      const index = data.paymentsMade.findIndex((p: any) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const updatedPayment = {
        ...data.paymentsMade[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      data.paymentsMade[index] = updatedPayment;
      writePaymentsMadeData(data);

      res.json({ success: true, data: updatedPayment });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update payment" });
    }
  });

  app.delete("/api/payments-made/:id", (req: Request, res: Response) => {
    try {
      const data = readPaymentsMadeData();
      const index = data.paymentsMade.findIndex((p: any) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const paymentToDelete = data.paymentsMade[index];

      // CRITICAL: Prevent deletion of payments linked to bills
      if (paymentToDelete.billPayments && Object.keys(paymentToDelete.billPayments).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete payment that is linked to bills. Please remove bill allocations first or void the payment instead."
        });
      }

      const deletedPayment = data.paymentsMade[index];
      const now = new Date().toISOString();

      // Reverse the bill payment allocations before deleting
      if (deletedPayment.billPayments && Object.keys(deletedPayment.billPayments).length > 0) {
        try {
          const billsData = readBillsData();

          billsData.bills = billsData.bills.map((bill: any) => {
            const billPaymentEntry = deletedPayment.billPayments[bill.id];
            if (!billPaymentEntry) return bill;

            // Get the payment amount that was allocated to this bill
            let paymentAmount = 0;
            if (typeof billPaymentEntry === 'number') {
              paymentAmount = billPaymentEntry;
            } else if (typeof billPaymentEntry === 'object' && billPaymentEntry.amountPaid !== undefined) {
              paymentAmount = Number(billPaymentEntry.amountPaid) || 0;
            } else if (typeof billPaymentEntry === 'object' && billPaymentEntry.payment !== undefined) {
              paymentAmount = Number(billPaymentEntry.payment) || 0;
            }

            if (paymentAmount > 0) {
              // Reverse the payment: decrease amountPaid, increase balanceDue
              const newAmountPaid = Math.max(0, (bill.amountPaid || 0) - paymentAmount);
              const newBalanceDue = (bill.total || 0) - newAmountPaid;

              // Determine new status based on balanceDue
              let newStatus = 'OPEN';
              if (newBalanceDue === 0) {
                newStatus = 'PAID';
              } else if (newAmountPaid > 0 && newBalanceDue > 0) {
                newStatus = 'PARTIALLY_PAID';
              }

              // Add activity log for payment reversal
              const activityLog = {
                id: String(Date.now()),
                timestamp: now,
                action: 'payment_reversed',
                description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} reversed (${deletedPayment.paymentNumber} deleted)`,
                user: 'System'
              };

              return {
                ...bill,
                amountPaid: newAmountPaid,
                balanceDue: newBalanceDue,
                status: newStatus,
                updatedAt: now,
                activityLogs: [...(bill.activityLogs || []), activityLog]
              };
            }
            return bill;
          });

          writeBillsData(billsData);
        } catch (billError) {
          console.error("Warning: Could not reverse bill payments on delete", billError);
        }
      }

      data.paymentsMade.splice(index, 1);
      writePaymentsMadeData(data);

      res.json({ success: true, message: "Payment deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete payment" });
    }
  });

  // ========== VENDOR BILL ITEMS API ==========
  app.get("/api/vendors/:id/bill-items", (req: Request, res: Response) => {
    try {
      const vendorId = req.params.id;
      const billsData = readBillsData();

      // Filter bills by vendorId with balanceDue > 0
      const vendorBills = billsData.bills.filter((b: any) => {
        const balance = b.balanceDue !== undefined ? b.balanceDue : (b.total || 0);
        return b.vendorId === vendorId && balance > 0;
      });

      // Extract all items from those bills, including bill reference info
      const billItems: any[] = [];
      vendorBills.forEach((bill: any) => {
        if (bill.items && bill.items.length > 0) {
          bill.items.forEach((item: any) => {
            billItems.push({
              ...item,
              billId: bill.id,
              billNumber: bill.billNumber,
              billDate: bill.billDate,
              balanceDue: bill.balanceDue || bill.total || 0,
              billTotal: bill.total || 0
            });
          });
        }
      });

      res.json({ success: true, data: billItems });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch bill items for vendor" });
    }
  });

  // ========== VENDOR CREDITS API ==========
  const VENDOR_CREDITS_FILE = path.join(DATA_DIR, "vendorCredits.json");

  function readVendorCreditsData() {
    ensureDataDir();
    if (!fs.existsSync(VENDOR_CREDITS_FILE)) {
      const defaultData = { vendorCredits: [], nextCreditNumber: 1 };
      fs.writeFileSync(VENDOR_CREDITS_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(fs.readFileSync(VENDOR_CREDITS_FILE, "utf-8"));
  }

  function writeVendorCreditsData(data: any) {
    ensureDataDir();
    fs.writeFileSync(VENDOR_CREDITS_FILE, JSON.stringify(data, null, 2));
  }

  function generateVendorCreditNumber(num: number): string {
    return `VC-${String(num).padStart(5, '0')}`;
  }

  app.get("/api/vendor-credits", (_req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      res.json({ success: true, data: data.vendorCredits || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch vendor credits" });
    }
  });

  app.get("/api/vendor-credits/next-number", (_req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      const nextNumber = generateVendorCreditNumber(data.nextCreditNumber);
      res.json({ success: true, data: { nextNumber } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get next credit number" });
    }
  });

  app.get("/api/vendor-credits/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      const credit = data.vendorCredits.find((c: any) => c.id === req.params.id);

      if (!credit) {
        return res.status(404).json({ success: false, message: "Vendor credit not found" });
      }

      res.json({ success: true, data: credit });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch vendor credit" });
    }
  });

  app.post("/api/vendor-credits", (req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      const now = new Date().toISOString();
      const creditNumber = req.body.creditNoteNumber || generateVendorCreditNumber(data.nextCreditNumber);

      // Collect unique bill IDs from items to update their balanceDue
      const billIdsToUpdate = new Set<string>();
      const creditAmountByBill: { [billId: string]: number } = {};

      (req.body.items || []).forEach((item: any) => {
        if (item.billId) {
          billIdsToUpdate.add(item.billId);
          if (!creditAmountByBill[item.billId]) {
            creditAmountByBill[item.billId] = 0;
          }
          creditAmountByBill[item.billId] += item.amount || 0;
        }
      });

      const newCredit = {
        id: `vc-${Date.now()}`,
        creditNumber,
        referenceNumber: req.body.orderNumber || req.body.referenceNumber || '',
        vendorId: req.body.vendorId,
        vendorName: req.body.vendorName,
        orderNumber: req.body.orderNumber || '',
        date: req.body.vendorCreditDate || now.split('T')[0],
        subject: req.body.subject || '',
        reverseCharge: req.body.reverseCharge || false,
        taxType: req.body.taxType || 'tds',
        tdsTcs: req.body.tdsTcs || '',
        items: (req.body.items || []).map((item: any) => ({
          ...item,
          hsnSac: item.hsnSac || '',
          rate: item.rate?.toString() || '0',
        })),
        subTotal: req.body.subTotal || 0,
        discountType: req.body.discountType || 'percentage',
        discountValue: req.body.discountValue || '',
        discountAmount: req.body.discountAmount || 0,
        cgst: req.body.cgst || 0,
        sgst: req.body.sgst || 0,
        igst: req.body.igst || 0,
        tdsTcsAmount: req.body.tdsTcsAmount || 0,
        adjustment: req.body.adjustment || 0,
        amount: req.body.total || 0,
        balance: req.body.total || 0,
        notes: req.body.notes || '',
        status: req.body.status || 'OPEN',
        createdAt: now,
        updatedAt: now
      };

      // Update vendor credit in main storage
      data.vendorCredits.push(newCredit);
      data.nextCreditNumber++;
      writeVendorCreditsData(data);

      // Update bill balanceDue for each bill referenced in items
      if (billIdsToUpdate.size > 0) {
        try {
          const billsData = readBillsData();
          billIdsToUpdate.forEach((billId: string) => {
            const billIndex = billsData.bills.findIndex((b: any) => b.id === billId);
            if (billIndex !== -1) {
              const creditAmount = creditAmountByBill[billId] || 0;
              billsData.bills[billIndex].balanceDue = Math.max(0, (billsData.bills[billIndex].balanceDue || billsData.bills[billIndex].total || 0) - creditAmount);
              billsData.bills[billIndex].updatedAt = now;
            }
          });
          writeBillsData(billsData);
        } catch (billError) {
          console.error("Warning: Could not update bill balances for vendor credits:", billError);
        }
      }

      res.json({ success: true, data: newCredit });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create vendor credit" });
    }
  });

  app.put("/api/vendor-credits/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      const index = data.vendorCredits.findIndex((c: any) => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor credit not found" });
      }

      const updatedCredit = {
        ...data.vendorCredits[index],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      data.vendorCredits[index] = updatedCredit;
      writeVendorCreditsData(data);

      res.json({ success: true, data: updatedCredit });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update vendor credit" });
    }
  });

  // Apply vendor credits to bills - ENHANCED WITH ZOHO BOOKS BEHAVIOR
  app.post("/api/vendor-credits/:id/apply-to-bills", (req: Request, res: Response) => {
    try {
      const creditId = req.params.id;
      const { creditsToApply, appliedDate } = req.body;

      // Load vendor credits data
      const creditsData = readVendorCreditsData();
      const creditIndex = creditsData.vendorCredits.findIndex((c: any) => c.id === creditId);

      if (creditIndex === -1) {
        return res.status(404).json({ success: false, message: "Vendor credit not found" });
      }

      const vendorCredit = creditsData.vendorCredits[creditIndex];

      // Load bills data
      const billsData = readBillsData();

      // Calculate total credits to apply
      const totalCreditsToApply = Object.values(creditsToApply).reduce((sum: number, amt: any) => sum + amt, 0);

      // Validate: ensure we don't exceed available credit balance
      const availableBalance = vendorCredit.balance || vendorCredit.amount;
      if (totalCreditsToApply > availableBalance) {
        return res.status(400).json({
          success: false,
          message: `Total credits to apply (₹${totalCreditsToApply}) exceeds available balance (₹${availableBalance})`
        });
      }

      let updatedBillsCount = 0;
      const now = new Date().toISOString();

      // Apply credits to each bill
      for (const [billId, creditAmount] of Object.entries(creditsToApply)) {
        const amount = creditAmount as number;
        if (amount <= 0) continue;

        const billIndex = billsData.bills.findIndex((b: any) => b.id === billId);
        if (billIndex === -1) continue;

        const bill = billsData.bills[billIndex];

        // Validate: Must be same vendor
        if (bill.vendorId !== vendorCredit.vendorId) {
          return res.status(400).json({
            success: false,
            message: `Cannot apply credit to bill ${bill.billNumber} - different vendor`
          });
        }

        // Validate: Bill must have balance due
        if (bill.balanceDue <= 0) {
          return res.status(400).json({
            success: false,
            message: `Bill ${bill.billNumber} has no balance due`
          });
        }

        // Validate: Credit amount cannot exceed bill balance or available credit
        if (amount > bill.balanceDue) {
          return res.status(400).json({
            success: false,
            message: `Credit amount (₹${amount}) exceeds balance due (₹${bill.balanceDue}) for bill ${bill.billNumber}`
          });
        }

        // Initialize creditsApplied array if it doesn't exist
        if (!bill.creditsApplied) {
          bill.creditsApplied = [];
        }

        // Add credit application record to bill
        bill.creditsApplied.push({
          creditId: vendorCredit.id,
          creditNumber: vendorCredit.creditNumber,
          amount: amount,
          appliedDate: appliedDate || now.split('T')[0]
        });

        // CRITICAL CALCULATION: Recalculate totals from all sources
        const totalPayments = (bill.paymentsRecorded || []).reduce(
          (sum: number, p: any) => sum + (p.amount || 0), 0
        );
        const totalCredits = bill.creditsApplied.reduce(
          (sum: number, c: any) => sum + (c.amount || 0), 0
        );

        bill.amountPaid = totalPayments + totalCredits;
        bill.balanceDue = Math.max(0, bill.total - bill.amountPaid);

        // Update bill status based on balance
        if (bill.balanceDue === 0) {
          bill.status = 'PAID';
        } else if (bill.amountPaid > 0 && bill.balanceDue > 0) {
          bill.status = 'PARTIALLY_PAID';
        }

        bill.updatedAt = now;

        // Add activity log
        bill.activityLogs = bill.activityLogs || [];
        bill.activityLogs.push({
          id: String(bill.activityLogs.length + 1),
          timestamp: now,
          action: 'credit_applied',
          description: `Vendor Credit ${vendorCredit.creditNumber} applied: ₹${amount.toFixed(2)}`,
          user: 'Admin User'
        });

        billsData.bills[billIndex] = bill;
        updatedBillsCount++;
      }

      // Update vendor credit balance and status
      vendorCredit.balance = (vendorCredit.balance || vendorCredit.amount) - totalCreditsToApply;

      // CRITICAL: Status logic
      if (vendorCredit.balance <= 0) {
        vendorCredit.status = 'CLOSED';
        vendorCredit.balance = 0;
      } else {
        vendorCredit.status = 'OPEN';
      }

      vendorCredit.updatedAt = now;

      // Save both files
      creditsData.vendorCredits[creditIndex] = vendorCredit;
      writeVendorCreditsData(creditsData);
      writeBillsData(billsData);

      res.json({
        success: true,
        data: vendorCredit,
        message: `Credits applied to ${updatedBillsCount} bill(s). Remaining balance: ₹${vendorCredit.balance.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error applying credits to bills:', error);
      res.status(500).json({ success: false, message: "Failed to apply credits to bills" });
    }
  });

  app.delete("/api/vendor-credits/:id", (req: Request, res: Response) => {
    try {
      const data = readVendorCreditsData();
      const index = data.vendorCredits.findIndex((c: any) => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Vendor credit not found" });
      }

      const vendorCredit = data.vendorCredits[index];

      // CRITICAL: Prevent deletion of vendor credits that have been applied
      const hasBeenApplied = (vendorCredit.balance !== undefined && vendorCredit.balance < vendorCredit.amount) ||
        vendorCredit.status === 'CLOSED';

      if (hasBeenApplied) {
        // Check if any bills have this credit applied
        try {
          const billsData = readBillsData();
          const billsWithCredit = billsData.bills.filter((bill: any) => {
            return bill.creditsApplied?.some((credit: any) => credit.creditId === vendorCredit.id);
          });

          if (billsWithCredit.length > 0) {
            return res.status(400).json({
              success: false,
              message: `Cannot delete vendor credit that has been applied to ${billsWithCredit.length} bill(s). Please remove credit allocations first or void the credit instead.`
            });
          }
        } catch (billError) {
          console.error("Error checking bills:", billError);
        }
      }

      data.vendorCredits.splice(index, 1);
      writeVendorCreditsData(data);

      res.json({ success: true, message: "Vendor credit deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete vendor credit" });
    }
  });

  // Transporters API Routes
  function readTransporters() {
    ensureDataDir();
    if (!fs.existsSync(TRANSPORTERS_FILE)) {
      fs.writeFileSync(TRANSPORTERS_FILE, JSON.stringify({ transporters: [] }, null, 2));
      return [];
    }
    const data = JSON.parse(fs.readFileSync(TRANSPORTERS_FILE, "utf-8"));
    return data.transporters || [];
  }

  function writeTransporters(transporters: any[]) {
    ensureDataDir();
    fs.writeFileSync(TRANSPORTERS_FILE, JSON.stringify({ transporters }, null, 2));
  }

  app.get("/api/transporters", (req: Request, res: Response) => {
    try {
      const transporters = readTransporters();
      res.json({ success: true, data: transporters });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch transporters" });
    }
  });

  app.post("/api/transporters", (req: Request, res: Response) => {
    try {
      const { name, transporterId } = req.body;

      if (!name || !transporterId) {
        return res.status(400).json({ success: false, message: "Name and transporterId are required" });
      }

      const transporters = readTransporters();
      const newTransporter = {
        id: `transporter-${Date.now()}`,
        name: name.trim(),
        transporterId: transporterId.trim(),
      };

      transporters.push(newTransporter);
      writeTransporters(transporters);

      res.json({ success: true, data: newTransporter });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create transporter" });
    }
  });

  app.get("/api/transporters/:id", (req: Request, res: Response) => {
    try {
      const transporters = readTransporters();
      const transporter = transporters.find((t: any) => t.id === req.params.id);

      if (!transporter) {
        return res.status(404).json({ success: false, message: "Transporter not found" });
      }

      res.json({ success: true, data: transporter });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch transporter" });
    }
  });

  app.put("/api/transporters/:id", (req: Request, res: Response) => {
    try {
      const transporters = readTransporters();
      const index = transporters.findIndex((t: any) => t.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Transporter not found" });
      }

      const updatedTransporter = {
        ...transporters[index],
        ...req.body,
      };

      transporters[index] = updatedTransporter;
      writeTransporters(transporters);

      res.json({ success: true, data: updatedTransporter });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update transporter" });
    }
  });

  app.delete("/api/transporters/:id", (req: Request, res: Response) => {
    try {
      const transporters = readTransporters();
      const index = transporters.findIndex((t: any) => t.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: "Transporter not found" });
      }

      transporters.splice(index, 1);
      writeTransporters(transporters);

      res.json({ success: true, message: "Transporter deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete transporter" });
    }
  });

  // Organization Branding Routes
  const BRANDING_FILE = path.join(DATA_DIR, "organizationBranding.json");

  function readBranding() {
    ensureDataDir();
    if (!fs.existsSync(BRANDING_FILE)) {
      const defaultBranding = { id: "default", logo: null, signature: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      fs.writeFileSync(BRANDING_FILE, JSON.stringify(defaultBranding, null, 2));
      return defaultBranding;
    }
    const data = JSON.parse(fs.readFileSync(BRANDING_FILE, "utf-8"));
    return data;
  }

  function writeBranding(branding: any) {
    ensureDataDir();
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(branding, null, 2));
  }

  app.get("/api/branding", (req: Request, res: Response) => {
    try {
      const branding = readBranding();
      res.json({ success: true, data: branding });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch branding settings" });
    }
  });

  app.post("/api/branding/logo", (req: Request, res: Response) => {
    try {
      const { logoBase64, fileName, fileSize } = req.body;

      if (!logoBase64 || !fileName) {
        return res.status(400).json({ success: false, message: "Logo data and filename are required" });
      }

      const maxSize = 1024 * 1024; // 1MB
      if (fileSize > maxSize) {
        return res.status(400).json({ success: false, message: "File size exceeds 1MB limit" });
      }

      const supportedFormats = ["jpg", "jpeg", "png", "gif", "bmp"];
      const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
      if (!supportedFormats.includes(fileExt)) {
        return res.status(400).json({ success: false, message: "Unsupported file format" });
      }

      const uploadsDir = path.join(__dirname, "uploads", "logos");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const newFileName = `logo-${timestamp}.${fileExt}`;
      const filePath = path.join(uploadsDir, newFileName);

      const buffer = Buffer.from(logoBase64, "base64");
      fs.writeFileSync(filePath, buffer);

      const branding = readBranding();
      branding.logo = {
        url: `/uploads/logos/${newFileName}`,
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        fileSize: fileSize
      };
      branding.updatedAt = new Date().toISOString();
      writeBranding(branding);

      res.json({ success: true, data: branding });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to upload logo" });
    }
  });

  app.delete("/api/branding/logo", (req: Request, res: Response) => {
    try {
      const branding = readBranding();

      if (branding.logo && branding.logo.url) {
        const filePath = path.join(__dirname, branding.logo.url.replace("/uploads/logos/", "uploads/logos/"));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      branding.logo = null;
      branding.updatedAt = new Date().toISOString();
      writeBranding(branding);

      res.json({ success: true, data: branding });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete logo" });
    }
  });

  app.post("/api/branding/signature", (req: Request, res: Response) => {
    try {
      const { signatureBase64, fileName, fileSize } = req.body;

      if (!signatureBase64 || !fileName) {
        return res.status(400).json({ success: false, message: "Signature data and filename are required" });
      }

      const maxSize = 1024 * 1024; // 1MB
      if (fileSize > maxSize) {
        return res.status(400).json({ success: false, message: "File size exceeds 1MB limit" });
      }

      const supportedFormats = ["jpg", "jpeg", "png", "gif", "bmp"];
      const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
      if (!supportedFormats.includes(fileExt)) {
        return res.status(400).json({ success: false, message: "Unsupported file format" });
      }

      const uploadsDir = path.join(__dirname, "uploads", "signatures");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const newFileName = `signature-${timestamp}.${fileExt}`;
      const filePath = path.join(uploadsDir, newFileName);

      const buffer = Buffer.from(signatureBase64, "base64");
      fs.writeFileSync(filePath, buffer);

      const branding = readBranding();
      branding.signature = {
        url: `/uploads/signatures/${newFileName}`,
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        fileSize: fileSize
      };
      branding.updatedAt = new Date().toISOString();
      writeBranding(branding);

      res.json({ success: true, data: branding });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to upload signature" });
    }
  });

  app.delete("/api/branding/signature", (req: Request, res: Response) => {
    try {
      const branding = readBranding();

      if (branding.signature && branding.signature.url) {
        const filePath = path.join(__dirname, branding.signature.url.replace("/uploads/signatures/", "uploads/signatures/"));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      branding.signature = null;
      branding.updatedAt = new Date().toISOString();
      writeBranding(branding);

      res.json({ success: true, data: branding });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete signature" });
    }
  });

  // Serve uploaded logos as static files
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use("/uploads", (req: Request, res: Response, next) => {
    try {
      const filePath = path.join(uploadsDir, req.path.slice(1));

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "File not found" });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const ext = (filePath.split(".").pop() || "").toLowerCase();
      const mimeTypes: any = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        bmp: "image/bmp"
      };

      // Support both logos and signatures
      const pathLower = filePath.toLowerCase();

      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(fileBuffer);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to serve file" });
    }
  });

  return httpServer;
}
