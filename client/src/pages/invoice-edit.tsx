import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Printer,
  Share2,
  Search,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDays, endOfMonth, addMonths, format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";

interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percentage' | 'flat';
  tax: string;
  originalTaxName: string;
  taxAmount: number;
  amount: number;
  isModified?: boolean;
  taxModified?: boolean;
}

interface ItemOption {
  id: string;
  name: string;
  description?: string;
  rate: string;
  hsnSac: string;
  type: string;
  taxPreference: string;
  intraStateTax: string;
  interStateTax: string;
  usageUnit: string;
  isActive: boolean;
}

const TAX_OPTIONS = [
  { label: "Non-taxable", value: "none", rate: 0 },
  { label: "GST0 [0%]", value: "GST0", rate: 0 },
  { label: "GST5 [5%]", value: "GST5", rate: 5 },
  { label: "GST12 [12%]", value: "GST12", rate: 12 },
  { label: "GST18 [18%]", value: "GST18", rate: 18 },
  { label: "GST28 [28%]", value: "GST28", rate: 28 },
];

const TERMS_OPTIONS = [
  { value: "Due on Receipt", label: "Due on Receipt", days: 0 },
  { value: "Net 15", label: "Net 15", days: 15 },
  { value: "Net 30", label: "Net 30", days: 30 },
  { value: "Net 45", label: "Net 45", days: 45 },
  { value: "Net 60", label: "Net 60", days: 60 },
];

const getTaxRate = (taxValue: string): number => {
  const option = TAX_OPTIONS.find(t => t.value === taxValue);
  return option?.rate || 0;
};

export default function InvoiceEdit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [billingAddress, setBillingAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [selectedSalesperson, setSelectedSalesperson] = useState("");
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchInvoice();
    fetchSalespersons();
    fetchItems();
  }, [params.id]);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      if (response.ok) {
        const data = await response.json();
        setSalespersons(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch salespersons:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data.items || [];
        // Filter only active items
        const activeItems = items.filter((item: ItemOption) => item.isActive !== false);
        setItemOptions(activeItems);
      } else {
        console.error('Failed to fetch items:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const invoice = data.data;

        setInvoiceNumber(invoice.invoiceNumber);
        setDate(new Date(invoice.date));
        setDueDate(new Date(invoice.dueDate));
        setCustomerName(invoice.customerName);
        setCustomerId(invoice.customerId);
        setPaymentTerms(invoice.paymentTerms);
        setBillingAddress(invoice.billingAddress?.street || '');
        setCustomerNotes(invoice.customerNotes || '');
        setTermsAndConditions(invoice.termsAndConditions || '');
        setItems(invoice.items.map((item: any, index: number) => {
          const storedTaxName = item.taxName || 'GST18';
          const knownTax = TAX_OPTIONS.find(t => t.value === storedTaxName);
          return {
            id: item.id || String(index + 1),
            itemId: item.itemId || '',
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discountType === 'percentage'
              ? (item.rate && item.quantity ? (item.discount / (item.rate * item.quantity)) * 100 : 0)
              : (item.discount || 0),
            discountType: item.discountType || 'flat',
            tax: knownTax ? storedTaxName : 'custom',
            originalTaxName: storedTaxName,
            taxAmount: item.tax || 0,
            amount: item.amount,
            isModified: false,
            taxModified: false
          };
        }));
        setShippingCharges(invoice.shippingCharges || 0);
        setAdjustment(invoice.adjustment || 0);
        setSelectedSalesperson(invoice.salesperson || "");
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLineItem = (item: InvoiceItem, forceRecalc: boolean = false) => {
    const baseAmount = item.quantity * item.rate;
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (Math.min(item.discount, 100) / 100);
    } else {
      discountAmount = item.discount;
    }
    discountAmount = Math.min(discountAmount, baseAmount);
    const taxableAmount = baseAmount - discountAmount;

    if (!item.isModified && !forceRecalc) {
      return {
        baseAmount,
        discountAmount,
        taxableAmount,
        taxAmount: item.taxAmount,
        total: item.amount
      };
    }

    const taxRate = getTaxRate(item.tax);
    const taxAmount = taxableAmount * (taxRate / 100);
    return {
      baseAmount,
      discountAmount,
      taxableAmount,
      taxAmount,
      total: taxableAmount + taxAmount
    };
  };

  const totals = items.reduce((acc, item) => {
    const line = calculateLineItem(item);
    return {
      subtotal: acc.subtotal + line.taxableAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total
    };
  }, { subtotal: 0, totalTax: 0, grandTotal: 0 });

  const finalTotal = totals.grandTotal + shippingCharges + adjustment;

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = itemOptions.find(i => i.id === itemId);
    if (selectedItem) {
      const rate = parseFloat(selectedItem.rate.toString().replace(/[₹,]/g, '')) || 0;
      // Extract tax rate from intraStateTax field
      const taxRate = selectedItem.intraStateTax?.includes('18') ? 18 :
        selectedItem.intraStateTax?.includes('12') ? 12 :
          selectedItem.intraStateTax?.includes('5') ? 5 :
            selectedItem.intraStateTax?.includes('28') ? 28 : 0;

      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemId,
        name: selectedItem.name,
        description: selectedItem.description || '',
        rate,
        tax: `GST${taxRate}`,
        isModified: true,
        taxModified: newItems[index].taxModified
      };
      const calc = calculateLineItem(newItems[index], true);
      newItems[index].taxAmount = calc.taxAmount;
      newItems[index].amount = calc.total;
      setItems(newItems);
    }
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'discountType' || field === 'tax') {
      newItems[index].isModified = true;
      if (field === 'tax') {
        newItems[index].taxModified = true;
      }
      const calc = calculateLineItem(newItems[index], true);
      newItems[index].taxAmount = calc.taxAmount;
      newItems[index].amount = calc.total;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: String(Date.now()),
      itemId: '',
      name: '',
      description: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: 'percentage',
      tax: 'GST18',
      originalTaxName: 'GST18',
      taxAmount: 0,
      amount: 0,
      isModified: true,
      taxModified: true
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const invoiceItems = items.map(item => {
        const lineCalc = calculateLineItem(item);
        const effectiveTaxName = item.taxModified
          ? (item.tax === 'custom' ? item.originalTaxName : item.tax)
          : item.originalTaxName;
        return {
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: 'pcs',
          rate: item.rate,
          discount: lineCalc.discountAmount,
          discountType: item.discountType,
          tax: lineCalc.taxAmount,
          taxName: effectiveTaxName,
          amount: lineCalc.total
        };
      });

      const invoiceData = {
        date: format(date, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        customerId,
        customerName,
        billingAddress: {
          street: billingAddress,
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        paymentTerms,
        salesperson: selectedSalesperson,
        items: invoiceItems,
        subTotal: totals.subtotal,
        shippingCharges,
        cgst: totals.totalTax / 2,
        sgst: totals.totalTax / 2,
        igst: 0,
        adjustment,
        total: finalTotal,
        customerNotes,
        termsAndConditions
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        toast({
          title: "Invoice Updated",
          description: `Invoice ${invoiceNumber} has been updated successfully.`,
        });
        setLocation("/invoices");
      } else {
        throw new Error('Failed to update invoice');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/invoices')} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Invoice</h1>
            <p className="text-sm text-muted-foreground">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input value={customerName} disabled className="bg-muted/50" data-testid="input-customer-name" />
            </div>
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input value={invoiceNumber} disabled className="bg-muted/50" data-testid="input-invoice-number" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    data-testid="button-invoice-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger data-testid="select-payment-terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    data-testid="button-due-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setDueDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Salesperson</Label>
              <Select value={selectedSalesperson} onValueChange={(val) => {
                if (val === "manage_salespersons") {
                  setShowManageSalespersons(true);
                } else {
                  setSelectedSalesperson(val);
                }
              }}>
                <SelectTrigger data-testid="select-salesperson">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-blue-600 cursor-pointer hover:bg-accent"
                    onClick={() => setShowManageSalespersons(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Manage Salespersons
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Item Table</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddItem} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[30%] min-w-[200px]">Item Details</TableHead>
                  <TableHead className="w-[10%] min-w-[80px]">Qty</TableHead>
                  <TableHead className="w-[12%] min-w-[100px]">Rate</TableHead>
                  <TableHead className="w-[15%] min-w-[120px]">Discount</TableHead>
                  <TableHead className="w-[13%] min-w-[100px]">Tax</TableHead>
                  <TableHead className="w-[10%] min-w-[80px]">Tax Amt</TableHead>
                  <TableHead className="w-[10%] min-w-[100px] text-right">Amount</TableHead>
                  <TableHead className="w-[5%] min-w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const lineCalc = calculateLineItem(item);
                  return (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="py-3">
                        <div className="space-y-2">
                          <Select
                            value={item.itemId || "custom"}
                            onValueChange={(val) => {
                              if (val === "create_new_item") {
                                setLocation('/items/create');
                                return;
                              }
                              handleItemChange(index, val);
                            }}
                          >
                            <SelectTrigger className="h-9" data-testid={`select-item-${index}`}>
                              <SelectValue placeholder="Select item">
                                {item.name || "Select item"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {itemOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                              ))}
                              <Separator className="my-1" />
                              <SelectItem value="create_new_item" className="text-primary font-medium cursor-pointer">
                                + Create New Item
                              </SelectItem>
                            </SelectContent>
                          </Select>

                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          data-testid={`input-item-qty-${index}`}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          data-testid={`input-item-rate-${index}`}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex shadow-sm rounded-md">
                          <Input
                            type="number"
                            min="0"
                            max={item.discountType === 'percentage' ? 100 : undefined}
                            value={item.discount}
                            onChange={(e) => handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="h-9 rounded-r-none border-r-0"
                            data-testid={`input-item-discount-${index}`}
                          />
                          <Select
                            value={item.discountType}
                            onValueChange={(val: 'percentage' | 'flat') => handleUpdateItem(index, 'discountType', val)}
                          >
                            <SelectTrigger className="h-9 w-[55px] rounded-l-none border-l-0 bg-muted/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="flat">Rs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Select
                          value={item.tax}
                          onValueChange={(val) => handleUpdateItem(index, 'tax', val)}
                        >
                          <SelectTrigger className="h-9" data-testid={`select-item-tax-${index}`}>
                            <SelectValue placeholder="Tax" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatCurrency(lineCalc.taxAmount)}
                      </TableCell>
                      <TableCell className="py-3 text-right font-medium">
                        {formatCurrency(lineCalc.total)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Notes visible to customer..."
                rows={4}
                data-testid="textarea-customer-notes"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Terms and conditions..."
                rows={4}
                data-testid="textarea-terms"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Shipping Charges</span>
                <Input
                  type="number"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 text-right"
                  data-testid="input-shipping"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Adjustment</span>
                <Input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  className="w-24 h-8 text-right"
                  data-testid="input-adjustment"
                />
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-blue-600" data-testid="text-total">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-card/80 backdrop-blur-md border-t border-border/60 p-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => setLocation("/invoices")} data-testid="button-cancel">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="button-save">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
      <ManageSalespersonsDialog
        open={showManageSalespersons}
        onOpenChange={setShowManageSalespersons}
        onSalespersonChange={fetchSalespersons}
      />
    </div>
  );
}
