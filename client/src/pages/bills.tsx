import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Plus,
  Search,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Mail,
  FileText,
  Printer,
  Filter,
  Download,
  Eye,
  Check,
  List,
  Grid3X3,
  CreditCard,
  Copy,
  Clock,
  BookOpen,
  Ban,
  Upload,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BillItem {
  id: string;
  itemName: string;
  description?: string;
  account: string;
  quantity: number;
  rate: number;
  tax?: string;
  taxAmount?: number;
  customerDetails?: string;
  amount: number;
}

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface Bill {
  id: string;
  billNumber: string;
  orderNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    gstin?: string;
  };
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  reverseCharge?: boolean;
  subject?: string;
  items: BillItem[];
  subTotal: number;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  taxType?: string;
  taxCategory?: string;
  taxAmount?: number;
  adjustment?: number;
  adjustmentDescription?: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  attachments?: string[];
  status: string;
  pdfTemplate?: string;
  journalEntries?: JournalEntry[];
  createdAt?: string;
  creditsApplied?: Array<{
    creditId: string;
    creditNumber: string;
    amount: number;
    appliedDate: string;
  }>;
  paymentsRecorded?: Array<{
    paymentId: string;
    paymentNumber?: string;
    amount: number;
    date: string;
    mode?: string;
  }>;
  paymentsMadeApplied?: Array<{
    paymentId: string;
    paymentNumber?: string;
    amount: number;
    date: string;
    mode?: string;
  }>;
}

function getPaymentStatus(bill: Bill): string {
  if (bill.balanceDue === 0 && bill.total > 0) {
    return "PAID";
  } else if (bill.balanceDue > 0 && bill.balanceDue < bill.total) {
    return "PARTIALLY PAID";
  } else if (bill.status === "VOID") {
    return "VOID";
  } else if (bill.status === "OVERDUE") {
    return "OVERDUE";
  }
  return bill.status || "OPEN";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function BillPDFView({ bill, branding, organization }: { bill: Bill; branding?: any; organization?: Organization }) {
  const paymentStatus = getPaymentStatus(bill);

  return (
    <div className="max-w-4xl mx-auto shadow-lg bg-white">
      <div
        className="bg-white border border-slate-200"
        id="bill-pdf-content"
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
        }}
      >
        <div className="p-8 pt-12">
          <PurchasePDFHeader
            logo={branding?.logo}
            documentTitle="BILL"
            documentNumber={bill.billNumber}
            date={bill.billDate}
            organization={organization}
          />

          {/* Remaining Header Section - To Be Removed Later */}
          <div className="flex justify-between items-start mb-12" style={{ display: 'none' }}>
            <div className="flex flex-col gap-1">
              {branding?.logo?.url ? (
                <img
                  src={branding.logo.url}
                  alt="Company Logo"
                  className="h-12 w-auto mb-2 object-contain self-start"
                  data-testid="img-bill-logo"
                />
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center"
                    style={{ backgroundColor: "#1e293b" }}
                  >
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span
                    className="text-xl font-bold tracking-tight"
                    style={{ color: "#0f172a" }}
                  >
                    SKILLTON IT
                  </span>
                </div>
              )}
              <div
                className="text-[13px] leading-relaxed"
                style={{ color: "#475569" }}
              >
                <p>Hinjewadi - Wakad road</p>
                <p>Hinjewadi</p>
                <p>Pune Maharashtra 411057</p>
                <p>India</p>
                <p>GSTIN 27AZCPA5145K1ZH</p>
                <p>Sales.SkilltonIT@skilltonit.com</p>
                <p>www.skilltonit.com</p>
              </div>
            </div>
            <div className="text-right">
              <h1
                className="text-4xl font-light mb-1 tracking-tight"
                style={{ color: "#0f172a" }}
              >
                BILL
              </h1>
              <p className="font-medium mb-4" style={{ color: "#475569" }}>
                Bill# {bill.billNumber}
              </p>
              <div className="mt-4">
                <p
                  className="text-[13px] font-medium uppercase tracking-wider mb-1"
                  style={{ color: "#64748b" }}
                >
                  Balance Due
                </p>
                <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                  {formatCurrency(bill.balanceDue)}
                </p>
              </div>
            </div>
          </div>

          {/* Bill From & Details Section */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
              <h4
                className="text-[13px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "#94a3b8" }}
              >
                Bill From
              </h4>
              <div
                className="text-[14px] leading-relaxed"
                style={{ color: "#334155" }}
              >
                <p
                  className="font-bold mb-1 uppercase"
                  style={{ color: "#0f172a" }}
                >
                  {bill.vendorName}
                </p>
                {bill.vendorAddress && (
                  <>
                    {bill.vendorAddress.street1 && (
                      <p>{bill.vendorAddress.street1}</p>
                    )}
                    {bill.vendorAddress.street2 && (
                      <p>{bill.vendorAddress.street2}</p>
                    )}
                    <p>
                      {bill.vendorAddress.city &&
                        `${bill.vendorAddress.city}${bill.vendorAddress.state ? ", " : ""}`}
                      {bill.vendorAddress.state}
                    </p>
                    {bill.vendorAddress.pinCode && (
                      <p>{bill.vendorAddress.pinCode}</p>
                    )}
                    {bill.vendorAddress.country && (
                      <p>{bill.vendorAddress.country}</p>
                    )}
                    {bill.vendorAddress.gstin && (
                      <p
                        className="mt-1 font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        GSTIN {bill.vendorAddress.gstin}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
                <div className="font-medium" style={{ color: "#64748b" }}>
                  Bill Date :
                </div>
                <div
                  className="font-medium text-right"
                  style={{ color: "#0f172a" }}
                >
                  {formatDate(bill.billDate)}
                </div>

                <div className="font-medium" style={{ color: "#64748b" }}>
                  Due Date :
                </div>
                <div
                  className="font-medium text-right"
                  style={{ color: "#0f172a" }}
                >
                  {formatDate(bill.dueDate)}
                </div>

                <div className="font-medium" style={{ color: "#64748b" }}>
                  Terms :
                </div>
                <div
                  className="font-medium text-right"
                  style={{ color: "#0f172a" }}
                >
                  {bill.paymentTerms || "Due on Receipt"}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr
                className="text-white border-b-2"
                style={{ backgroundColor: "#1e293b", borderColor: "#0f172a" }}
              >
                <th
                  className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider w-12"
                  style={{ color: "#ffffff" }}
                >
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff" }}
                >
                  Item & Description
                </th>
                <th
                  className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff" }}
                >
                  HSN/SAC
                </th>
                <th
                  className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff" }}
                >
                  Qty
                </th>
                <th
                  className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff" }}
                >
                  Rate
                </th>
                <th
                  className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff" }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <td
                    className="px-4 py-4 text-[14px] align-top"
                    style={{ color: "#334155" }}
                  >
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p
                      className="font-semibold text-[14px]"
                      style={{ color: "#0f172a" }}
                    >
                      {item.itemName}
                    </p>
                    {item.description && (
                      <p
                        className="text-[13px] mt-1 leading-relaxed"
                        style={{ color: "#64748b" }}
                      >
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td
                    className="px-4 py-4 text-center text-[14px] align-top"
                    style={{ color: "#334155" }}
                  >
                    998315
                  </td>
                  <td
                    className="px-4 py-4 text-center text-[14px] align-top"
                    style={{ color: "#334155" }}
                  >
                    {item.quantity.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[14px] align-top"
                    style={{ color: "#334155" }}
                  >
                    {item.rate.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[14px] font-semibold align-top"
                    style={{ color: "#0f172a" }}
                  >
                    {item.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-12">
            <div className="w-72 space-y-4">
              <div
                className="flex justify-between text-[14px] font-medium pr-2"
                style={{ color: "#475569" }}
              >
                <span>Sub Total</span>
                <span style={{ color: "#0f172a" }}>
                  {bill.subTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {bill.taxAmount && bill.taxAmount > 0 && (
                <div
                  className="flex justify-between text-[14px] font-medium pr-2"
                  style={{ color: "#475569" }}
                >
                  <span>IGST18 (18%)</span>
                  <span style={{ color: "#0f172a" }}>
                    {bill.taxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between text-[16px] font-bold pr-2 pt-2 border-t"
                style={{ color: "#0f172a", borderColor: "#f1f5f9" }}
              >
                <span>Total</span>
                <span>{formatCurrency(bill.total)}</span>
              </div>

              {bill.paymentsMadeApplied &&
                bill.paymentsMadeApplied.length > 0 && (
                  <div
                    className="flex justify-between text-[14px] font-semibold pr-2"
                    style={{ color: "#dc2626" }}
                  >
                    <span>Payments Made</span>
                    <span>
                      (-){" "}
                      {bill.paymentsMadeApplied
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

              <div
                className="flex justify-between items-center p-3 rounded-sm text-[16px] font-bold border-l-4"
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#0f172a",
                  borderLeftColor: "#1e293b",
                }}
              >
                <span>Balance Due</span>
                <span>{formatCurrency(bill.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-20 px-8">
            <div className="w-1/2">
              <div className="relative">
                {branding?.signature?.url ? (
                  <div className="mb-2">
                    <img
                      src={branding.signature.url}
                      alt="Authorized Signature"
                      className="max-h-16 w-auto object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <div className="h-16 mb-2"></div>
                )}
                <div
                  className="border-t-2 w-full pt-2"
                  style={{ borderColor: "#0f172a" }}
                >
                  <p
                    className="text-[13px] font-bold"
                    style={{ color: "#0f172a" }}
                  >
                    Authorized Signature
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Number (Visual only for PDF match) */}
          <div
            className="mt-16 text-right border-t pt-4 px-8 pb-8"
            style={{ borderColor: "#f1f5f9" }}
          >
            <span className="text-[12px]" style={{ color: "#94a3b8" }}>
              1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillDetailView({ bill }: { bill: Bill }) {
  const paymentStatus = getPaymentStatus(bill);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">BILL</h2>
          <p className="text-slate-600">
            Bill# <span className="font-semibold">{bill.billNumber}</span>
          </p>
          <Badge
            className={`mt-2 ${paymentStatus === "PAID"
              ? "bg-green-500 text-white"
              : paymentStatus === "PARTIALLY PAID"
                ? "bg-amber-500 text-white"
                : paymentStatus === "OVERDUE"
                  ? "bg-red-500 text-white"
                  : paymentStatus === "VOID"
                    ? "bg-slate-500 text-white"
                    : "bg-blue-500 text-white"
              }`}
          >
            {paymentStatus}
          </Badge>
        </div>
        <div className="text-right">
          <h4 className="text-sm text-slate-500">VENDOR ADDRESS</h4>
          <p className="font-semibold text-blue-600">{bill.vendorName}</p>
          {bill.vendorAddress && (
            <div className="text-sm text-slate-600 mt-1">
              {bill.vendorAddress.street1 && (
                <p>{bill.vendorAddress.street1}</p>
              )}
              <p>
                {bill.vendorAddress.city}, {bill.vendorAddress.state}
              </p>
              <p>
                {bill.vendorAddress.country} - {bill.vendorAddress.pinCode}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm border-t border-b py-4">
        <div>
          <span className="text-slate-500 uppercase text-xs">Bill Date</span>
          <p className="font-medium">{formatDate(bill.billDate)}</p>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-xs">Due Date</span>
          <p className="font-medium">{formatDate(bill.dueDate)}</p>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-xs">
            Payment Terms
          </span>
          <p className="font-medium">{bill.paymentTerms}</p>
        </div>
        <div className="col-span-3">
          <span className="text-slate-500 uppercase text-xs">Total</span>
          <p className="font-bold text-lg">{formatCurrency(bill.total)}</p>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs">ITEMS & DESCRIPTION</TableHead>
              <TableHead className="text-xs">ACCOUNT</TableHead>
              <TableHead className="text-xs text-center">QUANTITY</TableHead>
              <TableHead className="text-xs text-right">RATE</TableHead>
              <TableHead className="text-xs text-right">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-blue-600">{item.itemName}</TableCell>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {item.rate.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {item.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Sub Total</span>
            <span>{formatCurrency(bill.subTotal)}</span>
          </div>
          {bill.discountAmount && bill.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-pink-600">
              <span>Discount</span>
              <span>(-){formatCurrency(bill.discountAmount)}</span>
            </div>
          )}
          {bill.taxAmount && bill.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">IGST18 (18%)</span>
              <span>{formatCurrency(bill.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(bill.total)}</span>
          </div>
          {bill.creditsApplied && bill.creditsApplied.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Credits Applied:
              </p>
              {bill.creditsApplied.map((credit, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-green-600"
                >
                  <span>Credit {credit.creditNumber}</span>
                  <span>- {formatCurrency(credit.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {bill.paymentsMadeApplied && bill.paymentsMadeApplied.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Payment Made:
              </p>
              {bill.paymentsMadeApplied.map((payment, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-blue-600"
                >
                  <span>
                    Payment {payment.paymentNumber || payment.paymentId}
                  </span>
                  <span>- {formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {bill.paymentsRecorded && bill.paymentsRecorded.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">
                Record Payment:
              </p>
              {bill.paymentsRecorded.map((payment, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-purple-600"
                >
                  <span>
                    Payment {payment.paymentNumber || payment.paymentId}
                  </span>
                  <span>- {formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between bg-blue-50 p-2 rounded font-semibold">
            <span>Balance Due</span>
            <span>{formatCurrency(bill.balanceDue)}</span>
          </div>
        </div>
      </div>

      {bill.journalEntries && bill.journalEntries.length > 0 && (
        <div className="border-t pt-4">
          <Tabs defaultValue="journal">
            <TabsList>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>
            <TabsContent value="journal">
              <p className="text-xs text-slate-500 mb-2">
                Amount is displayed in your base currency{" "}
                <Badge variant="outline" className="text-xs">
                  INR
                </Badge>
              </p>
              <h4 className="font-semibold mb-2">Bill</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ACCOUNT</TableHead>
                    <TableHead className="text-xs text-right">DEBIT</TableHead>
                    <TableHead className="text-xs text-right">CREDIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.journalEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.account}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function BillDetailPanel({
  bill,
  branding,
  organization,
  onClose,
  onEdit,
  onDelete,
  onMarkPaid,
  onRecordPayment,
  onVoid,
  onClone,
  onCreateVendorCredits,
  onViewJournal,
  onExpectedPaymentDate,
}: {
  bill: Bill;
  branding?: any;
  organization?: Organization;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onRecordPayment: () => void;
  onVoid: () => void;
  onClone: () => void;
  onCreateVendorCredits: () => void;
  onViewJournal: () => void;
  onExpectedPaymentDate: () => void;
}) {
  const [showPdfView, setShowPdfView] = useState(true);

  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await generatePDFFromElement("bill-pdf-content", `Bill-${bill.billNumber}.pdf`);
      toast({ title: "Success", description: "Bill downloaded successfully." });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    }
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint("bill-pdf-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2
          className="text-lg font-semibold text-slate-900"
          data-testid="text-bill-number"
        >
          {bill.billNumber}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 overflow-x-auto bg-white">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onEdit}
          data-testid="button-edit-bill"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              PDF/Print
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {bill.balanceDue > 0 && bill.status !== "VOID" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onRecordPayment}
            data-testid="button-record-payment"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Record Payment
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              data-testid="button-more-actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowPdfView(!showPdfView)}>
              <Eye className="mr-2 h-4 w-4" />
              {showPdfView ? "View Details" : "View PDF"}
            </DropdownMenuItem>
            {bill.status !== "VOID" && (
              <DropdownMenuItem onClick={onVoid} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                Void
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onExpectedPaymentDate}>
              <Clock className="mr-2 h-4 w-4" />
              Expected Payment Date
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClone}>
              <Copy className="mr-2 h-4 w-4" />
              Clone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateVendorCredits}>
              <CreditCard className="mr-2 h-4 w-4" />
              Create Vendor Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewJournal}>
              <BookOpen className="mr-2 h-4 w-4" />
              View Journal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor="pdf-view" className="text-sm text-slate-500">
            Show PDF View
          </Label>
          <Switch
            id="pdf-view"
            checked={showPdfView}
            onCheckedChange={setShowPdfView}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {showPdfView ? (
          <BillPDFView bill={bill} branding={branding} />
        ) : (
          <BillDetailView bill={bill} />
        )}
      </div>

      <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
        PDF Template:{" "}
        <span className="text-blue-600">
          {bill.pdfTemplate || "Standard Template"}
        </span>
        <button className="text-blue-600 ml-2">Change</button>
      </div>
    </div>
  );
}

// Record Payment Dialog Component
function RecordPaymentDialog({
  isOpen,
  onClose,
  bill,
  onPaymentRecorded,
}: {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPaymentRecorded: () => void;
}) {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentNumber, setPaymentNumber] = useState("1");
  const [paymentMadeOn, setPaymentMadeOn] = useState("");
  const [paidThrough, setPaidThrough] = useState("Petty Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && bill) {
      setPaymentAmount(String(bill.balanceDue || 0));
      setPaymentDate(new Date().toISOString().split("T")[0]);
      fetchNextPaymentNumber();
    }
  }, [isOpen, bill]);

  const fetchNextPaymentNumber = async () => {
    try {
      const response = await fetch("/api/payments-made/next-number");
      if (response.ok) {
        const data = await response.json();
        setPaymentNumber(data.data?.nextNumber || "1");
      }
    } catch (error) {
      console.error("Failed to fetch next payment number:", error);
    }
  };

  const incrementPaymentNumber = () => {
    const num = parseInt(paymentNumber) || 0;
    setPaymentNumber(String(num + 1));
  };

  const handleSave = async (status: "DRAFT" | "PAID") => {
    if (!bill) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    if (amount > (bill.balanceDue || 0)) {
      toast({
        title: "Payment amount cannot exceed balance due",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Record payment on the bill - this also creates a payment in Payments Made
      const billResponse = await fetch(`/api/bills/${bill.id}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMode,
          paymentDate,
          paymentNumber,
          paymentMadeOn,
          paidThrough,
          reference,
          notes,
          status,
          sendNotification,
        }),
      });

      if (!billResponse.ok) {
        throw new Error("Failed to record payment");
      }

      toast({
        title:
          status === "DRAFT"
            ? "Payment saved as draft"
            : "Payment recorded successfully",
      });
      onPaymentRecorded();
      onClose();
      resetForm();
    } catch (error) {
      toast({ title: "Failed to record payment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount("");
    setPaymentMode("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNumber("1");
    setPaymentMadeOn("");
    setPaidThrough("Petty Cash");
    setReference("");
    setNotes("");
    setSendNotification(false);
  };

  if (!bill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-semibold"
            data-testid="text-payment-title"
          >
            Payment for {bill.billNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-red-600">
              Payment Made <span className="text-red-500">*</span>(INR)
            </Label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}

              className="max-w-xs"
              data-testid="input-payment-amount"
            />
          </div>

          {/* Info Message */}

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger
                className="max-w-xs"
                data-testid="select-payment-mode"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="NEFT">NEFT</SelectItem>
                <SelectItem value="RTGS">RTGS</SelectItem>
                <SelectItem value="IMPS">IMPS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date and Payment # */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Payment Date<span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                data-testid="input-payment-date"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Payment #<span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="flex-1"
                  data-testid="input-payment-number"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementPaymentNumber}
                  title="Generate next number"
                  data-testid="button-next-payment-number"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Made On, Paid Through, Reference */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Made on</Label>
              <Input
                type="date"
                value={paymentMadeOn}
                onChange={(e) => setPaymentMadeOn(e.target.value)}
                placeholder="dd/MM/yyyy"
                data-testid="input-payment-made-on"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">
                Paid Through<span className="text-red-500">*</span>
              </Label>
              <Select value={paidThrough} onValueChange={setPaidThrough}>
                <SelectTrigger data-testid="select-paid-through">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petty Cash">Petty Cash</SelectItem>
                  <SelectItem value="Undeposited Funds">
                    Undeposited Funds
                  </SelectItem>
                  <SelectItem value="Bank Account">Bank Account</SelectItem>
                  <SelectItem value="Prepaid Expenses">
                    Prepaid Expenses
                  </SelectItem>
                  <SelectItem value="Accounts Payable">
                    Accounts Payable
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference#</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                data-testid="input-reference"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="input-notes"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="button-upload-file"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Upload from Computer</DropdownMenuItem>
                  <DropdownMenuItem>Attach from Cloud</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-slate-500 mt-1">
                You can upload a maximum of 5 files, 10MB each
              </p>
            </div>
          </div>

          {/* Email Notification */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="send-notification"
              checked={sendNotification}
              onCheckedChange={(checked) =>
                setSendNotification(checked === true)
              }
              data-testid="checkbox-send-notification"
            />
            <Label
              htmlFor="send-notification"
              className="text-sm cursor-pointer"
            >
              Send a Payment Made email notification.
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleSave("DRAFT")}
              disabled={isSubmitting}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("PAID")}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-paid"
            >
              Save as Paid
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Bills() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "table">("table");
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [expectedPaymentDateDialogOpen, setExpectedPaymentDateDialogOpen] =
    useState(false);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("");
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [branding, setBranding] = useState<any>(null);

  // Use organization context instead of local state
  const { currentOrganization: organization } = useOrganization();

  useEffect(() => {
    fetchBills();
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/branding");
      const data = await response.json();
      if (data.success) {
        setBranding(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/bills");
      if (response.ok) {
        const data = await response.json();
        setBills(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/bills/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBill(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bill detail:", error);
    }
  };

  const handleBillClick = (bill: Bill) => {
    fetchBillDetail(bill.id);
  };

  const handleClosePanel = () => {
    setSelectedBill(null);
  };

  const handleEditBill = () => {
    if (selectedBill) {
      setLocation(`/bills/${selectedBill.id}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!billToDelete) return;
    try {
      const response = await fetch(`/api/bills/${billToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Bill deleted successfully" });
        fetchBills();
        if (selectedBill?.id === billToDelete) {
          handleClosePanel();
        }
      }
    } catch (error) {
      toast({ title: "Failed to delete bill", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (response.ok) {
        toast({ title: "Bill marked as paid" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({ title: "Failed to update bill status", variant: "destructive" });
    }
  };

  const handleRecordPayment = () => {
    setRecordPaymentDialogOpen(true);
  };

  const handlePaymentRecorded = () => {
    fetchBills();
    if (selectedBill) {
      fetchBillDetail(selectedBill.id);
    }
  };

  const handleVoid = async () => {
    if (!selectedBill) return;
    setVoidDialogOpen(true);
  };

  const confirmVoid = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VOID" }),
      });
      if (response.ok) {
        toast({ title: "Bill has been voided" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({ title: "Failed to void bill", variant: "destructive" });
    } finally {
      setVoidDialogOpen(false);
    }
  };

  const handleClone = () => {
    if (selectedBill) {
      setLocation(`/bills/new?clone=${selectedBill.id}`);
    }
  };

  const handleCreateVendorCredits = () => {
    if (selectedBill) {
      setLocation(
        `/vendor-credits/new?billId=${selectedBill.id}&vendorId=${selectedBill.vendorId}`,
      );
    }
  };

  const handleViewJournal = () => {
    setJournalDialogOpen(true);
  };

  const handleExpectedPaymentDate = () => {
    if (selectedBill) {
      setExpectedPaymentDate(selectedBill.dueDate || "");
      setExpectedPaymentDateDialogOpen(true);
    }
  };

  const confirmExpectedPaymentDate = async () => {
    if (!selectedBill) return;
    try {
      const response = await fetch(`/api/bills/${selectedBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selectedBill, expectedPaymentDate }),
      });
      if (response.ok) {
        toast({ title: "Expected payment date updated" });
        fetchBills();
        fetchBillDetail(selectedBill.id);
      }
    } catch (error) {
      toast({
        title: "Failed to update expected payment date",
        variant: "destructive",
      });
    } finally {
      setExpectedPaymentDateDialogOpen(false);
    }
  };

  const toggleSelectBill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedBills.includes(id)) {
      setSelectedBills(selectedBills.filter((i) => i !== id));
    } else {
      setSelectedBills([...selectedBills, id]);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginationResult = usePagination<Bill>(filteredBills, 10);
  const { currentPage, totalPages, totalItems, itemsPerPage, goToPage } =
    paginationResult;
  const paginatedItems: Bill[] = paginationResult.paginatedItems;

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50"
          >
            PAID
          </Badge>
        );
      case "OPEN":
        return (
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 bg-blue-50"
          >
            OPEN
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 bg-red-50"
          >
            OVERDUE
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            PARTIALLY PAID
          </Badge>
        );
      case "VOID":
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200">
            VOID
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="bills-layout">
        <ResizablePanel
          defaultSize={selectedBill ? 25 : 100}
          minSize={20}
          className="flex flex-col overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors"
                    >
                      {activeFilter === "All" ? "All Bills" : `${activeFilter} Bills`}
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setActiveFilter("All")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Open")}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Paid")}>
                      Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Overdue")}>
                      Overdue
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Partially Paid")}>
                      Partially Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Void")}>
                      Void
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-sm text-slate-400">({bills.length})</span>
              </div>

              <div className="relative flex-1 max-w-[240px] hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-bills"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLocation("/bills/new")}
                className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9"
                data-testid="button-new-bill"
              >
                <Plus className="h-4 w-4" /> New Bill
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 bg-white sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
                data-testid="input-search-mobile"
              />
            </div>
          </div>



          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 overflow-auto relative">

              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Loading bills...
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No bills found</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Create your first bill to get started"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setLocation("/bills/new")}
                      className="gap-2"
                      data-testid="button-create-first-bill"
                    >
                      <Plus className="h-4 w-4" /> Create New Bill
                    </Button>
                  )}
                </div>
              ) : selectedBill ? (
                <div className="flex flex-col h-full bg-white">
                  {paginatedItems.map((bill: Bill) => {
                    const paymentStatus = getPaymentStatus(bill);
                    const isOverdue = bill.status === "OVERDUE" || (bill.balanceDue > 0 && new Date(bill.dueDate) < new Date());
                    const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 3600 * 24)) : 0;

                    return (
                      <div
                        key={bill.id}
                        onClick={() => handleBillClick(bill)}
                        className={`group flex items-start gap-3 p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 relative ${selectedBill?.id === bill.id ? "bg-blue-50/50" : ""
                          }`}
                        data-testid={`card-bill-${bill.id}`}
                      >
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedBills.includes(bill.id)}
                            onCheckedChange={() => {
                              if (selectedBills.includes(bill.id)) {
                                setSelectedBills(selectedBills.filter((i) => i !== bill.id));
                              } else {
                                setSelectedBills([...selectedBills, bill.id]);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[14px] text-slate-900 truncate uppercase">
                              {bill.vendorName}
                            </h3>
                            <span className="font-semibold text-[14px] text-slate-900 whitespace-nowrap">
                              {formatCurrency(bill.total)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                            <span>{bill.billNumber}</span>
                            <span className="text-slate-300">•</span>
                            <span>{formatDate(bill.billDate)}</span>
                          </div>
                          <div className="pt-1">
                            {paymentStatus === "PAID" ? (
                              <span className="text-[11px] font-bold text-green-600 tracking-wider">PAID</span>
                            ) : isOverdue ? (
                              <span className="text-[11px] font-bold text-orange-500 tracking-wider">
                                OVERDUE BY {daysOverdue} DAYS
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-blue-600 tracking-wider">OPEN</span>
                            )}
                          </div>
                        </div>
                        {selectedBill?.id === bill.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-xs">DATE</TableHead>
                      <TableHead className="text-xs">BILL#</TableHead>
                      <TableHead className="text-xs">REFERENCE NUMBER</TableHead>
                      <TableHead className="text-xs">VENDOR NAME</TableHead>
                      <TableHead className="text-xs">STATUS</TableHead>
                      <TableHead className="text-xs">DUE DATE</TableHead>
                      <TableHead className="text-xs text-right">AMOUNT</TableHead>
                      <TableHead className="text-xs text-right">
                        BALANCE DUE
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((bill: any) => (
                      <TableRow
                        key={bill.id}
                        onClick={() => handleBillClick(bill)}
                        className={`cursor-pointer hover-elevate ${selectedBill?.id === bill.id ? "bg-blue-50" : ""}`}
                        data-testid={`row-bill-${bill.id}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedBills.includes(bill.id)}
                            onClick={(e) => toggleSelectBill(bill.id, e)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(bill.billDate)}
                        </TableCell>
                        <TableCell className="text-sm text-blue-600 font-medium">
                          {bill.billNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {bill.orderNumber || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{bill.vendorName}</TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(bill.dueDate)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatCurrency(bill.total)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatCurrency(bill.balanceDue)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/bills/${bill.id}/edit`);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(bill.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            {filteredBills.length > 0 && (
              <div className="flex-none border-t border-slate-200 bg-white">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </div>

        </ResizablePanel >

        {selectedBill && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
              <BillDetailPanel
                bill={selectedBill}
                branding={branding}
                organization={organization || undefined}
                onClose={handleClosePanel}
                onEdit={handleEditBill}
                onDelete={() => handleDelete(selectedBill.id)}
                onMarkPaid={handleMarkPaid}
                onRecordPayment={handleRecordPayment}
                onVoid={handleVoid}
                onClone={handleClone}
                onCreateVendorCredits={handleCreateVendorCredits}
                onViewJournal={handleViewJournal}
                onExpectedPaymentDate={handleExpectedPaymentDate}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup >

      {/* Record Payment Dialog */}
      < RecordPaymentDialog
        isOpen={recordPaymentDialogOpen}
        onClose={() => setRecordPaymentDialogOpen(false)}
        bill={selectedBill}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* Delete Bill Dialog */}
      < AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      {/* Void Bill Dialog */}
      < AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this bill? This will cancel the bill
              and it cannot be used for any transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVoid}
              className="bg-red-600 hover:bg-red-700"
            >
              Void Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      {/* Expected Payment Date Dialog */}
      < Dialog
        open={expectedPaymentDateDialogOpen}
        onOpenChange={setExpectedPaymentDateDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expected Payment Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Expected Payment Date</Label>
              <Input
                type="date"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
                data-testid="input-expected-payment-date"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExpectedPaymentDateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmExpectedPaymentDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* View Journal Dialog */}
      < Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen} >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Entries</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-xs text-slate-500 mb-2">
              Amount is displayed in your base currency{" "}
              <Badge variant="outline" className="text-xs">
                INR
              </Badge>
            </p>
            {selectedBill && (
              <>
                <h4 className="font-semibold mb-2">
                  Bill - {selectedBill.billNumber}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ACCOUNT</TableHead>
                      <TableHead className="text-xs text-right">
                        DEBIT
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        CREDIT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.journalEntries &&
                      selectedBill.journalEntries.length > 0 ? (
                      selectedBill.journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.account}</TableCell>
                          <TableCell className="text-right">
                            {entry.debit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.credit.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        <TableRow>
                          <TableCell>Purchases</TableCell>
                          <TableCell className="text-right">
                            {selectedBill.subTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">0.00</TableCell>
                        </TableRow>
                        {selectedBill.taxAmount &&
                          selectedBill.taxAmount > 0 && (
                            <TableRow>
                              <TableCell>Input Tax Credits (IGST)</TableCell>
                              <TableCell className="text-right">
                                {selectedBill.taxAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">0.00</TableCell>
                            </TableRow>
                          )}
                        <TableRow>
                          <TableCell>Accounts Payable</TableCell>
                          <TableCell className="text-right">0.00</TableCell>
                          <TableCell className="text-right">
                            {selectedBill.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setJournalDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >
    </div >
  );
}