import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronDown,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Calendar as CalendarIcon,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  name: string;
  displayName: string;
  companyName: string;
  email: string;
  placeOfSupply?: string;
  currency?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  balanceDue: number;
  status: string;
}

interface PurchasedItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  unit: string;
  lastRate: number;
  totalQuantity: number;
  lastPurchaseDate: string;
  totalAmount: number;
  purchaseCount: number;
  tax: number;
  taxName: string;
}

const PAYMENT_MODES = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Other"
];

const DEPOSIT_ACCOUNTS = [
  "Petty Cash",
  "Undeposited Funds",
  "Bank Account - SBI",
  "Bank Account - HDFC",
  "Bank Account - ICICI"
];

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

export default function PaymentsReceivedCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Use transaction bootstrap hook
  const {
    customerId,
    setCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'payment' });

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [customerPurchasedItems, setCustomerPurchasedItems] = useState<PurchasedItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer");
  const [depositTo, setDepositTo] = useState<string>("Petty Cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [sendThankYou, setSendThankYou] = useState<boolean>(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, { selected: boolean; payment: number; receivedDate?: Date }>>({});
  const [totalAmountReceived, setTotalAmountReceived] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Sync with bootstrap
  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch invoices and purchased items when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerInvoices(selectedCustomerId);
      fetchCustomerPurchasedItems(selectedCustomerId);
    } else {
      setCustomerInvoices([]);
      setCustomerPurchasedItems([]);
      setSelectedInvoices({});
    }
  }, [selectedCustomerId]);

  // Re-apply auto-allocation when customer invoices are loaded
  useEffect(() => {
    if (customerInvoices.length > 0 && totalAmountReceived > 0) {
      autoAllocatePayment(totalAmountReceived);
    }
  }, [customerInvoices]);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchCustomerInvoices = async (custId: string) => {
    try {
      const response = await fetch(`/api/invoices?customerId=${custId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw invoices from API:', data.data);

        // Filter for unpaid invoices (PENDING, OVERDUE, PARTIALLY_PAID, or SENT)
        // Use balanceDue if available, otherwise use amount for new invoices
        const unpaidInvoices = (data.data || []).filter((inv: any) => {
          const balance = inv.balanceDue !== undefined ? inv.balanceDue : inv.amount;
          const isUnpaid = balance > 0 && ['PENDING', 'OVERDUE', 'PARTIALLY_PAID', 'SENT'].includes(inv.status);
          console.log(`Invoice ${inv.invoiceNumber}: balanceDue=${inv.balanceDue}, amount=${inv.amount}, status=${inv.status}, isUnpaid=${isUnpaid}`);
          return isUnpaid;
        }).map((inv: any) => ({
          ...inv,
          // Ensure balanceDue is set properly
          balanceDue: inv.balanceDue !== undefined && inv.balanceDue > 0 ? inv.balanceDue : inv.amount
        }));

        console.log('Filtered unpaid invoices:', unpaidInvoices);
        setCustomerInvoices(unpaidInvoices);

        // Initialize selection state
        const initialSelection: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};
        unpaidInvoices.forEach((inv: Invoice) => {
          initialSelection[inv.id] = { selected: false, payment: 0, receivedDate: undefined };
        });
        setSelectedInvoices(initialSelection);
      }
    } catch (error) {
      console.error('Failed to fetch customer invoices:', error);
    }
  };

  const fetchCustomerPurchasedItems = async (custId: string) => {
    try {
      const response = await fetch(`/api/customers/${custId}/purchased-items`);
      if (response.ok) {
        const data = await response.json();
        setCustomerPurchasedItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer purchased items:', error);
    }
  };

  const handleCustomerChange = (value: string) => {
    if (value === "add_new") {
      setLocation("/customers/new?returnTo=payments-received-create");
      return;
    }
    setSelectedCustomerId(value);
    onCustomerChange(value);
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const invoice = customerInvoices.find(inv => inv.id === invoiceId);
      const newSelected = !prev[invoiceId]?.selected;
      return {
        ...prev,
        [invoiceId]: {
          selected: newSelected,
          payment: newSelected ? (invoice?.balanceDue || 0) : 0,
          receivedDate: newSelected ? new Date() : undefined
        }
      };
    });
  };

  const updateInvoicePayment = (invoiceId: string, amount: number) => {
    const invoice = customerInvoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const validAmount = Math.min(Math.max(0, amount), invoice.balanceDue);
      setSelectedInvoices(prev => ({
        ...prev,
        [invoiceId]: {
          ...prev[invoiceId],
          payment: validAmount
        }
      }));
    }
  };

  const updateInvoiceReceivedDate = (invoiceId: string, date: Date) => {
    setSelectedInvoices(prev => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        receivedDate: date
      }
    }));
  };

  // Auto-allocation function
  const autoAllocatePayment = (totalAmount: number) => {
    if (customerInvoices.length === 0) {
      return; // No invoices to allocate to
    }

    if (totalAmount <= 0) {
      // Clear all selections if amount is 0 or negative
      const cleared: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};
      customerInvoices.forEach(invoice => {
        cleared[invoice.id] = {
          selected: false,
          payment: 0,
          receivedDate: undefined
        };
      });
      setSelectedInvoices(cleared);
      return;
    }

    // Sort invoices by date (oldest first) for allocation priority
    const sortedInvoices = [...customerInvoices].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let remainingAmount = totalAmount;
    const newSelectedInvoices: Record<string, { selected: boolean; payment: number; receivedDate?: Date }> = {};

    // Initialize all invoices first
    customerInvoices.forEach(invoice => {
      newSelectedInvoices[invoice.id] = {
        selected: false,
        payment: 0,
        receivedDate: undefined
      };
    });

    // Allocate amount across invoices (oldest first)
    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;

      // Use balanceDue if available, otherwise use amount
      const invoiceBalance = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.amount;
      console.log(`Allocating to invoice ${invoice.invoiceNumber}: balance=${invoiceBalance}, remaining=${remainingAmount}`);

      if (invoiceBalance > 0) {
        const paymentAmount = Math.min(remainingAmount, invoiceBalance);

        newSelectedInvoices[invoice.id] = {
          selected: true,
          payment: paymentAmount,
          receivedDate: new Date() // Default to today
        };

        remainingAmount -= paymentAmount;
        console.log(`Allocated ${paymentAmount} to ${invoice.invoiceNumber}, remaining: ${remainingAmount}`);
      }
    }

    setSelectedInvoices(newSelectedInvoices);
  };

  // Handle amount received change
  const handleAmountReceivedChange = (amount: number) => {
    setTotalAmountReceived(amount);
    autoAllocatePayment(amount);
  };

  const totalPaymentAmount = Object.values(selectedInvoices).reduce(
    (sum, inv) => sum + (inv.selected ? inv.payment : 0),
    0
  );

  const selectedInvoiceCount = Object.values(selectedInvoices).filter(inv => inv.selected).length;

  // Calculate payment summary
  const totalInvoicesAmount = customerInvoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
  const amountReceived = totalAmountReceived;
  const amountUsedForPayments = totalPaymentAmount;
  const amountRefunded = 0; // This would be calculated from refunds
  const amountInExcess = Math.max(0, amountReceived - amountUsedForPayments);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSavePayment = async () => {
    if (!selectedCustomerId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    if (totalAmountReceived <= 0) {
      toast({ title: "Please enter the amount received", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Build invoices array from selected invoices
    const selectedInvoicesList = Object.entries(selectedInvoices)
      .filter(([_, inv]) => inv.selected && inv.payment > 0)
      .map(([id, inv]) => {
        const invoice = customerInvoices.find(i => i.id === id);
        return {
          invoiceId: id,
          invoiceNumber: invoice?.invoiceNumber || '',
          invoiceDate: invoice?.date || '',
          invoiceAmount: invoice?.amount || 0,
          balanceDue: invoice?.balanceDue || 0,
          paymentAmount: inv.payment,
          paymentReceivedDate: inv.receivedDate ? format(inv.receivedDate, "yyyy-MM-dd") : format(paymentDate, "yyyy-MM-dd")
        };
      });

    console.log('Selected Invoices State:', selectedInvoices);
    console.log('Customer Invoices:', customerInvoices);
    console.log('Invoices to save:', selectedInvoicesList);

    const paymentData = {
      date: format(paymentDate, "yyyy-MM-dd"),
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.displayName || selectedCustomer?.name || '',
      customerEmail: selectedCustomer?.email || '',
      mode: paymentMode,
      depositTo: depositTo,
      referenceNumber: referenceNumber,
      amount: totalAmountReceived,
      unusedAmount: Math.max(0, totalAmountReceived - totalPaymentAmount),
      notes: notes,
      sendThankYou: sendThankYou,
      status: "PAID",
      placeOfSupply: customerSnapshot?.placeOfSupply || formData.placeOfSupply || '',
      invoices: selectedInvoicesList,
      // Store customer snapshot for immutability
      customerSnapshot: customerSnapshot
    };

    try {
      const response = await fetch('/api/payments-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        toast({
          title: "Payment Recorded",
          description: `Payment of ${formatCurrency(totalAmountReceived)} has been recorded.`
        });
        setLocation("/payments-received");
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Record Payment</h1>
          <p className="text-muted-foreground mt-1">Record a new payment from customer</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setLocation("/payments-received")} data-testid="button-close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {customerError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {customerError}. You can manually select a customer below.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer *</Label>
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-full" data-testid="select-customer">
                  <SelectValue placeholder={customersLoading ? "Loading..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id} data-testid={`customer-option-${customer.id}`}>
                      {customer.displayName || customer.name}
                    </SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <SelectItem value="add_new" className="text-primary">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Customer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {isLoadingCustomer && (
                <p className="text-xs text-muted-foreground">Loading customer details...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                    data-testid="button-payment-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Customer Info Display */}
          {selectedCustomer && customerSnapshot && (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{customerSnapshot.displayName || customerSnapshot.customerName}</span>
                {customerSnapshot.taxPreference === 'tax_exempt' && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Tax Exempt
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="text-xs text-slate-500">Currency:</span>
                  <span className="ml-2">{customerSnapshot.currency || 'INR'}</span>
                </div>
                {customerSnapshot.placeOfSupply && (
                  <div>
                    <span className="text-xs text-slate-500">Place of Supply:</span>
                    <span className="ml-2">{customerSnapshot.placeOfSupply}</span>
                  </div>
                )}
                {customerSnapshot.gstin && (
                  <div>
                    <span className="text-xs text-slate-500">GSTIN:</span>
                    <span className="ml-2">{customerSnapshot.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Deposit To</Label>
              <Select value={depositTo} onValueChange={setDepositTo}>
                <SelectTrigger data-testid="select-deposit-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_ACCOUNTS.map(account => (
                    <SelectItem key={account} value={account}>{account}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference Number</Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number"
                data-testid="input-reference"
              />
            </div>
          </div>

          {/* Amount Received Input */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Amount Received *
              </Label>
              <Input
                type="number"
                value={totalAmountReceived || ''}
                onChange={(e) => handleAmountReceivedChange(parseFloat(e.target.value) || 0)}
                placeholder="Enter total amount received"
                className="text-lg font-medium"
                data-testid="input-amount-received"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                This amount will be automatically allocated to unpaid invoices starting with the oldest.
              </p>
            </div>
          </div>

          <Separator />

          {/* Outstanding Invoices */}
          <div className="space-y-4">
            <h3 className="font-medium">Outstanding Invoices</h3>

            {selectedCustomerId ? (
              customerInvoices.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Invoice Amount</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                        <TableHead className="text-center">Payment Received On</TableHead>
                        <TableHead className="text-right">Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoices[invoice.id]?.selected || false}
                              onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                              data-testid={`checkbox-invoice-${invoice.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{formatDate(invoice.date)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.amount || 0)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.balanceDue || 0)}</TableCell>
                          <TableCell className="text-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!selectedInvoices[invoice.id]?.selected}
                                  className={cn(
                                    "w-32 justify-start text-left font-normal",
                                    !selectedInvoices[invoice.id]?.selected && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedInvoices[invoice.id]?.selected
                                    ? format(selectedInvoices[invoice.id]?.receivedDate || new Date(), "dd/MM/yyyy")
                                    : "-"
                                  }
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={selectedInvoices[invoice.id]?.receivedDate || new Date()}
                                  onSelect={(date) => date && updateInvoiceReceivedDate(invoice.id, date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={selectedInvoices[invoice.id]?.payment || 0}
                              onChange={(e) => updateInvoicePayment(invoice.id, parseFloat(e.target.value) || 0)}
                              disabled={!selectedInvoices[invoice.id]?.selected}
                              className="w-28 text-right ml-auto"
                              data-testid={`input-payment-${invoice.id}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No outstanding invoices for this customer
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Select a customer to view outstanding invoices
              </div>
            )}

            {/* Total */}
            {selectedInvoiceCount > 0 && (
              <div className="flex justify-end">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-6 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {selectedInvoiceCount} invoice(s) selected
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400">Total Payment</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(totalPaymentAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Customer Purchased Items */}
          <div className="space-y-4">
            <h3 className="font-medium">Items Purchased by Customer</h3>

            {selectedCustomerId ? (
              customerPurchasedItems.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Item Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Last Rate</TableHead>
                        <TableHead className="text-center">Total Qty</TableHead>
                        <TableHead className="text-center">Purchase Count</TableHead>
                        <TableHead>Last Purchase Date</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerPurchasedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate" title={item.description}>
                            {item.description || '-'}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.lastRate)}</TableCell>
                          <TableCell className="text-center">{item.totalQuantity}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.purchaseCount}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.lastPurchaseDate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No items purchased by this customer yet
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Select a customer to view purchased items
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Summary */}
          {selectedCustomerId && (
            <div className="space-y-4">
              <h3 className="font-medium">Payment Summary</h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Outstanding:</span>
                    <span className="font-medium">{formatCurrency(totalInvoicesAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Received:</span>
                    <span className="font-medium text-green-600">{formatCurrency(amountReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount used for Payments:</span>
                    <span className="font-medium">{formatCurrency(amountUsedForPayments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Refunded:</span>
                    <span className="font-medium">{formatCurrency(amountRefunded)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Amount in Excess:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(amountInExcess)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this payment..."
              className="min-h-[80px]"
              data-testid="textarea-notes"
            />
          </div>


          <div className="flex items-center gap-3">
            <Switch
              id="send-thank-you"
              checked={sendThankYou}
              onCheckedChange={setSendThankYou}
              data-testid="switch-thank-you"
            />
            <Label htmlFor="send-thank-you" className="text-sm">
              Send thank you email to customer
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={() => setLocation("/payments-received")} data-testid="button-cancel">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSavePayment}
              disabled={isSubmitting || !selectedCustomerId || totalAmountReceived <= 0}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
