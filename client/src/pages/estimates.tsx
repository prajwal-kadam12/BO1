import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { robustIframePrint } from "@/lib/robust-print";
import {
  Plus,
  ChevronDown,
  MoreHorizontal,
  Search,
  X,
  FileText,
  Pencil,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Receipt,
  Clock,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download,
  RefreshCw,
  MessageSquare,
  History,
  FileDown,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";

interface Quote {
  id: string;
  quoteNumber: string;
  referenceNumber?: string;
  date: string;
  expiryDate?: string;
  customerId: string;
  customerName: string;
  total: number;
  status: string;
  convertedTo?: string; // 'invoice' | 'sales-order'
  salesperson?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: any[];
  billingAddress?: any;
  shippingAddress?: any;
  customerNotes?: string;
  termsAndConditions?: string;
  activityLogs?: any[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getStatusBadge = (status: string, convertedTo?: string) => {
  if (status === "CONVERTED") {
    const label = convertedTo === 'invoice' ? "Converted To Invoice" :
      convertedTo === 'sales-order' ? "Converted To Sales Order" : "Converted";
    return <span className="text-purple-600 font-medium text-[13px] whitespace-nowrap">{label}</span>;
  }

  if (status === "SENT") {
    return <span className="text-blue-600 font-medium text-[13px] whitespace-nowrap">Quotation Send</span>;
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    SENT: { label: "Sent", variant: "blue" as any },
    ACCEPTED: { label: "Accepted", variant: "default" },
    DECLINED: { label: "Declined", variant: "destructive" },
    EXPIRED: { label: "Expired", variant: "destructive" },
    CONVERTED: { label: "Converted", variant: "outline" },
  };
  const config = statusMap[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant} className="text-[11px] font-medium px-2 py-0.5">{config.label}</Badge>;
};

const QUOTE_FILTERS = [
  { id: "all", label: "All Quotes" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Sent" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "CONVERTED", label: "Converted" },
  { id: "DECLINED", label: "Declined" },
  { id: "EXPIRED", label: "Expired" },
];

// Helper function to convert number to words
function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanOneThousand(n: number): string {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  let result = "Indian Rupee ";
  if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  result += " Only";
  return result.trim();
}

function QuotePDFView({ quote, branding, organization }: { quote: Quote; branding?: any; organization?: any }) {
  // Calculate tax breakdown (assuming items have tax information)
  const calculateTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item: any) => {
        subtotal += item.amount || 0;
        if (item.cgst) cgst += (item.amount * item.cgst) / 100;
        if (item.sgst) sgst += (item.amount * item.sgst) / 100;
        if (item.igst) igst += (item.amount * item.igst) / 100;
      });
    } else {
      // If no items with tax info, estimate based on total
      subtotal = quote.total / 1.18; // Assuming 18% GST
      cgst = subtotal * 0.09;
      sgst = subtotal * 0.09;
    }

    return { subtotal, cgst, sgst, igst, total: quote.total };
  };

  const totals = calculateTotals();
  return (
    <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="p-10">
        {/* Standard Sales PDF Header */}
        <SalesPDFHeader
          logo={branding?.logo || undefined}
          documentTitle="Quote"
          documentNumber={quote.quoteNumber}
          date={quote.date}
          referenceNumber={quote.referenceNumber}
          organization={organization}
        />

        {/* Total Badge */}
        {/* <div className="flex justify-end mb-6">
            <div className="p-4 bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(quote.total)}</p>
            </div>
          </div> */}

        {/* Quote Metadata */}
        <div className="border-t-2 border-slate-800 pt-4 mb-4">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-2 w-1/3">
                  <span className="font-semibold">Quote Date:</span> {formatDate(quote.date)}
                </td>
                <td className="py-2 w-1/3">
                  <span className="font-semibold">Place Of Supply:</span> {quote.billingAddress?.state || 'Maharashtra (27)'}
                </td>
                <td className="py-2 w-1/3">
                  <span className="font-semibold">Expiry Date:</span> {quote.expiryDate ? formatDate(quote.expiryDate) : formatDate(new Date(new Date(quote.date).setDate(new Date(quote.date).getDate() + 30)).toISOString())}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bill To & Ship To Side by Side */}
        <div className="mb-4">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="w-1/2 align-top p-3 border border-slate-400">
                  <div className="font-bold mb-2">Bill To</div>
                  <div className="space-y-1">
                    <p className="font-semibold text-blue-600">{quote.customerName}</p>
                    {quote.billingAddress && (
                      <>
                        {quote.billingAddress.street && <p>{quote.billingAddress.street}</p>}
                        {(quote.billingAddress.city || quote.billingAddress.state) && (
                          <p>
                            {quote.billingAddress.city}
                            {quote.billingAddress.city && quote.billingAddress.state && ', '}
                            {quote.billingAddress.state}
                          </p>
                        )}
                        {quote.billingAddress.pincode && <p>{quote.billingAddress.pincode}</p>}
                        {quote.billingAddress.country && <p>{quote.billingAddress.country}</p>}
                      </>
                    )}
                  </div>
                </td>
                <td className="w-1/2 align-top p-3 border border-slate-400 border-l-0">
                  <div className="font-bold mb-2">Ship To</div>
                  <div className="space-y-1">
                    {quote.shippingAddress ? (
                      <>
                        <p className="font-semibold text-blue-600">{quote.customerName}</p>
                        {quote.shippingAddress.street && <p>{quote.shippingAddress.street}</p>}
                        {(quote.shippingAddress.city || quote.shippingAddress.state) && (
                          <p>
                            {quote.shippingAddress.city}
                            {quote.shippingAddress.city && quote.shippingAddress.state && ', '}
                            {quote.shippingAddress.state}
                          </p>
                        )}
                        {quote.shippingAddress.pincode && <p>{quote.shippingAddress.pincode}</p>}
                        {quote.shippingAddress.country && <p>{quote.shippingAddress.country}</p>}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-blue-600">{quote.customerName}</p>
                        {quote.billingAddress && (
                          <>
                            {quote.billingAddress.street && <p>{quote.billingAddress.street}</p>}
                            {(quote.billingAddress.city || quote.billingAddress.state) && (
                              <p>
                                {quote.billingAddress.city}
                                {quote.billingAddress.city && quote.billingAddress.state && ', '}
                                {quote.billingAddress.state}
                              </p>
                            )}
                            {quote.billingAddress.pincode && <p>{quote.billingAddress.pincode}</p>}
                            {quote.billingAddress.country && <p>{quote.billingAddress.country}</p>}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-slate-400 px-2 py-2 text-left text-xs font-semibold">#</th>
              <th className="border border-slate-400 px-2 py-2 text-left text-xs font-semibold">Item & Description</th>
              <th className="border border-slate-400 px-2 py-2 text-center text-xs font-semibold">HSN/SAC</th>
              <th className="border border-slate-400 px-2 py-2 text-center text-xs font-semibold">Qty</th>
              <th className="border border-slate-400 px-2 py-2 text-right text-xs font-semibold">Rate</th>
              <th className="border border-slate-400 px-2 py-2 text-right text-xs font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.items && quote.items.length > 0 ? (
              quote.items.map((item: any, index: number) => (
                <tr key={item.id || index}>
                  <td className="border border-slate-400 px-2 py-2 text-xs">{index + 1}</td>
                  <td className="border border-slate-400 px-2 py-2 text-xs">
                    <p className="font-semibold">{item.name}</p>
                    {item.description && <p className="text-slate-600 text-xs mt-0.5">{item.description}</p>}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-center text-xs">{item.hsn || item.sac || '1000'}</td>
                  <td className="border border-slate-400 px-2 py-2 text-center text-xs">
                    {item.quantity} {item.unit || 'kg'}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-xs">
                    {item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-right text-xs font-semibold">
                    {item.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="border border-slate-400 px-2 py-3 text-center text-xs text-slate-500">No items available</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Tax Summary and Total in Words */}
        <div className="mb-4">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="w-1/2 align-top p-3 border border-slate-400">
                  <div className="font-bold mb-2">Total In Words</div>
                  <p className="text-xs leading-relaxed">{numberToWords(quote.total)}</p>
                </td>
                <td className="w-1/2 align-top p-0 border border-slate-400 border-l-0">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 border-b border-slate-400">Sub Total</td>
                        <td className="px-3 py-2 text-right border-b border-slate-400">
                          {totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {totals.cgst > 0 && (
                        <tr>
                          <td className="px-3 py-2 border-b border-slate-400">CGST</td>
                          <td className="px-3 py-2 text-right border-b border-slate-400">
                            {totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {totals.sgst > 0 && (
                        <tr>
                          <td className="px-3 py-2 border-b border-slate-400">SGST</td>
                          <td className="px-3 py-2 text-right border-b border-slate-400">
                            {totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {totals.igst > 0 && (
                        <tr>
                          <td className="px-3 py-2 border-b border-slate-400">IGST</td>
                          <td className="px-3 py-2 text-right border-b border-slate-400">
                            {totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      <tr className="font-bold">
                        <td className="px-3 py-2">Total</td>
                        <td className="px-3 py-2 text-right">{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes Section */}
        {quote.customerNotes && (
          <div className="mb-4 border border-slate-400 p-3">
            <p className="text-xs font-bold mb-2">NOTES</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{quote.customerNotes}</p>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mb-4 border border-slate-400 p-3">
          <p className="text-xs font-bold mb-2">TERMS & CONDITIONS</p>
          {quote.termsAndConditions ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{quote.termsAndConditions}</p>
          ) : (
            <div className="text-xs leading-relaxed space-y-1">
              <p>Looking forward to your business.</p>
            </div>
          )}
        </div>

        {/* Signature Section */}
        <div className="border-t-2 border-slate-800 pt-4">
          <div className="flex justify-between items-end">
            <div className="text-xs text-slate-600">
              <p>Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            </div>
            <div className="text-right">
              {branding?.signature?.url ? (
                <div className="flex flex-col items-end">
                  <img
                    src={branding.signature.url}
                    alt="Authorized Signature"
                    style={{ maxWidth: '120px', maxHeight: '40px', objectFit: 'contain' }}
                    className="mb-2"
                  />
                  <div className="text-xs font-semibold border-t border-slate-400 pt-1" style={{ width: '120px' }}>
                    Authorized Signature
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div style={{ width: '120px', height: '40px' }} className="mb-2"></div>
                  <div className="text-xs font-semibold border-t border-slate-400 pt-1" style={{ width: '120px' }}>
                    Authorized Signature
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuoteDetailPanelProps {
  quote: Quote;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: (type: string) => void;
  onClone: () => void;
  branding?: any;
}

function QuoteDetailPanel({ quote, onClose, onEdit, onDelete, onConvert, onClone, branding, organization }: QuoteDetailPanelProps & { organization?: any }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPdfView, setShowPdfView] = useState(true);
  const { toast } = useToast();

  const handlePrint = async () => {
    // Show preparing toast
    toast({ title: "Preparing print...", description: "Please wait while we generate the quote preview." });

    // Ensure PDF view is showing before printing
    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint('estimate-pdf-content', `Quote_${quote.quoteNumber}`);
    } catch (error) {
      console.error('Print failed:', error);
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    toast({ title: "Preparing download...", description: "Please wait while we generate the PDF." });

    // Ensure PDF preview is showing before capturing
    if (!showPdfView) {
      setShowPdfView(true);
      // Give React time to render 
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const { generatePDFFromElement } = await import("@/lib/pdf-utils");
      await generatePDFFromElement("estimate-pdf-content", `Quote-${quote.quoteNumber}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Quote-${quote.quoteNumber}.pdf has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate" data-testid="text-quote-number">{quote.quoteNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit-quote">
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-pdf-print">
                <FileText className="h-4 w-4" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm" data-testid="button-convert">
                Convert
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onConvert("sales-order")} data-testid="menu-item-convert-sales-order">
                <ShoppingCart className="mr-2 h-4 w-4" /> To Sales Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConvert("invoice")} data-testid="menu-item-convert-invoice">
                <Receipt className="mr-2 h-4 w-4" /> To Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-more-actions">
                More
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem data-testid="menu-item-send">
                <Send className="mr-2 h-4 w-4" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClone} data-testid="menu-item-clone">
                <Copy className="mr-2 h-4 w-4" /> Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-item-accept">
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Accepted
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-decline">
                <XCircle className="mr-2 h-4 w-4" /> Mark as Declined
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={onDelete} data-testid="menu-item-delete">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <TabsList className="h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-comments"
            >
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-transactions"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="mails"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-mails"
            >
              Mails
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-activity"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="statement"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-statement"
            >
              Statement
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto mt-0">
          <div className="flex h-full">
            <div className="w-72 border-r border-slate-200 dark:border-slate-700 p-6 overflow-auto">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Quote Info</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <div className="mt-1">{getStatusBadge(quote.status, quote.convertedTo)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Quote Date</p>
                      <p className="text-sm font-medium">{formatDate(quote.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expiry Date</p>
                      <p className="text-sm font-medium">{quote.expiryDate ? formatDate(quote.expiryDate) : '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Customer Info</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="text-sm font-medium text-blue-600">{quote.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Salesperson</p>
                      <p className="text-sm font-medium">{quote.salesperson || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Amount</p>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(quote.total)}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pdf-view" className="text-xs text-slate-500">PDF Preview</Label>
                    <Switch
                      id="pdf-view"
                      checked={showPdfView}
                      onCheckedChange={setShowPdfView}
                      data-testid="switch-pdf-view"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-auto">
              {showPdfView ? (
                <div className="max-w-4xl mx-auto shadow-lg bg-white ring-1 ring-slate-200">
                  <div id="estimate-pdf-content" className="bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
                    <QuotePDFView quote={quote} branding={branding} organization={organization} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {quote.items && quote.items.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="text-sm font-semibold">Items</h4>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500">
                            <th className="px-4 py-2 font-medium">Item</th>
                            <th className="px-4 py-2 font-medium text-right">Qty</th>
                            <th className="px-4 py-2 font-medium text-right">Rate</th>
                            <th className="px-4 py-2 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quote.items.map((item: any, index: number) => (
                            <tr key={item.id || index} className="border-b last:border-0">
                              <td className="px-4 py-3">
                                <p className="font-medium">{item.name}</p>
                                {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                              </td>
                              <td className="px-4 py-3 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="flex-1 overflow-auto mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No comments added yet</p>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 overflow-auto mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <History className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No transactions found</p>
          </div>
        </TabsContent>

        <TabsContent value="mails" className="flex-1 overflow-auto mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <Mail className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No mails sent yet</p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-auto mt-0">
          <div className="p-6">
            {quote.activityLogs && quote.activityLogs.length > 0 ? (
              <div className="space-y-4">
                {quote.activityLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{log.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {log.user} • {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No activity recorded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statement" className="flex-1 overflow-auto mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 mb-3 flex items-center justify-center">
              <FileDown className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No statement available for quote</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Estimates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>(null);
  const { currentOrganization } = useOrganization();
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [favoriteFilters, setFavoriteFilters] = useState<string[]>([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const getFilterLabel = () => {
    const filter = QUOTE_FILTERS.find(f => f.id === activeFilter);
    return filter?.label || "All Quotes";
  };

  const toggleFavorite = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteFilters.includes(filterId)) {
      setFavoriteFilters(favoriteFilters.filter(f => f !== filterId));
    } else {
      setFavoriteFilters([...favoriteFilters, filterId]);
    }
  };

  useEffect(() => {
    fetchQuotes();
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

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuote(quote);
  };

  const handleClosePanel = () => {
    setSelectedQuote(null);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      setLocation(`/estimates/${selectedQuote.id}/edit`);
    }
  };

  const toggleSelectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedQuotes.includes(id)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== id));
    } else {
      setSelectedQuotes([...selectedQuotes, id]);
    }
  };

  const handleDeleteClick = () => {
    if (selectedQuote) {
      setQuoteToDelete(selectedQuote.id);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      const response = await fetch(`/api/quotes/${quoteToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Quote deleted successfully" });
        handleClosePanel();
        fetchQuotes();
      }
    } catch (error) {
      toast({ title: "Failed to delete quote", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleConvert = async (type: string) => {
    if (!selectedQuote) return;

    try {
      const endpoint = type === 'invoice'
        ? `/api/quotes/${selectedQuote.id}/convert-to-invoice`
        : `/api/quotes/${selectedQuote.id}/convert-to-sales-order`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        const targetType = type === 'invoice' ? 'Invoice' : 'Sales Order';
        const targetNumber = type === 'invoice'
          ? result.data?.invoice?.invoiceNumber || result.data?.invoiceNumber
          : result.data?.salesOrder?.orderNumber || result.data?.orderNumber;

        toast({
          title: "Quote Converted",
          description: `Quote converted to ${targetType}${targetNumber ? ' ' + targetNumber : ''}`,
        });

        // Refresh quotes to show updated status
        fetchQuotes();
        handleClosePanel();
      } else {
        throw new Error('Failed to convert');
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      toast({
        title: "Conversion Failed",
        description: `Failed to convert quote to ${type === 'invoice' ? 'Invoice' : 'Sales Order'}`,
        variant: "destructive"
      });
    }
  };

  const handleClone = async () => {
    if (!selectedQuote) return;
    setLocation(`/quotes/create?cloneFrom=${selectedQuote.id}`);
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilter === "all" || quote.status === activeFilter;
    return matchesSearch && matchesStatus;
  });

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredQuotes, 10);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="estimates-layout">
        <ResizablePanel
          defaultSize={selectedQuote ? 40 : 100}
          minSize={40}
          className="flex flex-col h-full overflow-hidden bg-white border-r border-slate-200"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className={`flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 ${selectedQuote ? 'h-[73px]' : 'h-[73px] md:h-auto'}`}>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-1.5 text-xl font-semibold text-slate-900 dark:text-white p-0 h-auto hover:bg-transparent"
                        data-testid="button-filter-dropdown"
                      >
                        {getFilterLabel()}
                        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {QUOTE_FILTERS.map((filter) => (
                        <DropdownMenuItem
                          key={filter.id}
                          className={`flex items-center justify-between ${activeFilter === filter.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => {
                            setActiveFilter(filter.id);
                            setFilterDropdownOpen(false);
                          }}
                          data-testid={`filter-${filter.id}`}
                        >
                          <span className={activeFilter === filter.id ? 'font-medium text-blue-600' : ''}>
                            {filter.label}
                          </span>
                          <button
                            className="ml-2 text-slate-400 hover:text-yellow-500"
                            onClick={(e) => toggleFavorite(filter.id, e)}
                            data-testid={`favorite-${filter.id}`}
                          >
                            {favoriteFilters.includes(filter.id) ? (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                          </button>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="relative flex-1 max-w-[240px] hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-search-header"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedQuote && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
                    <Search className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => setLocation("/estimates/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-new-quote"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Quote
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-9 w-9 bg-[#ebebeb] text-[#101c2e] hover-elevate active-elevate-2" data-testid="button-more-options">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1">
                    <DropdownMenuItem onClick={fetchQuotes} className="flex items-center cursor-pointer mb-1">
                      <RefreshCw className="mr-2 h-4 w-4 text-slate-500" />
                      <span className="text-slate-700">Refresh List</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className={`flex flex-col flex-grow min-h-0 overflow-hidden ${selectedQuote ? 'p-0' : 'p-4 pb-0'}`}>
              <div className="flex-1 overflow-auto scrollbar-hide pb-4">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">Loading quotes...</div>
                ) : selectedQuote ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600' : ''
                          }`}
                        onClick={() => handleQuoteClick(quote)}
                        data-testid={`card-quote-${quote.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onCheckedChange={() => toggleSelectQuote(quote.id, {} as any)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-slate-900 dark:text-white truncate uppercase">
                                {quote.quoteNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-slate-500 truncate">
                                {quote.customerName}
                              </div>
                              <div className="text-xs font-semibold">
                                {formatCurrency(quote.total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="w-10 px-3 py-3 text-left border-b border-slate-200 bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                          <Checkbox
                            checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedQuotes.length === filteredQuotes.length) {
                                setSelectedQuotes([]);
                              } else {
                                setSelectedQuotes(filteredQuotes.map(q => q.id));
                              }
                            }}
                          />
                        </th>
                        <th className="px-3 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Date</th>
                        <th className="px-3 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Quote Number</th>
                        <th className="px-3 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Reference#</th>
                        <th className="px-3 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Customer Name</th>
                        <th className="px-3 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Status</th>
                        <th className="px-3 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]">Amount</th>
                        <th className="w-10 px-3 py-4 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 shadow-[0_1px_0_rgba(0,0,0,0.05)]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {paginatedItems.map((quote) => (
                        <tr
                          key={quote.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          onClick={() => handleQuoteClick(quote)}
                          data-testid={`row-quote-${quote.id}`}
                        >
                          <td className="px-3 py-4">
                            <Checkbox
                              checked={selectedQuotes.includes(quote.id)}
                              onClick={(e) => toggleSelectQuote(quote.id, e)}
                              className="rounded-full h-5 w-5 border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-600 dark:text-slate-400">
                            {formatDate(quote.date)}
                          </td>
                          <td className="px-3 py-4">
                            <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{quote.quoteNumber}</span>
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-500 dark:text-slate-500">
                            {quote.referenceNumber || '-'}
                          </td>
                          <td className="px-3 py-4 text-[13px] text-slate-900 dark:text-slate-200 font-medium">
                            {quote.customerName}
                          </td>
                          <td className="px-3 py-4">
                            {getStatusBadge(quote.status, quote.convertedTo)}
                          </td>
                          <td className="px-3 py-4 text-right text-[13px] font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(quote.total)}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuoteClick(quote); }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditQuote(); }}>
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="flex-none mt-auto border-t border-slate-200 bg-white">
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

        {selectedQuote && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
              <div className="h-full flex flex-col overflow-hidden bg-white">
                <QuoteDetailPanel
                  quote={selectedQuote}
                  branding={branding}
                  onClose={handleClosePanel}
                  onEdit={handleEditQuote}
                  onDelete={handleDeleteClick}
                  onConvert={handleConvert}
                  onClone={handleClone}
                  organization={currentOrganization}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
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
    </div >
  );
}
