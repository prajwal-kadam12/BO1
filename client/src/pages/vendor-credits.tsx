import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Trash2, Edit, FileText, ChevronDown, X, Printer, Receipt, Copy, Ban, BookOpen, RotateCcw, CheckCircle2, Download, Eye } from "lucide-react";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/use-branding";
import { useOrganization } from "@/context/OrganizationContext";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { Organization } from "@shared/schema";

interface VendorCreditItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  hsnSac?: string;
  account: string;
  quantity: number;
  rate: string | number;
  tax: string;
  amount: number;
}

interface VendorCredit {
  id: string;
  creditNumber: string;
  vendorId: string;
  vendorName: string;
  referenceNumber?: string;
  orderNumber?: string;
  date: string;
  subject?: string;
  reverseCharge?: boolean;
  taxType?: string;
  tdsTcs?: string;
  items: VendorCreditItem[];
  subTotal: number;
  discountType?: string;
  discountValue?: string;
  discountAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  tdsTcsAmount?: number;
  adjustment?: number;
  amount: number;
  balance: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  billDate: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  creditsApplied?: Array<{
    creditId: string;
    creditNumber: string;
    amount: number;
    appliedDate: string;
  }>;
}

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
  billingAddress?: {
    attention?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    countryRegion?: string;
  };
  gstin?: string;
  sourceOfSupply?: string;
}

function SignatureLine() {
  const { data: brandingData } = useBranding();

  if (brandingData?.signature?.url) {
    return (
      <div className="flex flex-col gap-2">
        <img
          src={brandingData.signature.url}
          alt="Authorized Signature"
          style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
        />
        <p className="text-xs text-muted-foreground">Authorized Signature</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">Authorized Signature ____________________</p>
  );
}

export default function VendorCredits() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCredit, setSelectedCredit] = useState<VendorCredit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creditToDelete, setCreditToDelete] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [activeTab, setActiveTab] = useState("document");
  const [applyToBillsOpen, setApplyToBillsOpen] = useState(false);
  const [vendorBills, setVendorBills] = useState<Bill[]>([]);
  const [creditsToApply, setCreditsToApply] = useState<{ [billId: string]: number }>({});
  const [setAppliedOnDate, setSetAppliedOnDate] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showPdfView, setShowPdfView] = useState(false);
  const journalTabRef = useRef<HTMLButtonElement>(null);

  const { data: vendorCreditsData, isLoading, refetch } = useQuery<{ success: boolean; data: VendorCredit[] }>({
    queryKey: ['/api/vendor-credits'],
  });

  const { data: vendorsData } = useQuery<{ success: boolean; data: Vendor[] }>({
    queryKey: ['/api/vendors'],
  });

  const { data: branding } = useBranding();
  const { currentOrganization } = useOrganization();

  const vendors = vendorsData?.data || [];

  const handleDelete = (id: string) => {
    setCreditToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!creditToDelete) return;
    try {
      const response = await fetch(`/api/vendor-credits/${creditToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Vendor credit deleted successfully" });
        if (selectedCredit?.id === creditToDelete) {
          setSelectedCredit(null);
        }
        refetch();
      } else {
        toast({ title: "Failed to delete vendor credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete vendor credit", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setCreditToDelete(null);
    }
  };

  const handleRefund = () => {
    if (selectedCredit) {
      setRefundAmount(selectedCredit.balance.toString());
      setRefundReason("");
      setRefundDialogOpen(true);
    }
  };

  const confirmRefund = async () => {
    if (!selectedCredit) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedCredit.balance) {
      toast({ title: "Invalid refund amount", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/vendor-credits/${selectedCredit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: selectedCredit.balance - amount,
          status: selectedCredit.balance - amount <= 0 ? 'REFUNDED' : selectedCredit.status,
        }),
      });
      if (response.ok) {
        toast({ title: "Refund processed successfully" });
        refetch();
        setRefundDialogOpen(false);
        const updatedCredit = await response.json();
        if (updatedCredit.data) {
          setSelectedCredit(updatedCredit.data);
        }
      } else {
        toast({ title: "Failed to process refund", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to process refund", variant: "destructive" });
    }
  };

  const handleVoid = () => {
    if (selectedCredit) {
      setVoidDialogOpen(true);
    }
  };

  const confirmVoid = async () => {
    if (!selectedCredit) return;
    try {
      const response = await fetch(`/api/vendor-credits/${selectedCredit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VOID' }),
      });
      if (response.ok) {
        toast({ title: "Vendor credit voided successfully" });
        refetch();
        setVoidDialogOpen(false);
        const updatedCredit = await response.json();
        if (updatedCredit.data) {
          setSelectedCredit(updatedCredit.data);
        }
      } else {
        toast({ title: "Failed to void vendor credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to void vendor credit", variant: "destructive" });
    }
  };

  const handleClone = async () => {
    if (!selectedCredit) return;
    try {
      const clonedData = {
        vendorId: selectedCredit.vendorId,
        vendorName: selectedCredit.vendorName,
        orderNumber: selectedCredit.orderNumber,
        referenceNumber: selectedCredit.referenceNumber,
        vendorCreditDate: new Date().toISOString().split('T')[0],
        subject: selectedCredit.subject,
        reverseCharge: selectedCredit.reverseCharge,
        taxType: selectedCredit.taxType,
        tdsTcs: selectedCredit.tdsTcs,
        items: selectedCredit.items,
        subTotal: selectedCredit.subTotal,
        discountType: selectedCredit.discountType,
        discountValue: selectedCredit.discountValue,
        discountAmount: selectedCredit.discountAmount,
        cgst: selectedCredit.cgst,
        sgst: selectedCredit.sgst,
        igst: selectedCredit.igst,
        tdsTcsAmount: selectedCredit.tdsTcsAmount,
        adjustment: selectedCredit.adjustment,
        total: selectedCredit.amount,
        notes: selectedCredit.notes,
        status: 'DRAFT',
      };
      const response = await fetch('/api/vendor-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedData),
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: `Vendor credit cloned as ${result.data.creditNumber}` });
        refetch();
        setSelectedCredit(result.data);
      } else {
        toast({ title: "Failed to clone vendor credit", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to clone vendor credit", variant: "destructive" });
    }
  };

  const handleViewJournal = () => {
    setActiveTab("journal");
  };

  const handleApplyToBills = async () => {
    if (!selectedCredit) return;

    try {
      // Fetch unpaid bills for the vendor
      const response = await fetch(`/api/bills?vendorId=${selectedCredit.vendorId}`);
      if (response.ok) {
        const data = await response.json();
        const unpaidBills = data.data.filter((bill: Bill) =>
          bill.status !== 'PAID' && bill.status !== 'VOID' && bill.balanceDue > 0
        );
        setVendorBills(unpaidBills);
        setCreditsToApply({});
        setApplyToBillsOpen(true);
      }
    } catch (error) {
      toast({ title: "Failed to fetch bills", variant: "destructive" });
    }
  };

  const handleCreditAmountChange = (billId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    const bill = vendorBills.find(b => b.id === billId);

    if (!bill || !selectedCredit) return;

    // Validate: don't exceed bill balance or available credit
    const currentTotal = Object.entries(creditsToApply)
      .filter(([id]) => id !== billId)
      .reduce((sum, [, amt]) => sum + amt, 0);

    const availableCredit = selectedCredit.balance - currentTotal;
    const maxApplicable = Math.min(bill.balanceDue, availableCredit);

    if (amount <= maxApplicable && amount >= 0) {
      setCreditsToApply(prev => ({
        ...prev,
        [billId]: amount
      }));
    }
  };

  const getTotalAmountToCredit = () => {
    return Object.values(creditsToApply).reduce((sum, amt) => sum + amt, 0);
  };

  const getRemainingCredits = () => {
    if (!selectedCredit) return 0;
    return selectedCredit.balance - getTotalAmountToCredit();
  };

  const handleSaveApplyCredits = async () => {
    if (!selectedCredit) return;

    const totalToApply = getTotalAmountToCredit();
    if (totalToApply === 0) {
      toast({ title: "No credits to apply", variant: "destructive" });
      return;
    }

    setIsApplying(true);
    try {
      const appliedDate = setAppliedOnDate ? new Date().toISOString().split('T')[0] : selectedCredit.date;

      const response = await fetch(`/api/vendor-credits/${selectedCredit.id}/apply-to-bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditsToApply,
          appliedDate
        })
      });

      if (response.ok) {
        toast({ title: "Credits applied successfully" });
        setApplyToBillsOpen(false);
        refetch();
        // Refresh the selected credit
        const updatedResponse = await fetch(`/api/vendor-credits/${selectedCredit.id}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setSelectedCredit(updatedData.data);
        }
      } else {
        const error = await response.json();
        toast({ title: error.message || "Failed to apply credits", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to apply credits", variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const vendorCredits = vendorCreditsData?.data || [];

  const filteredVendorCredits = vendorCredits.filter(credit =>
    credit.creditNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credit.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credit.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredVendorCredits, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getVendorDetails = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId);
  };

  const calculateTaxDetails = (credit: VendorCredit) => {
    let cgst = 0;
    let sgst = 0;

    credit.items.forEach(item => {
      if (item.tax && item.tax.includes('gst')) {
        const rate = parseFloat(item.rate.toString());
        const quantity = item.quantity;
        const baseAmount = rate * quantity;

        if (item.tax === 'gst_18') {
          cgst += baseAmount * 0.09;
          sgst += baseAmount * 0.09;
        } else if (item.tax === 'gst_12') {
          cgst += baseAmount * 0.06;
          sgst += baseAmount * 0.06;
        } else if (item.tax === 'gst_5') {
          cgst += baseAmount * 0.025;
          sgst += baseAmount * 0.025;
        }
      }
    });

    return { cgst, sgst };
  };

  const getJournalEntries = (credit: VendorCredit) => {
    const { cgst, sgst } = calculateTaxDetails(credit);
    const costOfGoodsSold = credit.subTotal - (credit.discountAmount || 0);

    const entries = [
      { account: "Accounts Payable", debit: credit.amount, credit: 0 },
      { account: "Input SGST", debit: 0, credit: sgst },
      { account: "Input CGST", debit: 0, credit: cgst },
      { account: "Cost of Goods Sold", debit: 0, credit: costOfGoodsSold },
    ];

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return { entries, totalDebit, totalCredit };
  };

  const handlePrint = async () => {
    toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await robustIframePrint("vendor-credit-pdf-content");
    } catch (error) {
      console.error("Print error:", error);
      toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedCredit) return;
    toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

    if (!showPdfView) {
      setShowPdfView(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      await generatePDFFromElement("vendor-credit-pdf-content", `VendorCredit-${selectedCredit.creditNumber}.pdf`);
      toast({ title: "Success", description: "Vendor credit downloaded successfully." });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen flex w-full overflow-hidden bg-slate-50 animate-in fade-in duration-500">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="vendor-credits-layout">
        <ResizablePanel
          defaultSize={selectedCredit ? 30 : 100}
          minSize={20}
          className="flex flex-col overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between gap-2 p-4 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-lg font-semibold" data-testid="dropdown-all-vendor-credits">
                  All Vendor Credits
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>All Vendor Credits</DropdownMenuItem>
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem>Closed</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => setLocation('/vendor-credits/new')}
                data-testid="button-add-vendor-credit"
              >
                <Plus className="h-4 w-4" /> New
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-more-options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Import Vendor Credits</DropdownMenuItem>
                  <DropdownMenuItem>Export Vendor Credits</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!selectedCredit && (
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendor credits..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-vendor-credits"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vendorCredits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2" data-testid="text-vendor-credits-empty">No vendor credits</h3>
              <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                Record credits from vendors for returns or adjustments to apply against future bills.
              </p>
              <Button
                className="gap-2"
                onClick={() => setLocation('/vendor-credits/new')}
                data-testid="button-add-first-vendor-credit"
              >
                <Plus className="h-4 w-4" /> Add Your First Vendor Credit
              </Button>
            </div>
          ) : selectedCredit ? (
            <div className="flex-1 overflow-auto">
              {paginatedItems.map((credit) => (
                <div
                  key={credit.id}
                  className={`p-3 border-b cursor-pointer transition-colors ${selectedCredit?.id === credit.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                    }`}
                  onClick={() => setSelectedCredit(credit)}
                  data-testid={`row-vendor-credit-${credit.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-vendor-credit-${credit.id}`}
                      />
                      <div>
                        <p className="font-medium text-sm">{credit.vendorName}</p>
                        <p className="text-primary text-xs">{credit.creditNumber} | {formatDate(credit.date)}</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${credit.status === 'OPEN' ? 'text-blue-600 border-blue-200' :
                            credit.status === 'CLOSED' ? 'text-gray-600 border-gray-200' :
                              'text-yellow-600 border-yellow-200'
                            }`}
                        >
                          {credit.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(credit.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        <Checkbox data-testid="checkbox-select-all" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Credit Note#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vendor Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Balance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                        <Search className="h-4 w-4 mx-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedItems.map((credit) => (
                      <tr
                        key={credit.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedCredit(credit)}
                        data-testid={`row-vendor-credit-${credit.id}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox data-testid={`checkbox-vendor-credit-${credit.id}`} />
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(credit.date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-primary">{credit.creditNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{credit.referenceNumber || credit.orderNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm uppercase">{credit.vendorName}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            variant="outline"
                            className={`${credit.status === 'OPEN' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                              credit.status === 'CLOSED' ? 'text-gray-600 border-gray-200 bg-gray-50' :
                                'text-yellow-600 border-yellow-200 bg-yellow-50'
                              }`}
                          >
                            {credit.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(credit.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(credit.balance)}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-vendor-credit-actions-${credit.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setLocation(`/vendor-credits/${credit.id}/edit`)}
                                data-testid={`action-edit-${credit.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`action-clone-${credit.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Clone
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(credit.id)}
                                data-testid={`action-delete-${credit.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vendorCredits.length > 0 && (
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
            </>
          )}
        </ResizablePanel>

        {selectedCredit && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
              <div className="flex flex-col overflow-hidden bg-muted/20 h-full">
                <div className="flex items-center justify-between gap-2 p-3 border-b bg-background">
                  <h2 className="font-semibold text-lg">{selectedCredit.creditNumber}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setLocation(`/vendor-credits/${selectedCredit.id}/edit`)}
                      data-testid="button-edit-credit"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1" data-testid="button-pdf-print">
                          <Printer className="h-4 w-4" /> PDF/Print <ChevronDown className="h-3 w-3" />
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
                    <Button variant="outline" size="sm" data-testid="button-apply-to-bills" onClick={handleApplyToBills} disabled={!selectedCredit || selectedCredit.balance <= 0}>
                      Apply to Bills
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="button-more-actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={handleRefund}
                          className="text-primary font-medium"
                          data-testid="menu-refund"
                        >
                          Refund
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleVoid}
                          data-testid="menu-void"
                        >
                          <Ban className="mr-2 h-4 w-4" /> Void
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowPdfView(!showPdfView)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> {showPdfView ? 'View Details' : 'View PDF'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleClone}
                          data-testid="menu-clone"
                        >
                          <Copy className="mr-2 h-4 w-4" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleViewJournal}
                          data-testid="menu-view-journal"
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> View Journal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(selectedCredit.id)}
                          data-testid="menu-delete"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCredit(null)}
                      data-testid="button-close-detail"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="document">Overview</TabsTrigger>
                      <TabsTrigger value="journal" ref={journalTabRef}>Journal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="document">
                      {showPdfView ? (
                        <div className="max-w-4xl mx-auto shadow-lg bg-white my-8">
                          <div
                            id="vendor-credit-pdf-content"
                            className="bg-white border border-slate-200"
                            style={{
                              width: '210mm',
                              minHeight: '297mm',
                              backgroundColor: 'white',
                              padding: '48px',
                              fontFamily: 'Arial, sans-serif',
                              color: '#000',
                              margin: '0 auto',
                              position: 'relative'
                            }}
                          >
                            <div className="absolute top-0 left-0 -rotate-45 origin-center transform -translate-x-6 translate-y-8 no-print">
                              <Badge className="bg-blue-500 text-white px-6 py-1 text-xs">
                                {selectedCredit.status}
                              </Badge>
                            </div>
                            {/* Standard Purchase PDF Header */}
                            <PurchasePDFHeader
                              logo={branding?.logo ?? undefined}
                              documentTitle="Vendor Credit"
                              documentNumber={selectedCredit.creditNumber}
                              date={selectedCredit.date}
                              referenceNumber={selectedCredit.referenceNumber}
                              organization={currentOrganization ?? undefined}
                            />

                            {/* Credits Remaining Badge */}
                            <div className="flex justify-end mb-6">
                              <div className="bg-primary/10 px-4 py-3 rounded">
                                <p className="text-xs text-muted-foreground">Credits Remaining</p>
                                <p className="text-xl font-bold">{formatCurrency(selectedCredit.balance)}</p>
                              </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="grid grid-cols-2 gap-8 mb-8">
                              <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Vendor Address</h3>
                                <p className="text-sm font-semibold text-primary uppercase">{selectedCredit.vendorName}</p>
                                {(() => {
                                  const vendor = getVendorDetails(selectedCredit.vendorId);
                                  if (vendor?.billingAddress) {
                                    return (
                                      <>
                                        {vendor.billingAddress.attention && (
                                          <p className="text-sm text-muted-foreground">{vendor.billingAddress.attention}</p>
                                        )}
                                        {vendor.billingAddress.street1 && (
                                          <p className="text-sm text-muted-foreground">{vendor.billingAddress.street1}</p>
                                        )}
                                        {vendor.billingAddress.city && (
                                          <p className="text-sm text-muted-foreground">{vendor.billingAddress.city}</p>
                                        )}
                                        {vendor.billingAddress.state && (
                                          <p className="text-sm text-muted-foreground">{vendor.billingAddress.state}</p>
                                        )}
                                        {vendor.billingAddress.pinCode && (
                                          <p className="text-sm text-muted-foreground">{vendor.billingAddress.pinCode}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground">India</p>
                                        {vendor.gstin && (
                                          <p className="text-sm text-muted-foreground">GSTIN {vendor.gstin}</p>
                                        )}
                                      </>
                                    );
                                  }
                                  return <p className="text-sm text-muted-foreground">India</p>;
                                })()}
                              </div>
                              <div className="text-right">
                                <div className="inline-block text-left">
                                  <p className="text-sm"><span className="text-muted-foreground">Date:</span> {formatDate(selectedCredit.date)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden mb-6">
                              <table className="w-full">
                                <thead className="bg-primary text-primary-foreground">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium">Item & Description</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium">HSN/SAC</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium">Rate</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedCredit.items.map((item, index) => (
                                    <tr key={item.id} className="border-b">
                                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <div>
                                          <p className="font-medium">{item.itemName}</p>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-center">{item.hsnSac || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(parseFloat(item.rate.toString()))}</td>
                                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-end mb-6">
                              <div className="w-72">
                                <div className="flex justify-between py-2 text-sm">
                                  <span className="text-muted-foreground">Sub Total</span>
                                  <span className="font-medium">{formatCurrency(selectedCredit.subTotal)}</span>
                                </div>
                                {(() => {
                                  const { cgst, sgst } = calculateTaxDetails(selectedCredit);
                                  return (
                                    <>
                                      {cgst > 0 && (
                                        <div className="flex justify-between py-2 text-sm">
                                          <span className="text-muted-foreground">CGST (9%)</span>
                                          <span className="font-medium">{formatCurrency(cgst)}</span>
                                        </div>
                                      )}
                                      {sgst > 0 && (
                                        <div className="flex justify-between py-2 text-sm">
                                          <span className="text-muted-foreground">SGST (9%)</span>
                                          <span className="font-medium">{formatCurrency(sgst)}</span>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                                {(selectedCredit.discountAmount || 0) > 0 && (
                                  <div className="flex justify-between py-2 text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="font-medium text-red-500">-{formatCurrency(selectedCredit.discountAmount || 0)}</span>
                                  </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between py-2 text-sm font-semibold">
                                  <span>Total</span>
                                  <span className="text-primary">{formatCurrency(selectedCredit.amount)}</span>
                                </div>
                                <div className="flex justify-between py-2 bg-green-50 dark:bg-green-950 px-3 rounded text-sm">
                                  <span className="font-medium">Credits Remaining</span>
                                  <span className="font-bold text-green-600">{formatCurrency(selectedCredit.balance)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-12 border-t pt-4">
                              <SignatureLine />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Summary Card */}
                          <Card className="bg-white dark:bg-card">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-8">
                                <div>
                                  <h3 className="text-xl font-bold mb-1">Credit Note for {selectedCredit.vendorName}</h3>
                                  <p className="text-sm text-muted-foreground">Date: {formatDate(selectedCredit.date)}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">{formatCurrency(selectedCredit.amount)}</div>
                                  <Badge variant="outline" className="mt-1">{selectedCredit.status}</Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                <div>
                                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Credit Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b pb-1">
                                      <span className="text-muted-foreground">Credit Number:</span>
                                      <span className="font-medium">{selectedCredit.creditNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                      <span className="text-muted-foreground">Reference:</span>
                                      <span className="font-medium">{selectedCredit.referenceNumber || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                      <span className="text-muted-foreground">Remaining Balance:</span>
                                      <span className="font-bold text-green-600">{formatCurrency(selectedCredit.balance)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Recent Activity or Items list can go here if needed, but the PDF is better */}
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-sm text-muted-foreground text-center">
                                Use the "View PDF" option to see the full document.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="journal">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">INR</Badge>
                            <span className="text-sm text-muted-foreground">Amount is displayed in your base currency</span>
                          </div>

                          <h3 className="font-semibold mb-4">Vendor Credits</h3>

                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Account</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Debit</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const { entries, totalDebit, totalCredit } = getJournalEntries(selectedCredit);
                                  return (
                                    <>
                                      {entries.map((entry, index) => (
                                        <tr key={index} className="border-b">
                                          <td className="px-4 py-3 text-sm">{entry.account}</td>
                                          <td className="px-4 py-3 text-sm text-right">
                                            {entry.debit > 0 ? formatCurrency(entry.debit) : '0.00'}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right">
                                            {entry.credit > 0 ? formatCurrency(entry.credit) : '0.00'}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr className="bg-muted/30 font-semibold">
                                        <td className="px-4 py-3 text-sm"></td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(totalDebit)}</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(totalCredit)}</td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Credit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor credit? This action cannot be undone.
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

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Vendor Credit</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the amount to refund from this vendor credit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                data-testid="input-refund-amount"
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {selectedCredit ? formatCurrency(selectedCredit.balance) : '0.00'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund"
                data-testid="input-refund-reason"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRefund}>
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Vendor Credit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this vendor credit ({selectedCredit?.creditNumber})?
              This will mark the credit as void and it cannot be applied to any bills.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoid} className="bg-orange-600 hover:bg-orange-700">
              Void Credit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply to Bills Dialog */}
      <Dialog open={applyToBillsOpen} onOpenChange={setApplyToBillsOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Apply credits from {selectedCredit?.creditNumber}</DialogTitle>
            <DialogDescription>
              Select bills to apply credits and enter the amount to apply for each bill
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="space-y-4 py-4">
              {/* Header with toggle and available credits */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="set-applied-date">Set Applied on Date</Label>
                    <Switch
                      id="set-applied-date"
                      checked={setAppliedOnDate}
                      onCheckedChange={setSetAppliedOnDate}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Available Credits:</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(selectedCredit?.balance || 0)} ({formatDate(selectedCredit?.date || '')})
                  </p>
                </div>
              </div>

              {/* Bills Table */}
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">BILL#</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">BILL DATE</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">BILL AMOUNT</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">BILL BALANCE</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">CREDITS APPLIED ON</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">CREDITS TO APPLY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorBills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No unpaid bills found for this vendor
                          </td>
                        </tr>
                      ) : (
                        vendorBills.map((bill) => (
                          <tr key={bill.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 text-sm font-medium">{bill.billNumber}</td>
                            <td className="p-3 text-sm">{formatDate(bill.billDate)}</td>
                            <td className="p-3 text-sm text-right">{formatCurrency(bill.total)}</td>
                            <td className="p-3 text-sm text-right font-medium">{formatCurrency(bill.balanceDue)}</td>
                            <td className="p-3 text-sm text-center">
                              {setAppliedOnDate ? formatDate(new Date().toISOString()) : formatDate(selectedCredit?.date || '')}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={Math.min(bill.balanceDue, getRemainingCredits() + (creditsToApply[bill.id] || 0))}
                                step="0.01"
                                value={creditsToApply[bill.id] || ''}
                                onChange={(e) => handleCreditAmountChange(bill.id, e.target.value)}
                                className="text-right"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount to Credit:</p>
                  <p className="text-lg font-semibold">{formatCurrency(getTotalAmountToCredit())}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remaining credits:</p>
                  <p className="text-lg font-semibold text-primary">{formatCurrency(getRemainingCredits())}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyToBillsOpen(false)} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={handleSaveApplyCredits} disabled={isApplying || getTotalAmountToCredit() === 0}>
              {isApplying ? "Applying..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
