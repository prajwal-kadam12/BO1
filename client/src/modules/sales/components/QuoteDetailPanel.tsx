import React, { useState } from "react";
import { useLocation } from "wouter";
import { X, Edit, MoreHorizontal, ChevronDown, Send, Share2, FileText, RefreshCw, ExternalLink, Printer, Copy, Trash2, Download, Eye } from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { SalesPDFHeader }
  from "@/components/sales-pdf-header";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailLogList } from "@/components/communication/EmailLogList";
import { useQuery } from "@tanstack/react-query";
import { EmailLog } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

interface QuoteItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  discountType: string;
  tax: number;
  taxName: string;
  amount: number;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  link?: string;
  user: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  referenceNumber: string;
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  salesperson: string;
  projectName: string;
  subject: string;
  placeOfSupply: string;
  pdfTemplate: string;
  items: QuoteItem[];
  subTotal: number;
  shippingCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  status: string;
  emailRecipients: string[];
  createdAt: string;
  activityLogs: ActivityLog[];
}

interface QuoteDetailPanelProps {
  quote: Quote;
  onClose: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'SENT':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'DECLINED':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'CONVERTED':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    case 'emailed':
    case 'sent':
      return <div className="w-3 h-3 rounded-full bg-red-500" />;
    case 'accepted':
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    case 'converted':
      return <div className="w-3 h-3 rounded-full bg-blue-500" />;
    case 'updated':
      return <div className="w-3 h-3 rounded-full bg-yellow-500" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-slate-400" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatAddress = (address: any) => {
  const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
  return parts.length > 0 ? parts : ['-'];
};

export default function QuoteDetailPanel({ quote, onClose, onEdit, onRefresh }: QuoteDetailPanelProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [showPdfView, setShowPdfView] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const { currentOrganization } = useOrganization();

  const { data: emailLogs, isLoading: isLoadingLogs } = useQuery<EmailLog[]>({
    queryKey: ["/api/email/logs", { transactionId: quote.id }],
    enabled: !!quote.id,
  });

  React.useEffect(() => {
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

  const handleConvertToInvoice = async () => {
    setIsConverting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/convert-to-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Quote Converted",
          description: `Quote converted to Invoice ${result.data.invoice.invoiceNumber}`,
        });
        onRefresh?.();
        setLocation(`/invoices`);
      } else {
        throw new Error('Failed to convert');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert quote to invoice",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertToSalesOrder = async () => {
    setIsConverting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/convert-to-sales-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Quote Converted",
          description: `Quote converted to Sales Order ${result.data.salesOrder.salesOrderNumber}`,
        });
        onRefresh?.();
        setLocation(`/sales-orders`);
      } else {
        throw new Error('Failed to convert');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert quote to sales order",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleSendQuote = async () => {
    try {
      // Step 1: Send the email
      const emailResponse = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: quote.customerId,
          transactionId: quote.id,
          transactionType: "quote",
          subject: `Quote ${quote.quoteNumber} from ${currentOrganization?.name || 'our company'}`,
          body: `Please find the attached quote ${quote.quoteNumber} for your review.`,
          recipient: "customer@example.com", // In real app, fetch from customer data
          fromEmail: currentOrganization?.email || "billing@example.com",
          type: "manual"
        })
      });

      if (!emailResponse.ok) throw new Error('Failed to send email');

      // Step 2: Mark the quote as sent
      const response = await fetch(`/api/quotes/${quote.id}/send`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        toast({
          title: "Quote Sent",
          description: "Quote has been emailed and marked as sent to customer",
        });
        onRefresh?.();
      } else {
        throw new Error('Failed to update quote status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quote",
        variant: "destructive"
      });
    }
  };

  const handlePrintPDF = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint("quote-pdf-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await generatePDFFromElement("quote-pdf-content", `Quote-${quote.quoteNumber}.pdf`);
      toast({ title: "Success", description: "Quote downloaded successfully." });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Quote ${quote.quoteNumber}`,
        text: `Quote for ${quote.customerName} - ${formatCurrency(quote.total)}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Quote link copied to clipboard",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Quote deleted successfully" });
        onClose();
        onRefresh?.();
      }
    } catch (error) {
      toast({ title: "Failed to delete quote", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white" data-testid="text-quote-number">{quote.quoteNumber}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="text-xs font-bold">$</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} data-testid="button-close-panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onEdit} data-testid="button-edit-quote">
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" data-testid="button-send-quote">
              <Send className="h-3.5 w-3.5" />
              Send
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleSendQuote}>Send Email</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendQuote}>Send WhatsApp</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              try {
                const response = await fetch(`/api/invoices/${quote.id}/send-reminder`, { method: "POST" });
                const result = await response.json();
                if (response.ok) toast({ title: "Reminder Sent" });
                else toast({ title: "Failed", description: result.error, variant: "destructive" });
              } catch (e) {
                toast({ title: "Error", variant: "destructive" });
              }
            }}>Send Reminder (Internal Only)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleShare} data-testid="button-share-quote">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" data-testid="button-pdf-print">
              <FileText className="h-3.5 w-3.5" />
              PDF/Print
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDownloadPDF} data-testid="menu-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintPDF} data-testid="menu-print-pdf">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={isConverting || quote.status === 'CONVERTED'} data-testid="button-convert">
              <RefreshCw className={`h-3.5 w-3.5 ${isConverting ? 'animate-spin' : ''}`} />
              Convert
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleConvertToInvoice} data-testid="menu-item-convert-to-invoice">
              Convert to Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConvertToSalesOrder} data-testid="menu-item-convert-to-sales-order">
              Convert to Sales Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation(`/quotes/create?cloneFrom=${quote.id}`)} data-testid="menu-item-duplicate">
              <Copy className="h-4 w-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {quote.status !== 'CONVERTED' && quote.status !== 'SENT' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-700 dark:text-blue-400 font-medium">WHAT'S NEXT?</span>
            <span className="text-slate-600 dark:text-slate-400">Send this quote to your customer.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700" onClick={handleSendQuote} data-testid="button-send-quote-action">
              <Send className="h-3 w-3 mr-1" />
              Send Quote
            </Button>
            <Button variant="outline" size="sm" className="h-7">
              Create Project
            </Button>
          </div>
        </div>
      )}
      {quote.status === 'SENT' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-700 dark:text-blue-400 font-medium">WHAT'S NEXT?</span>
            <span className="text-slate-600 dark:text-slate-400">Convert this quote to an invoice or a sales order.</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700" disabled={isConverting}>
                  Convert
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleConvertToInvoice}>Convert to Invoice</DropdownMenuItem>
                <DropdownMenuItem onClick={handleConvertToSalesOrder}>Convert to Sales Order</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-7">
              Create Project
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
          <TabsList className="h-auto p-0 bg-transparent">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
            >
              Quote Details
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
            >
              Activity Logs
            </TabsTrigger>
            <TabsTrigger
              value="emails"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3"
            >
              Emails
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm">Show PDF View</span>
            <Switch checked={showPdfView} onCheckedChange={setShowPdfView} />
          </div>
        </div>

        {showPdfView ? (
          <TabsContent value="details" className="flex-1 overflow-auto p-6 mt-0 bg-slate-100 dark:bg-slate-800">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm" id="quote-pdf-content">
              {/* Standard Sales PDF Header with Organization Info */}
              <div className="mb-8">
                <SalesPDFHeader
                  logo={branding?.logo || undefined}
                  documentTitle="Quote"
                  documentNumber={quote.quoteNumber}
                  date={quote.date}
                  referenceNumber={quote.referenceNumber}
                  organization={currentOrganization || undefined}
                />
              </div>

              {/* Total Badge */}
              {/* <div className="flex justify-end mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(quote.total)}</p>
                </div>
              </div> */}

              <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">BILL TO</h3>
                  <p className="font-medium text-slate-900 dark:text-white">{quote.customerName}</p>
                  {formatAddress(quote.billingAddress).map((line, i) => (
                    <p key={i} className="text-slate-600 dark:text-slate-400">{line}</p>
                  ))}
                </div>
                <div className="text-right">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Quote Date:</span><span>{formatDate(quote.date)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Expiry Date:</span><span>{formatDate(quote.expiryDate)}</span></div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Item & Description</th>
                      <th className="px-4 py-2 text-center text-xs font-medium">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium">Rate</th>
                      <th className="px-4 py-2 text-right text-xs font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          <div><p className="font-medium">{item.name}</p>{item.description && <p className="text-xs text-slate-600">{item.description}</p>}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{item.quantity}{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Sub Total</span><span className="font-medium">{formatCurrency(quote.subTotal)}</span></div>
                  {quote.cgst > 0 && <div className="flex justify-between"><span className="text-slate-600">CGST (9%)</span><span className="font-medium">{formatCurrency(quote.cgst)}</span></div>}
                  {quote.sgst > 0 && <div className="flex justify-between"><span className="text-slate-600">SGST (9%)</span><span className="font-medium">{formatCurrency(quote.sgst)}</span></div>}
                  <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span className="text-slate-900 dark:text-white">{formatCurrency(quote.total)}</span></div>
                </div>
              </div>

              <div className="border-t pt-4 mt-8">
                <p className="text-xs text-slate-600 dark:text-slate-400">Authorized Signature</p>
                {branding?.signature?.url && <img src={branding.signature.url} alt="Signature" className="h-12 mt-2" />}
              </div>
            </div>
          </TabsContent>
        ) : (
          <TabsContent value="details" className="flex-1 overflow-auto p-6 mt-0">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{quote.quoteNumber}</h3>
                    <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total: {formatCurrency(quote.total)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Quote Number</span>
                  <span className="text-slate-900 dark:text-white">{quote.quoteNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Quote Date</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(quote.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Creation Date</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(quote.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Salesperson</span>
                  <span className="text-slate-900 dark:text-white">{quote.salesperson || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Place of Supply</span>
                  <span className="text-slate-900 dark:text-white">{quote.placeOfSupply || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">PDF Template</span>
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    {quote.pdfTemplate}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-slate-500 dark:text-slate-400">Subject</span>
                  <span className="text-slate-900 dark:text-white">{quote.subject || '-'}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4">Customer Details</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Name</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {quote.customerName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Billing Address</p>
                    {formatAddress(quote.billingAddress).map((line, i) => (
                      <p key={i} className="text-sm text-slate-900 dark:text-white">{line}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Shipping Address</p>
                    {formatAddress(quote.shippingAddress).map((line, i) => (
                      <p key={i} className="text-sm text-slate-900 dark:text-white">{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-base font-medium text-slate-900 dark:text-white">Items</h4>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                    {quote.items.length}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableHead className="text-xs w-12">S.NO</TableHead>
                      <TableHead className="text-xs">ITEM</TableHead>
                      <TableHead className="text-xs text-center">QTY</TableHead>
                      <TableHead className="text-xs text-right">PRICE</TableHead>
                      <TableHead className="text-xs text-right">DISCOUNT</TableHead>
                      <TableHead className="text-xs text-right">AMOUNT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{index + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {item.quantity}{item.unit}
                        </TableCell>
                        <TableCell className="text-sm text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-sm text-right">{formatCurrency(item.discount)}</TableCell>
                        <TableCell className="text-sm text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Sub Total</span>
                      <span className="font-medium">{formatCurrency(quote.subTotal)}</span>
                    </div>
                    {quote.shippingCharges > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Shipping Charge</span>
                        <span>{formatCurrency(quote.shippingCharges)}</span>
                      </div>
                    )}
                    {quote.cgst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">CGST9</span>
                        <span>{formatCurrency(quote.cgst)}</span>
                      </div>
                    )}
                    {quote.sgst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">SGST9</span>
                        <span>{formatCurrency(quote.sgst)}</span>
                      </div>
                    )}
                    {quote.adjustment !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Adjustment</span>
                        <span>{quote.adjustment}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-medium">Total</span>
                      <span className="font-semibold">{formatCurrency(quote.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-base font-medium text-slate-900 dark:text-white mb-2">Notes</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{quote.customerNotes || 'No notes added.'}</p>
              </div>

              {quote.emailRecipients.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-medium text-slate-900 dark:text-white mb-2">Email Recipients</h4>
                  {quote.emailRecipients.map((email, i) => (
                    <p key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {email}
                    </p>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="text-base font-medium text-slate-900 dark:text-white mb-2">Terms and Conditions</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{quote.termsAndConditions || 'No Terms and Conditions'}</p>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="activity" className="flex-1 overflow-auto mt-0">
          <div className="p-6 space-y-4">
            {quote.activityLogs
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400 w-40 flex-shrink-0">
                    {formatDateTime(log.timestamp)}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getActivityIcon(log.action)}</div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">{log.description}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">by {log.user}</p>
                      {log.link && (
                        <a href={log.link} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                          View the document
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="emails" className="p-0 m-0">
          <div className="p-6">
            <EmailLogList logs={emailLogs || []} isLoading={isLoadingLogs} />
          </div>
        </TabsContent>
      </Tabs>

{/* 
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Button>
      </div>
      */}

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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}