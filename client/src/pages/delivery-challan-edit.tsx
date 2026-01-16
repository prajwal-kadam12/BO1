import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  ArrowLeft,
  Trash2,
  Loader2,
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
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/delivery-challans")} className="rounded-full hover:bg-slate-100" data-testid="button-back">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-900">Edit Delivery Challan</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Challan Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Challan Details</h2>
                    <span className="text-sm text-slate-500">DC-{challanNumber}</span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-customer">
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
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Challan Type</Label>
                      <Select value={challanType} onValueChange={setChallanType}>
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-challan-type">
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

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Challan#</Label>
                      <div className="flex items-center">
                        <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-md px-3 py-2 text-sm text-slate-500">DC-</span>
                        <Input
                          value={challanNumber}
                          disabled
                          className="rounded-l-none bg-slate-100 font-mono text-slate-500"
                          data-testid="input-challan-number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reference#</Label>
                      <Input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder=""
                        className="bg-white"
                        data-testid="input-reference-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Challan Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !date && "text-muted-foreground")}
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[300px]">Item Details</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tax</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => {
                        const lineCalc = calculateLineItem(item);
                        return (
                          <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <Select
                                value={item.name ? inventoryItems.find(i => i.name === item.name)?.id : ""}
                                onValueChange={(value) => handleItemSelect(item.id, value)}
                              >
                                <SelectTrigger className="border-0 bg-transparent hover:bg-white focus:bg-white shadow-none hover:shadow-sm transition-all h-auto py-2" data-testid={`select-item-${index}`}>
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
                            </td>
                            <td className="px-6 py-4">
                              <Input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center h-9 mx-auto"
                                data-testid={`input-qty-${index}`}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right h-9 ml-auto"
                                data-testid={`input-rate-${index}`}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  value={item.discountValue}
                                  onChange={(e) => updateItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right h-9"
                                  data-testid={`input-discount-${index}`}
                                />
                                <Select
                                  value={item.discountType}
                                  onValueChange={(v) => updateItem(item.id, 'discountType', v)}
                                >
                                  <SelectTrigger className="w-14 h-9 px-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="flat">Rs</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Select
                                value={String(item.gstRate)}
                                onValueChange={(v) => updateItem(item.id, 'gstRate', parseInt(v))}
                              >
                                <SelectTrigger className="w-28 h-9" data-testid={`select-tax-${index}`}>
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
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-700">
                              {formatCurrency(lineCalc.total)}
                            </td>
                            <td className="px-6 py-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeItem(item.id)}
                                disabled={items.length === 1}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-4">
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 h-auto p-0 font-medium" onClick={addItem} data-testid="button-add-row">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Another Line
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms & Totals Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Terms & Attributes</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Customer Notes</Label>
                        <Textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          placeholder="Enter any notes to be displayed in your transaction"
                          className="min-h-[100px] resize-y"
                          data-testid="textarea-customer-notes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Terms & Conditions</Label>
                        <Textarea
                          value={termsAndConditions}
                          onChange={(e) => setTermsAndConditions(e.target.value)}
                          placeholder="Enter the terms and conditions of your business..."
                          className="min-h-[100px] resize-y"
                          data-testid="textarea-terms"
                        />
                      </div>
                    </div>

                    {/* Right Column (Totals) */}
                    <div className="bg-slate-50/50 rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Sub Total</span>
                        <span className="font-medium text-slate-900">{formatCurrency(totals.taxableSubtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Adjustment</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={adjustment}
                            onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right h-8 bg-white"
                            data-testid="input-adjustment"
                          />
                          <span className="text-slate-900 w-20 text-right">{formatCurrency(adjustment)}</span>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base text-slate-900">Total (₹)</span>
                          <span className="font-bold text-xl text-slate-900">{formatCurrency(finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                variant="outline"
                className="min-w-[100px]"
                onClick={() => setLocation("/delivery-challans")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => handleSave()}
                disabled={saving}
                data-testid="button-save"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
