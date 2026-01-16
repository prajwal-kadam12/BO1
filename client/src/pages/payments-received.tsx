import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Plus, Search, ChevronDown, MoreHorizontal, Pencil, Trash2,
  X, Send, FileText, Printer, Download, RefreshCw, Eye,
  Check, Filter
} from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { UnifiedPaymentReceipt } from "@/components/UnifiedPaymentReceipt";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface PaymentReceived {
  id: string;
  paymentNumber: string;
  date: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  invoices: any[];
  mode: string;
  depositTo: string;
  amount: number;
  unusedAmount: number;
  bankCharges: number;
  tax: string;
  taxAmount: number;
  notes: string;
  attachments: string[];
  sendThankYou: boolean;
  status: string;
  paymentType: string;
  placeOfSupply: string;
  descriptionOfSupply: string;
  amountInWords: string;
  journalEntries: JournalEntry[];
  createdAt: string;
}

interface Customer {
  id: string;
  displayName: string;
  companyName: string;
  email: string;
  pan?: string;
  gstin?: string;
  gstTreatment?: string;
  placeOfSupply?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  balanceDue: number;
  status: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Wrapper component that uses the unified receipt for consistent rendering
function PaymentReceiptView({ payment, branding, organization, isPreview = false }: { payment: PaymentReceived; branding?: any; organization?: any; isPreview?: boolean }) {
  return <UnifiedPaymentReceipt payment={payment} branding={branding} organization={organization} isPreview={isPreview} />;
}

function PaymentDetailPanel({
  payment,
  branding,
  organization,
  onClose,
  onEdit,
  onDelete,
  onRefund
}: {
  payment: PaymentReceived;
  branding?: any;
  organization?: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefund: () => void;
}) {
  const [showPdfView, setShowPdfView] = useState(true);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing download...", description: "Please wait while we generate the PDF." });

    // Ensure view is rendered
    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const { generatePDFFromElement } = await import("@/lib/pdf-utils");
      await generatePDFFromElement("payment-pdf-content", `Payment-${(payment as any).paymentNumber}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `${(payment as any).paymentNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Failed to download PDF",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we generate the receipt preview." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint('payment-pdf-content', `Payment_${(payment as any).paymentNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-900" data-testid="text-payment-number">{(payment as any).paymentNumber}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Send via Email</DropdownMenuItem>
              <DropdownMenuItem>Send via SMS</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <FileText className="h-3.5 w-3.5" />
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefund} title="Refund">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end px-4 py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <Label htmlFor="pdf-view" className="text-xs text-slate-500 font-medium">Show PDF View</Label>
          <Switch id="pdf-view" checked={showPdfView} onCheckedChange={setShowPdfView} className="scale-75" />
        </div>
      </div>

      {showPdfView ? (
        <div className="flex-1 overflow-auto bg-slate-100 flex justify-center" style={{ minHeight: 0 }}>
          <div className="p-8">
            <div id="payment-pdf-content" className="shadow-lg bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
              <PaymentReceiptView payment={payment} branding={branding} organization={organization} isPreview={true} />
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-semibold text-blue-600">{(payment as any).customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency((payment as any).amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Payment Date</p>
                  <p className="font-medium">{formatDate((payment as any).date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment #</p>
                  <p className="font-medium">{(payment as any).paymentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment Mode</p>
                  <p className="font-medium">{(payment as any).mode}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Deposit To</p>
                  <p className="font-medium">{payment.depositTo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reference Number</p>
                  <p className="font-medium">{payment.referenceNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    {(payment as any).status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">More Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deposit To</span>
                    <span className="text-blue-600">{payment.depositTo}</span>
                  </div>
                </div>
              </div>

              {payment.journalEntries && payment.journalEntries.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Journal</h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">INR</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">Amount is displayed in your base currency</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">Customer Payment - {(payment as any).paymentNumber}</span>
                    <Button variant="outline" size="sm" className="h-6 text-xs">Accrual</Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs">Cash</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">ACCOUNT</TableHead>
                        <TableHead className="text-xs text-right">DEBIT</TableHead>
                        <TableHead className="text-xs text-right">CREDIT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payment.journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm">{entry.account}</TableCell>
                          <TableCell className="text-sm text-right">{entry.debit > 0 ? formatCurrency(entry.debit).replace('₹', '') : '0.00'}</TableCell>
                          <TableCell className="text-sm text-right">{entry.credit > 0 ? formatCurrency(entry.credit).replace('₹', '') : '0.00'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell className="font-semibold text-right">
                          {formatCurrency(payment.journalEntries.reduce((sum, e) => sum + e.debit, 0)).replace('₹', '')}
                        </TableCell>
                        <TableCell className="font-semibold text-right">
                          {formatCurrency(payment.journalEntries.reduce((sum, e) => sum + e.credit, 0)).replace('₹', '')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      )}

      <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
        PDF Template: <span className="text-blue-600">Elite Template</span>
        <button className="text-blue-600 ml-2">Change</button>
      </div>
    </div>
  );
}

// FULL-PAGE FORM COMPONENT - No modal/dialog wrapper
function PaymentCreateForm({
  onClose,
  onSave,
  customers,
  editPayment
}: {
  onClose: () => void;
  onSave: (payment: any) => void;
  customers: Customer[];
  editPayment?: PaymentReceived | null;
}) {
  const [paymentType, setPaymentType] = useState<'invoice_payment' | 'customer_advance'>('invoice_payment');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    amount: '',
    bankCharges: '',
    tax: '',
    date: new Date().toISOString().split('T')[0],
    paymentNumber: '',
    mode: 'Cash',
    depositTo: 'Petty Cash',
    referenceNumber: '',
    taxDeducted: 'no',
    notes: '',
    sendThankYou: true,
    placeOfSupply: '',
    descriptionOfSupply: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, { payment: number; receivedDate: string }>>({});

  const autoAllocatePayment = (totalAmount: number, invoices: Invoice[]) => {
    if (invoices.length === 0) {
      setSelectedInvoices({});
      return;
    }

    if (totalAmount <= 0) {
      setSelectedInvoices({});
      return;
    }

    const sortedInvoices = [...invoices].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let remainingAmount = totalAmount;
    const newSelectedInvoices: Record<string, { payment: number; receivedDate: string }> = {};

    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;

      const invoiceBalance = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.amount;
      if (invoiceBalance > 0) {
        const paymentAmount = Math.min(remainingAmount, invoiceBalance);
        newSelectedInvoices[invoice.id] = {
          payment: paymentAmount,
          receivedDate: new Date().toISOString().split('T')[0]
        };
        remainingAmount -= paymentAmount;
      }
    }

    setSelectedInvoices(newSelectedInvoices);
  };

  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({ ...prev, amount }));
    const numAmount = parseFloat(amount) || 0;
    if (numAmount > 0 && paymentType === 'invoice_payment') {
      autoAllocatePayment(numAmount, unpaidInvoices);
    } else {
      setSelectedInvoices({});
    }
  };

  const totalPaymentAmount = Object.values(selectedInvoices).reduce((sum, inv) => sum + inv.payment, 0);
  const amountReceived = parseFloat(formData.amount) || 0;
  const amountInExcess = Math.max(0, amountReceived - totalPaymentAmount);

  useEffect(() => {
    if (editPayment) {
      setPaymentType(editPayment.paymentType === 'customer_advance' ? 'customer_advance' : 'invoice_payment');
      setFormData({
        customerId: editPayment.customerId,
        customerName: editPayment.customerName,
        customerEmail: editPayment.customerEmail,
        amount: String(editPayment.amount),
        bankCharges: String(editPayment.bankCharges || ''),
        tax: editPayment.tax,
        date: editPayment.date,
        paymentNumber: editPayment.paymentNumber,
        mode: editPayment.mode,
        depositTo: editPayment.depositTo,
        referenceNumber: editPayment.referenceNumber,
        taxDeducted: 'no',
        notes: editPayment.notes,
        sendThankYou: editPayment.sendThankYou,
        placeOfSupply: editPayment.placeOfSupply,
        descriptionOfSupply: editPayment.descriptionOfSupply
      });
    } else {
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        amount: '',
        bankCharges: '',
        tax: '',
        date: new Date().toISOString().split('T')[0],
        paymentNumber: '',
        mode: 'Cash',
        depositTo: 'Petty Cash',
        referenceNumber: '',
        taxDeducted: 'no',
        notes: '',
        sendThankYou: true,
        placeOfSupply: '',
        descriptionOfSupply: ''
      });
      setSelectedCustomer(null);
    }
  }, [editPayment]);

  const handleCustomerChange = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.displayName || customer.companyName,
        customerEmail: customer.email || '',
        placeOfSupply: customer.placeOfSupply || ''
      }));

      try {
        const response = await fetch(`/api/customers/${customerId}/unpaid-invoices`);
        if (response.ok) {
          const data = await response.json();
          const invoices = (data.data || []).map((inv: any) => ({
            ...inv,
            balanceDue: inv.balanceDue > 0 ? inv.balanceDue : inv.amount
          }));
          setUnpaidInvoices(invoices);

          const amount = parseFloat(formData.amount) || 0;
          if (amount > 0) {
            autoAllocatePayment(amount, invoices);
          }
        }
      } catch (error) {
        console.error('Failed to fetch unpaid invoices:', error);
      }
    }
  };

  const handleSubmit = () => {
    const invoicePayments = Object.entries(selectedInvoices)
      .filter(([_, inv]) => inv.payment > 0)
      .map(([id, inv]) => {
        const invoice = unpaidInvoices.find(i => i.id === id);
        return {
          invoiceId: id,
          invoiceNumber: invoice?.invoiceNumber || '',
          invoiceDate: invoice?.date || '',
          invoiceAmount: invoice?.amount || 0,
          balanceDue: invoice?.balanceDue || 0,
          paymentAmount: inv.payment,
          paymentReceivedDate: inv.receivedDate
        };
      });

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      bankCharges: parseFloat(formData.bankCharges) || 0,
      paymentType,
      status: 'PAID',
      unusedAmount: amountInExcess,
      invoices: invoicePayments,
      attachments: [],
      journalEntries: [
        {
          account: formData.depositTo,
          debit: parseFloat(formData.amount) || 0,
          credit: 0
        },
        {
          account: 'Unearned Revenue',
          debit: 0,
          credit: parseFloat(formData.amount) || 0
        }
      ]
    };

    onSave(paymentData);
    onClose();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-900">{editPayment ? 'Edit Payment' : 'Record Payment'}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-form">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">Record a payment received from a customer</p>

          <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="invoice_payment">Invoice Payment</TabsTrigger>
              <TabsTrigger value="customer_advance">Customer Advance</TabsTrigger>
            </TabsList>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Customer Name
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.displayName || customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomer?.pan && (
                    <p className="text-sm text-blue-600">PAN: {selectedCustomer.pan}</p>
                  )}
                  {selectedCustomer?.gstTreatment && (
                    <p className="text-sm text-slate-600">GST Treatment: {selectedCustomer.gstTreatment}</p>
                  )}
                  {selectedCustomer?.gstin && (
                    <p className="text-sm text-slate-600">GSTIN: {selectedCustomer.gstin}</p>
                  )}
                </div>

                {paymentType === 'customer_advance' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Place of Supply
                      <span className="text-red-600">*</span>
                    </Label>
                    <Select value={formData.placeOfSupply} onValueChange={(v) => setFormData(prev => ({ ...prev, placeOfSupply: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select place of supply" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="[MH] - Maharashtra">[MH] - Maharashtra</SelectItem>
                        <SelectItem value="[DL] - Delhi">[DL] - Delhi</SelectItem>
                        <SelectItem value="[KA] - Karnataka">[KA] - Karnataka</SelectItem>
                        <SelectItem value="[TN] - Tamil Nadu">[TN] - Tamil Nadu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {paymentType === 'customer_advance' && (
                <div className="space-y-2">
                  <Label>Description of Supply</Label>
                  <Textarea
                    placeholder="Will be displayed on the Payment Receipt"
                    value={formData.descriptionOfSupply}
                    onChange={(e) => setFormData(prev => ({ ...prev, descriptionOfSupply: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount Received
                    <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 bg-slate-50 rounded-l-md text-sm">
                      INR
                    </span>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="Enter amount to auto-allocate"
                      className="rounded-l-none"
                      data-testid="input-amount"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Amount will be auto-allocated to unpaid invoices (oldest first)</p>
                </div>
                <div className="space-y-2">
                  <Label>Bank Charges (if any)</Label>
                  <Input
                    type="number"
                    value={formData.bankCharges}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankCharges: e.target.value }))}
                    data-testid="input-bank-charges"
                  />
                </div>
              </div>

              {paymentType === 'customer_advance' && (
                <div className="space-y-2">
                  <Label>Tax</Label>
                  <Select value={formData.tax} onValueChange={(v) => setFormData(prev => ({ ...prev, tax: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Tax" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tax</SelectItem>
                      <SelectItem value="gst18">GST 18%</SelectItem>
                      <SelectItem value="gst12">GST 12%</SelectItem>
                      <SelectItem value="gst5">GST 5%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Date
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    data-testid="input-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment #
                    <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={formData.paymentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentNumber: e.target.value }))}
                    placeholder="Auto-generated"
                    data-testid="input-payment-number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => setFormData(prev => ({ ...prev, mode: v }))}>
                    <SelectTrigger data-testid="select-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deposit To
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.depositTo} onValueChange={(v) => setFormData(prev => ({ ...prev, depositTo: v }))}>
                    <SelectTrigger data-testid="select-deposit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petty Cash">Petty Cash</SelectItem>
                      <SelectItem value="Bank Account">Bank Account</SelectItem>
                      <SelectItem value="Cash on Hand">Cash on Hand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference#</Label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  data-testid="input-reference"
                />
              </div>

              {paymentType === 'invoice_payment' && (
                <div className="space-y-2">
                  <Label>Tax deducted?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="taxDeducted"
                        value="no"
                        checked={formData.taxDeducted === 'no'}
                        onChange={() => setFormData(prev => ({ ...prev, taxDeducted: 'no' }))}
                      />
                      No Tax deducted
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="taxDeducted"
                        value="yes"
                        checked={formData.taxDeducted === 'yes'}
                        onChange={() => setFormData(prev => ({ ...prev, taxDeducted: 'yes' }))}
                      />
                      Yes, TDS (Income Tax)
                    </label>
                  </div>
                </div>
              )}

              {paymentType === 'invoice_payment' && formData.customerId && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Unpaid Invoices</h4>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Filter className="h-3 w-3" />
                        Filter by Date Range
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => setSelectedInvoices({})}
                      >
                        Clear Applied Amount
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">DATE</TableHead>
                        <TableHead className="text-xs">INVOICE NUMBER</TableHead>
                        <TableHead className="text-xs text-right">INVOICE AMOUNT</TableHead>
                        <TableHead className="text-xs text-right">AMOUNT DUE</TableHead>
                        <TableHead className="text-xs">PAYMENT RECEIVED ON</TableHead>
                        <TableHead className="text-xs text-right">PAYMENT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                            There are no unpaid invoices associated with this customer.
                          </TableCell>
                        </TableRow>
                      ) : (
                        unpaidInvoices.map(invoice => (
                          <TableRow key={invoice.id} className={selectedInvoices[invoice.id]?.payment > 0 ? "bg-green-50" : ""}>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell className="text-blue-600">{invoice.invoiceNumber}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.amount || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.balanceDue || 0)}</TableCell>
                            <TableCell>
                              {selectedInvoices[invoice.id]?.payment > 0 ? (
                                <Input
                                  type="date"
                                  className="w-32"
                                  value={selectedInvoices[invoice.id]?.receivedDate || ''}
                                  onChange={(e) => setSelectedInvoices(prev => ({
                                    ...prev,
                                    [invoice.id]: {
                                      ...prev[invoice.id],
                                      receivedDate: e.target.value
                                    }
                                  }))}
                                />
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                className="w-24 text-right"
                                value={selectedInvoices[invoice.id]?.payment || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  const maxPayment = invoice.balanceDue || invoice.amount;
                                  const validPayment = Math.min(Math.max(0, value), maxPayment);
                                  setSelectedInvoices(prev => ({
                                    ...prev,
                                    [invoice.id]: {
                                      payment: validPayment,
                                      receivedDate: prev[invoice.id]?.receivedDate || new Date().toISOString().split('T')[0]
                                    }
                                  }));
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-slate-500">**List contains only SENT invoices</p>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span>{formatCurrency(unpaidInvoices.reduce((sum, inv) => sum + (inv.balanceDue || inv.amount || 0), 0))}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Amount Received :</span>
                        <span>{formatCurrency(amountReceived)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount used for Payments :</span>
                        <span>{formatCurrency(totalPaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Refunded :</span>
                        <span>0.00</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Amount in Excess:</span>
                        <span>{formatCurrency(amountInExcess)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (Internal use. Not visible to customer)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px]"
                  data-testid="input-notes"
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <Button variant="outline" size="sm" className="gap-1">
                  Upload File
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <p className="text-xs text-slate-500">You can upload a maximum of 5 files, 5MB each</p>
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Checkbox
                  id="sendThankYou"
                  checked={formData.sendThankYou}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendThankYou: checked as boolean }))}
                />
                <Label htmlFor="sendThankYou">Send a "Thank you" note for this payment</Label>
              </div>

              {formData.sendThankYou && formData.customerEmail && (
                <div className="ml-6 flex items-center gap-2">
                  <Checkbox checked disabled />
                  <span className="text-sm">&lt;{formData.customerEmail}&gt;</span>
                </div>
              )}

              <p className="text-sm text-slate-500">
                Additional Fields: Start adding custom fields for your payments received by going to{' '}
                <span className="text-blue-600">Settings → Sales → Payments Received</span>.
              </p>
            </div>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 -mb-2 p-2 bg-white flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
        <Button variant="outline" onClick={handleSubmit} data-testid="button-save-draft">Save as Draft</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-paid">Save as Paid</Button>
      </div>
    </div>
  );
}

export default function PaymentsReceived() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceived | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editPayment, setEditPayment] = useState<PaymentReceived | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
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

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments-received');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchPaymentDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/payments-received/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPayment(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment detail:', error);
    }
  };

  const handlePaymentClick = (payment: PaymentReceived) => {
    fetchPaymentDetail((payment as any).id);
  };

  const handleClosePanel = () => {
    setSelectedPayment(null);
  };

  const handleEditPayment = () => {
    if (selectedPayment) {
      setEditPayment(selectedPayment);
      setShowCreateForm(true);
    }
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const response = await fetch(`/api/payments-received/${paymentToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Payment deleted successfully" });
        fetchPayments();
        if (selectedPayment?.id === paymentToDelete) {
          handleClosePanel();
        }
      }
    } catch (error) {
      toast({ title: "Failed to delete payment", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      const response = await fetch(`/api/payments-received/${selectedPayment.id}/refund`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundAmount: selectedPayment.amount })
      });
      if (response.ok) {
        toast({ title: "Payment refunded" });
        fetchPayments();
        fetchPaymentDetail(selectedPayment.id);
      }
    } catch (error) {
      toast({ title: "Failed to refund payment", variant: "destructive" });
    }
  };

  const handleSavePayment = async (paymentData: any) => {
    try {
      const url = editPayment
        ? `/api/payments-received/${editPayment.id}`
        : '/api/payments-received';
      const method = editPayment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        toast({ title: editPayment ? "Payment updated" : "Payment recorded successfully" });
        fetchPayments();
        setEditPayment(null);
        setShowCreateForm(false);
      }
    } catch (error) {
      toast({ title: "Failed to save payment", variant: "destructive" });
    }
  };

  const toggleSelectPayment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPayments.includes(id)) {
      setSelectedPayments(selectedPayments.filter(i => i !== id));
    } else {
      setSelectedPayments([...selectedPayments, id]);
    }
  };

  const applyFilter = (paymentList: PaymentReceived[]) => {
    if (activeFilter === "All") return paymentList;
    return paymentList.filter(payment => {
      const status = payment.status?.toUpperCase() || "";
      switch (activeFilter) {
        case "Paid": return status === "PAID";
        case "Refunded": return status === "REFUNDED";
        case "Draft": return status === "DRAFT";
        default: return true;
      }
    });
  };

  const filteredPayments = applyFilter(payments).filter(payment =>
    (payment as any).paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment as any).customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredPayments, 10);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">PAID</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">REFUNDED</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="text-slate-600 border-slate-200">DRAFT</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="payments-received-layout">
        {!showCreateForm && (
          <ResizablePanel
            defaultSize={selectedPayment ? 30 : 100}
            minSize={30}
            className="flex flex-col overflow-hidden bg-white border-r border-slate-200"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1.5 text-xl font-semibold text-slate-900 hover:text-slate-700 hover:bg-transparent p-0 h-auto transition-colors">
                          {activeFilter === "All" ? "All Payments" : `${activeFilter} Payments`}
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => setActiveFilter("All")}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Paid")}>Paid</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Refunded")}>Refunded</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter("Draft")}>Draft</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-slate-400">({payments.length})</span>
                  </div>

                  <div className="relative flex-1 max-w-[240px] hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9"
                      data-testid="input-search-payments"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setEditPayment(null);
                      setShowCreateForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9"
                    data-testid="button-new-payment"
                  >
                    <Plus className="h-4 w-4" /> New
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9" data-testid="button-more-options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={fetchPayments}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Mobile Search Bar */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 bg-white sm:hidden">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-search-mobile"
                  />
                </div>
              </div>

              <div className={`flex-1 flex flex-col min-h-0 ${selectedPayment ? 'p-0' : 'p-4 pb-0'}`}>
                <div className="flex-1 flex flex-col pb-0 overflow-hidden">
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading payments...</div>
                  ) : filteredPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                      <p className="text-slate-500 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Record your first payment to get started'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2" data-testid="button-create-first-payment">
                          <Plus className="h-4 w-4" /> Record Payment
                        </Button>
                      )}
                    </div>
                  ) : selectedPayment ? (
                    <div className="divide-y divide-slate-100 bg-white">
                      {paginatedItems.map((payment: any) => (
                        <div
                          key={(payment as any).id}
                          className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${selectedPayment?.id === (payment as any).id ? 'bg-blue-50/50' : ''}`}
                          onClick={() => handlePaymentClick(payment)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                className="h-4 w-4 rounded border-slate-300"
                                checked={selectedPayments.includes((payment as any).id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPayments(prev => [...prev, (payment as any).id]);
                                  } else {
                                    setSelectedPayments(prev => prev.filter(i => i !== (payment as any).id));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-medium text-slate-900 text-sm">{(payment as any).customerName}</span>
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">{formatCurrency((payment as any).amount)}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-6 text-xs text-slate-500 mb-1">
                            <span>{(payment as any).paymentNumber}</span>
                            <span>•</span>
                            <span>{formatDate((payment as any).date)}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{(payment as any).status}</span>
                            <span className="text-[11px] text-slate-400">{(payment as any).mode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg bg-white shadow-sm flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-auto scrollbar-hide">
                        <Table>
                          <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="border-none hover:bg-transparent">
                              <TableHead className="w-10 pl-4 py-3">
                                <Checkbox
                                  checked={selectedPayments.length === paginatedItems.length && paginatedItems.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedPayments(paginatedItems.map((p: any) => p.id));
                                    } else {
                                      setSelectedPayments([]);
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">DATE</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">PAYMENT #</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">REFERENCE NUMBER</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">CUSTOMER NAME</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">INVOICE#</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">MODE</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider text-right py-3">AMOUNT</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider text-right py-3">UNUSED AMOUNT</TableHead>
                              <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wider py-3">STATUS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedItems.map((payment: any) => (
                              <TableRow
                                key={(payment as any).id}
                                onClick={() => handlePaymentClick(payment)}
                                className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${selectedPayment?.id === (payment as any).id ? 'bg-blue-50' : ''}`}
                                data-testid={`row-payment-${(payment as any).id}`}
                              >
                                <TableCell className="pl-4 py-4" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedPayments.includes((payment as any).id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPayments(prev => [...prev, (payment as any).id]);
                                      } else {
                                        setSelectedPayments(prev => prev.filter(i => i !== (payment as any).id));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="py-4 text-sm">{formatDate((payment as any).date)}</TableCell>
                                <TableCell className="py-4 text-sm text-blue-600 font-medium">{(payment as any).paymentNumber}</TableCell> {/* Correction: paymentNumber not date */}
                                <TableCell className="py-4 text-sm">{(payment as any).referenceNumber || '-'}</TableCell>
                                <TableCell className="py-4 text-sm font-medium text-blue-600 hover:underline">{(payment as any).customerName}</TableCell>
                                <TableCell className="py-4 text-sm">
                                  {(payment as any).invoices?.length > 0
                                    ? (payment as any).invoices.map((inv: any) => inv.invoiceNumber).join(', ')
                                    : '-'
                                  }
                                </TableCell>
                                <TableCell className="py-4 text-sm">{(payment as any).mode}</TableCell>
                                <TableCell className="py-4 text-sm text-right font-semibold">{formatCurrency((payment as any).amount)}</TableCell>
                                <TableCell className="py-4 text-sm text-right">{formatCurrency((payment as any).unusedAmount)}</TableCell>
                                <TableCell className="py-4">{getStatusBadge((payment as any).status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-none border-t border-slate-200 bg-white">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                />
              </div>
            </div>
          </ResizablePanel>
        )}

        {!showCreateForm && selectedPayment && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
              <div className="h-full flex flex-col overflow-hidden bg-white border-l border-slate-200">
                <PaymentDetailPanel
                  payment={selectedPayment}
                  branding={branding}
                  organization={currentOrganization || undefined}
                  onClose={handleClosePanel}
                  onEdit={handleEditPayment}
                  onDelete={() => handleDelete(selectedPayment.id)}
                  onRefund={handleRefund}
                />
              </div>
            </ResizablePanel>
          </>
        )}

        {showCreateForm && (
          <ResizablePanel defaultSize={100} className="bg-white">
            <PaymentCreateForm
              onClose={() => {
                setShowCreateForm(false);
                setEditPayment(null);
              }}
              onSave={handleSavePayment}
              customers={customers}
              editPayment={editPayment}
            />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
