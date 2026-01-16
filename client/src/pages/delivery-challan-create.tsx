import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { formatAddressDisplay } from "@/lib/customer-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ChallanItem {
  id: number;
  name: string;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  gstRate: number;
}

interface Customer {
  id: string;
  displayName: string;
  companyName: string;
  email: string;
  gstin?: string;
  billingAddress?: any;
  shippingAddress?: any;
}

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  hsnSac?: string;
  rate?: string | number;
  sellingPrice?: number;
  unit?: string;
  type?: string;
  intraStateTax?: string;
}

const CHALLAN_TYPES = [
  { value: "supply_on_approval", label: "Supply on Approval" },
  { value: "supply_for_job_work", label: "Supply for Job Work" },
  { value: "supply_for_repair", label: "Supply for Repair" },
  { value: "removal_for_own_use", label: "Removal for Own Use" },
  { value: "others", label: "Others" }
];

const TAX_OPTIONS = [
  { label: "Non-taxable", value: -1 },
  { label: "GST0 [0%]", value: 0 },
  { label: "GST5 [5%]", value: 5 },
  { label: "GST12 [12%]", value: 12 },
  { label: "GST18 [18%]", value: 18 },
  { label: "GST28 [28%]", value: 28 },
];

export default function DeliveryChallanCreate() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Transaction bootstrap for auto-population
  const {
    customerId: bootstrapCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData: bootstrapFormData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'delivery_challan' });

  const [date, setDate] = useState<Date>(new Date());
  const [challanNumber, setChallanNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [challanType, setChallanType] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [saving, setSaving] = useState(false);
  const [customerIdFromUrl, setCustomerIdFromUrl] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");

  // Sync with bootstrap customer
  useEffect(() => {
    if (bootstrapCustomerId && !selectedCustomerId) {
      setSelectedCustomerId(bootstrapCustomerId);
    }
  }, [bootstrapCustomerId]);

  // Update shipping address when customer snapshot changes  
  useEffect(() => {
    if (customerSnapshot) {
      const shippingAddr = formatAddressDisplay(customerSnapshot.shippingAddress);
      if (shippingAddr) {
        setShippingAddress(shippingAddr);
      } else {
        // Fallback to billing address
        setShippingAddress(formatAddressDisplay(customerSnapshot.billingAddress));
      }
    }
  }, [customerSnapshot]);

  const [items, setItems] = useState<ChallanItem[]>([
    {
      id: 1,
      name: "",
      description: "",
      hsnSac: "",
      qty: 1,
      rate: 0,
      discountType: 'percentage',
      discountValue: 0,
      gstRate: 18
    }
  ]);

  useEffect(() => {
    fetchNextChallanNumber();
    fetchCustomers();
    fetchInventoryItems();

    // Parse customerId from URL
    const params = new URLSearchParams(location.split('?')[1]);
    const urlCustomerId = params.get('customerId');
    if (urlCustomerId) {
      setCustomerIdFromUrl(urlCustomerId);
    }
  }, [location]);

  // Set customer from URL after customers are loaded
  useEffect(() => {
    if (customerIdFromUrl && customers.length > 0) {
      const customer = customers.find(c => c.id === customerIdFromUrl);
      if (customer) {
        setSelectedCustomerId(customer.id);
        setCustomerIdFromUrl(null);
      }
    }
  }, [customerIdFromUrl, customers]);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleItemSelect = (challanItemId: number, inventoryItemId: string) => {
    const inventoryItem = inventoryItems.find(i => i.id === inventoryItemId);
    if (inventoryItem) {
      // Parse rate - use rate field (for selling), handle string or number
      let itemRate = 0;
      if (typeof inventoryItem.rate === 'string') {
        // Remove commas and parse as float
        itemRate = parseFloat(inventoryItem.rate.replace(/,/g, '')) || 0;
      } else if (typeof inventoryItem.rate === 'number') {
        itemRate = inventoryItem.rate;
      } else if (inventoryItem.sellingPrice) {
        itemRate = typeof (inventoryItem.sellingPrice as any) === 'string'
          ? parseFloat((inventoryItem.sellingPrice as any).replace(/,/g, '')) || 0
          : inventoryItem.sellingPrice;
      }

      // Parse GST rate from intraStateTax field (e.g., "gst18" -> 18)
      let gstRate = 0;
      if (inventoryItem.intraStateTax) {
        const match = inventoryItem.intraStateTax.match(/\d+/);
        if (match) gstRate = parseInt(match[0]);
      }

      setItems(items.map(item => {
        if (item.id === challanItemId) {
          return {
            ...item,
            name: inventoryItem.name,
            description: inventoryItem.description || "",
            hsnSac: inventoryItem.hsnSac || "",
            rate: itemRate,
            gstRate: gstRate
          };
        }
        return item;
      }));
    }
  };

  const fetchNextChallanNumber = async () => {
    try {
      const response = await fetch('/api/delivery-challans/next-number');
      if (response.ok) {
        const data = await response.json();
        setChallanNumber(data.data.challanNumber.replace("DC-", ""));
      }
    } catch (error) {
      console.error('Failed to fetch next challan number:', error);
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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const calculateLineItem = (item: ChallanItem) => {
    const baseAmount = item.qty * item.rate;
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (Math.min(item.discountValue, 100) / 100);
    } else {
      discountAmount = item.discountValue;
    }
    discountAmount = Math.min(discountAmount, baseAmount);
    const taxableAmount = baseAmount - discountAmount;
    let taxAmount = 0;
    if (item.gstRate > 0) {
      taxAmount = taxableAmount * (item.gstRate / 100);
    }
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
      taxableSubtotal: acc.taxableSubtotal + line.taxableAmount,
      totalTax: acc.totalTax + line.taxAmount,
      grandTotal: acc.grandTotal + line.total
    };
  }, { taxableSubtotal: 0, totalTax: 0, grandTotal: 0 });

  const finalTotal = totals.grandTotal + adjustment;

  const updateItem = (id: number, field: keyof ChallanItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, {
      id: Math.random(),
      name: "",
      description: "",
      hsnSac: "",
      qty: 1,
      rate: 0,
      discountType: 'percentage',
      discountValue: 0,
      gstRate: 18
    }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleCustomerChange = (value: string) => {
    if (value === "add_new_customer") {
      setLocation("/customers/new?returnTo=delivery-challans/new");
    } else {
      setSelectedCustomerId(value);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    const parts = [address.street, address.city, address.state, address.country, address.pincode].filter(Boolean);
    return parts.join('\n');
  };

  const handleSave = async (status: 'DRAFT' | 'OPEN' = 'DRAFT') => {
    if (!selectedCustomerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer.",
        variant: "destructive"
      });
      return;
    }

    if (!challanType) {
      toast({
        title: "Validation Error",
        description: "Please select a challan type.",
        variant: "destructive"
      });
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with a name.",
        variant: "destructive"
      });
      return;
    }

    const invalidItems = validItems.filter(item => item.qty <= 0 || item.rate < 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "All items must have a positive quantity and non-negative rate.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    const challanItems = validItems.map(item => {
      const lineCalc = calculateLineItem(item);
      return {
        id: String(item.id),
        itemId: String(item.id),
        name: item.name,
        description: item.description,
        hsnSac: item.hsnSac,
        quantity: item.qty,
        unit: 'pcs',
        rate: item.rate,
        discount: item.discountValue,
        discountType: item.discountType,
        tax: lineCalc.taxAmount,
        taxName: item.gstRate > 0 ? `GST${item.gstRate}` : 'Non-taxable',
        amount: lineCalc.total
      };
    });

    const challanData = {
      date: format(date, "yyyy-MM-dd"),
      referenceNumber,
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.displayName || "Unknown Customer",
      challanType,
      billingAddress: selectedCustomer?.billingAddress || {},
      shippingAddress: selectedCustomer?.shippingAddress || selectedCustomer?.billingAddress || {},
      placeOfSupply: '',
      gstin: selectedCustomer?.gstin || '',
      items: challanItems,
      subTotal: totals.taxableSubtotal,
      cgst: totals.totalTax / 2,
      sgst: totals.totalTax / 2,
      igst: 0,
      adjustment: adjustment,
      total: finalTotal,
      customerNotes,
      termsAndConditions,
      status
    };

    try {
      const response = await fetch('/api/delivery-challans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challanData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: status === 'DRAFT' ? "Saved as Draft" : "Delivery Challan Created",
          description: `Delivery Challan ${result.data.challanNumber} has been ${status === 'DRAFT' ? 'saved as draft' : 'created'}.`,
        });
        setLocation("/delivery-challans");
      } else {
        throw new Error('Failed to create delivery challan');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create delivery challan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Delivery Challan</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setLocation("/delivery-challans")} data-testid="button-close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Customer Name
                  <span className="text-red-600 ml-0.5">*</span>
                </Label>
                <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="w-full" data-testid="select-customer">
                    <SelectValue placeholder="Select or add a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.displayName}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <SelectItem value="add_new_customer" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Customer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Delivery Challan#
                  <span className="text-red-600 ml-0.5">*</span>
                </Label>
                <div className="flex items-center">
                  <span className="bg-muted border border-r-0 border-border rounded-l-md px-3 py-2 text-sm text-muted-foreground">DC-</span>
                  <Input
                    value={challanNumber}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    className="rounded-l-none"
                    data-testid="input-challan-number"
                  />
                  <Button variant="ghost" size="icon" className="ml-1">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Reference#</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder=""
                  data-testid="input-reference-number"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Delivery Challan Date
                  <span className="text-red-600 ml-0.5">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      data-testid="button-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Challan Type
                  <span className="text-red-600 ml-0.5">*</span>
                </Label>
                <Select value={challanType} onValueChange={setChallanType}>
                  <SelectTrigger className="w-full" data-testid="select-challan-type">
                    <SelectValue placeholder="Choose a proper challan type." />
                  </SelectTrigger>
                  <SelectContent>
                    {CHALLAN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-muted/50 rounded-t-lg p-3">
              <h3 className="font-medium">Item Table</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Item Details</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-center">Discount</TableHead>
                  <TableHead className="text-center">Tax</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const lineCalc = calculateLineItem(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={inventoryItems.find(inv => inv.name === item.name)?.id || ""}
                          onValueChange={(v) => handleItemSelect(item.id, v)}
                        >
                          <SelectTrigger className="w-full" data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Select an item">
                              {item.name || "Select an item"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                          
                          className="w-20 text-center"
                          data-testid={`input-qty-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          
                          className="w-24 text-right"
                          data-testid={`input-rate-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={item.discountValue}
                            onChange={(e) => updateItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                            
                            className="w-16 text-right"
                            data-testid={`input-discount-${index}`}
                          />
                          <Select
                            value={item.discountType}
                            onValueChange={(v) => updateItem(item.id, 'discountType', v)}
                          >
                            <SelectTrigger className="w-14 px-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="flat">Rs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(item.gstRate)}
                          onValueChange={(v) => updateItem(item.id, 'gstRate', parseInt(v))}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-tax-${index}`}>
                            <SelectValue placeholder="Select a Tax" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_OPTIONS.map((tax) => (
                              <SelectItem key={tax.value} value={String(tax.value)}>
                                {tax.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(lineCalc.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex gap-4 mt-4">
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1" data-testid="button-add-row">
                <Plus className="h-4 w-4" />
                Add New Row
              </Button>
              <Button variant="outline" size="sm" className="gap-1" data-testid="button-add-bulk">
                <Plus className="h-4 w-4" />
                Add Items in Bulk
              </Button>
            </div>

            <div className="flex justify-between mt-8">
              <div className="w-1/2 pr-8 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Customer Notes</Label>
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Enter any notes to be displayed in your transaction"
                    className="min-h-[80px]"
                    data-testid="textarea-customer-notes"
                  />
                </div>
              </div>

              <div className="w-1/2 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sub Total</span>
                  <span className="font-semibold">{formatCurrency(totals.taxableSubtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Adjustment</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                    
                    className="w-28 text-right"
                    data-testid="input-adjustment"
                  />
                  <span className="text-sm">{formatCurrency(adjustment)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total (₹)</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Terms & Conditions</Label>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                className="min-h-[80px]"
                data-testid="textarea-terms"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-78 right-0 bg-background border-t border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/delivery-challans")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
          {/* <div className="text-sm text-muted-foreground">
            PDF Template: 'Standard Template' <span className="text-primary cursor-pointer">Change</span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
