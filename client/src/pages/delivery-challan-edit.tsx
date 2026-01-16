import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  HelpCircle
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

export default function DeliveryChallanEdit() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/delivery-challans/:id/edit");
  const { toast } = useToast();

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
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("DRAFT");

  const [items, setItems] = useState<ChallanItem[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchInventoryItems();
    if (params?.id) {
      fetchChallan(params.id);
    }
  }, [params?.id]);

  const fetchChallan = async (id: string) => {
    try {
      const response = await fetch(`/api/delivery-challans/${id}`);
      if (response.ok) {
        const data = await response.json();
        const challan = data.data;

        setChallanNumber(challan.challanNumber.replace("DC-", ""));
        setReferenceNumber(challan.referenceNumber || "");
        setDate(new Date(challan.date));
        setSelectedCustomerId(challan.customerId);
        setChallanType(challan.challanType);
        setCustomerNotes(challan.customerNotes || "");
        setTermsAndConditions(challan.termsAndConditions || "");
        setAdjustment(challan.adjustment || 0);
        setStatus(challan.status);

        const challanItems = challan.items.map((item: any, index: number) => ({
          id: index + 1,
          name: item.name,
          description: item.description || "",
          hsnSac: item.hsnSac || "",
          qty: item.quantity,
          rate: item.rate,
          discountType: item.discountType || 'percentage',
          discountValue: item.discount || 0,
          gstRate: item.taxName?.includes('18') ? 18 : (item.taxName?.includes('12') ? 12 : (item.taxName?.includes('5') ? 5 : (item.taxName?.includes('28') ? 28 : 0)))
        }));

        setItems(challanItems.length > 0 ? challanItems : [{
          id: 1,
          name: "",
          description: "",
          hsnSac: "",
          qty: 1,
          rate: 0,
          discountType: 'percentage',
          discountValue: 0,
          gstRate: 18
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch challan:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery challan.",
        variant: "destructive"
      });
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
        itemRate = typeof inventoryItem.sellingPrice === 'string'
          ? parseFloat(inventoryItem.sellingPrice.replace(/,/g, '')) || 0
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

  const handleSave = async (newStatus?: string) => {
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
        discount: lineCalc.discountAmount,
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
      status: newStatus || status
    };

    try {
      const response = await fetch(`/api/delivery-challans/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challanData)
      });

      if (response.ok) {
        toast({
          title: "Delivery Challan Updated",
          description: "Your changes have been saved.",
        });
        setLocation("/delivery-challans");
      } else {
        throw new Error('Failed to update delivery challan');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery challan. Please try again.",
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Delivery Challan</h1>
          <p className="text-muted-foreground">DC-{challanNumber}</p>
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
                <Label className="text-sm font-medium">Customer Name
                  <span className="text-red-600">*</span>
                </Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full" data-testid="select-customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Delivery Challan#</Label>
                <div className="flex items-center">
                  <span className="bg-muted border border-r-0 border-border rounded-l-md px-3 py-2 text-sm text-muted-foreground">DC-</span>
                  <Input
                    value={challanNumber}
                    disabled
                    className="rounded-l-none bg-muted"
                    data-testid="input-challan-number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Reference#</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  data-testid="input-reference-number"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Delivery Challan Date
                  <span className="text-red-600">*</span>
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
                <Label className="text-sm font-medium">Challan Type
                  <span className="text-red-600">*</span>
                </Label>
                <Select value={challanType} onValueChange={setChallanType}>
                  <SelectTrigger className="w-full" data-testid="select-challan-type">
                    <SelectValue placeholder="Choose a challan type" />
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
                          value={item.name ? inventoryItems.find(i => i.name === item.name)?.id : ""}
                          onValueChange={(value) => handleItemSelect(item.id, value)}
                        >
                          <SelectTrigger className="border-0 shadow-none focus-visible:ring-0 px-0" data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Type or click to select an item.">
                              {item.name || "Type or click to select an item."}
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
                placeholder="Enter the terms and conditions of your business"
                className="min-h-[80px]"
                data-testid="textarea-terms"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-78 right-0 bg-background border-t border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            data-testid="button-save"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/delivery-challans")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
