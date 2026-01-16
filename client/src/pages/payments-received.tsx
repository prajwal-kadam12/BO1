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

export default function PaymentsReceived() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [payments, setPayments] = useState<PaymentReceived[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceived | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
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
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch payments", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClick = (payment: PaymentReceived) => {
    setSelectedPayment(payment);
  };

  const handleClosePanel = () => {
    setSelectedPayment(null);
  };

  const handleEditPayment = () => {
    if (selectedPayment) {
      setLocation(`/payments-received/${selectedPayment.id}/edit`);
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
        toast({ title: "Success", description: "Payment deleted successfully" });
        fetchPayments();
        if (selectedPayment?.id === paymentToDelete) {
          setSelectedPayment(null);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete payment", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleRefund = () => {
    toast({ title: "Refund", description: "Refund functionality coming soon" });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'paid') return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
    if (statusLower === 'partially_paid') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Partially Paid</Badge>;
    if (statusLower === 'void') return <Badge className="bg-red-100 text-red-700 border-red-200">Void</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const filteredPayments = payments.filter(p =>
    p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredPayments, 10);

  const showCreateForm = false; // Separate page handles this

  return (
    <div className="h-full flex w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="payments-received-layout">
        {!showCreateForm && (
          <ResizablePanel defaultSize={selectedPayment ? 30 : 100} minSize={20} className="bg-white">
            <div className="h-full flex flex-col overflow-hidden bg-white border-r border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex-none">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-xl font-bold p-0 hover:bg-transparent">
                        All Payments <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>All Payments</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setLocation('/payments-received/create')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> New
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">Loading...</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>No payments found</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b border-slate-200">
                          <TableHead className="w-12 pl-4 py-3">
                            <Checkbox
                              checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedPayments(filteredPayments.map(p => p.id));
                                else setSelectedPayments([]);
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
                            key={payment.id}
                            onClick={() => handlePaymentClick(payment)}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${selectedPayment?.id === payment.id ? 'bg-blue-50' : ''}`}
                            data-testid={`row-payment-${payment.id}`}
                          >
                            <TableCell className="pl-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedPayments.includes(payment.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPayments(prev => [...prev, payment.id]);
                                  } else {
                                    setSelectedPayments(prev => prev.filter(i => i !== payment.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-4 text-sm">{formatDate(payment.date)}</TableCell>
                            <TableCell className="py-4 text-sm text-blue-600 font-medium">{payment.paymentNumber}</TableCell>
                            <TableCell className="py-4 text-sm">{payment.referenceNumber || '-'}</TableCell>
                            <TableCell className="py-4 text-sm font-medium text-blue-600 hover:underline">{payment.customerName}</TableCell>
                            <TableCell className="py-4 text-sm">
                              {payment.invoices?.length > 0
                                ? payment.invoices.map((inv: any) => inv.invoiceNumber).join(', ')
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="py-4 text-sm">{payment.mode}</TableCell>
                            <TableCell className="py-4 text-sm text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="py-4 text-sm text-right">{formatCurrency(payment.unusedAmount)}</TableCell>
                            <TableCell className="py-4">{getStatusBadge(payment.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
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

