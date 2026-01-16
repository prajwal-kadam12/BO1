import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Trash2, Search, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";

interface Customer {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  billingAddress?: any;
  gstin?: string;
  placeOfSupply?: string;
}

interface Item {
  id: string;
  name: string;
  type: string;
  unit: string;
  usageUnit?: string;
  sellingPrice?: number;
  rate?: string | number;
  hsnSac?: string;
  description?: string;
  salesAccount?: string;
}

interface Salesperson {
  id: string;
  name: string;
  email?: string;
}

interface LineItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: string;
  tax: number;
  taxName: string;
  amount: number;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const TAX_OPTIONS = [
  { value: "none", label: "None", rate: 0 },
  { value: "GST0", label: "GST 0%", rate: 0 },
  { value: "GST5", label: "GST 5%", rate: 5 },
  { value: "GST12", label: "GST 12%", rate: 12 },
  { value: "GST18", label: "GST 18%", rate: 18 },
  { value: "GST28", label: "GST 28%", rate: 28 },
  { value: "IGST0", label: "IGST 0%", rate: 0 },
  { value: "IGST5", label: "IGST 5%", rate: 5 },
  { value: "IGST12", label: "IGST 12%", rate: 12 },
  { value: "IGST18", label: "IGST 18%", rate: 18 },
  { value: "IGST28", label: "IGST 28%", rate: 28 },
];

export default function CreditNoteEdit() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesperson, setSalesperson] = useState("");
  const [subject, setSubject] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    street: "", city: "", state: "", country: "India", pincode: ""
  });
  const [gstin, setGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", itemId: "", name: "", description: "", account: "", quantity: 1, rate: 0, discount: 0, discountType: "percentage", tax: 0, taxName: "none", amount: 0 }
  ]);

  const [subTotal, setSubTotal] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [tdsType, setTdsType] = useState("TDS");
  const [tdsTax, setTdsTax] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [total, setTotal] = useState(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [salespersonDialogOpen, setSalespersonDialogOpen] = useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState("");
  const [newSalespersonEmail, setNewSalespersonEmail] = useState("");

  useEffect(() => {
    fetchData();
  }, [params.id]);

  useEffect(() => {
    calculateTotals();
  }, [lineItems, shippingCharges, adjustment]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [customersRes, itemsRes, salespersonsRes, creditNoteRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/items'),
        fetch('/api/salespersons'),
        fetch(`/api/credit-notes/${params.id}`)
      ]);

      const customersData = await customersRes.json();
      const itemsData = await itemsRes.json();
      const salespersonsData = await salespersonsRes.json();
      const creditNoteData = await creditNoteRes.json();

      if (customersData.success) setCustomers(customersData.data);
      if (itemsData.success) setItems(itemsData.data);
      if (salespersonsData.success) setSalespersons(salespersonsData.data);

      if (creditNoteData.success && creditNoteData.data) {
        const cn = creditNoteData.data;
        setCustomerId(cn.customerId || "");
        setCustomerName(cn.customerName || "");
        setReason(cn.reason || "");
        setCreditNoteNumber(cn.creditNoteNumber || cn.number || "");
        setReferenceNumber(cn.referenceNumber || "");
        setCreditNoteDate(cn.date ? cn.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setSalesperson(cn.salesperson || "");
        setSubject(cn.subject || "");
        if (cn.billingAddress) setBillingAddress(cn.billingAddress);
        setGstin(cn.gstin || "");
        setPlaceOfSupply(cn.placeOfSupply || "");
        if (cn.items && cn.items.length > 0) {
          setLineItems(cn.items.map((item: any, index: number) => ({
            id: item.id || String(index + 1),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            account: item.account || "",
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: item.tax || 0,
            taxName: item.taxName || "none",
            amount: item.amount || 0
          })));
        }
        setShippingCharges(cn.shippingCharges || 0);
        setTdsType(cn.tdsType || "TDS");
        setTdsTax(cn.tdsTax || "");
        setAdjustment(cn.adjustment || 0);
        setCustomerNotes(cn.customerNotes || "");
        setTermsAndConditions(cn.termsAndConditions || "");
      } else {
        toast({ title: "Error", description: "Credit note not found", variant: "destructive" });
        setLocation('/credit-notes');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setCustomerId(customer.id);
      setCustomerName(customer.displayName || customer.name);
      if (customer.billingAddress) {
        setBillingAddress(customer.billingAddress);
      }
      if (customer.gstin) setGstin(customer.gstin);
      if (customer.placeOfSupply) setPlaceOfSupply(customer.placeOfSupply);
    }
  };

  const handleItemChange = (lineItemId: string, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      // Get the price from rate (string) or sellingPrice (number)
      // Remove commas from formatted numbers like "45,000.00" before parsing
      const rateStr = String(item.rate || '0').replace(/,/g, '');
      const price = parseFloat(rateStr) || item.sellingPrice || 0;
      const lineItem = lineItems.find(li => li.id === lineItemId);
      const quantity = lineItem?.quantity || 1;

      updateLineItem(lineItemId, {
        itemId: item.id,
        name: item.name,
        description: item.description || "",
        account: item.salesAccount || "sales",
        rate: price,
        amount: price * quantity
      });
    }
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        const quantity = updated.quantity || 0;
        const rate = updated.rate || 0;
        const discount = updated.discount || 0;
        const discountType = updated.discountType || 'percentage';

        let discountAmount = discountType === 'percentage'
          ? (quantity * rate * discount / 100)
          : discount;

        updated.amount = quantity * rate - discountAmount;
        return updated;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = String(Date.now());
    setLineItems(prev => [...prev, {
      id: newId, itemId: "", name: "", description: "", account: "", quantity: 1, rate: 0, discount: 0, discountType: "percentage", tax: 0, taxName: "none", amount: 0
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const calculateTotals = () => {
    const subTotalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    setSubTotal(subTotalAmount);
    setTotal(subTotalAmount + shippingCharges + adjustment);
  };

  const handleAddSalesperson = async () => {
    if (!newSalespersonName.trim()) return;
    try {
      const response = await fetch('/api/salespersons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSalespersonName, email: newSalespersonEmail })
      });
      const data = await response.json();
      if (data.success) {
        setSalespersons(prev => [...prev, data.data]);
        setSalesperson(data.data.name);
        setSalespersonDialogOpen(false);
        setNewSalespersonName("");
        setNewSalespersonEmail("");
        toast({ title: "Success", description: "Salesperson added successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add salesperson", variant: "destructive" });
    }
  };

  const handleSubmit = async (status: string) => {
    if (!customerId) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/credit-notes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customerName,
          reason,
          creditNoteNumber,
          referenceNumber,
          date: creditNoteDate,
          salesperson,
          subject,
          billingAddress,
          gstin,
          placeOfSupply,
          items: lineItems,
          subTotal,
          shippingCharges,
          tdsType,
          tdsAmount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          adjustment,
          total,
          customerNotes,
          termsAndConditions,
          status
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Credit note updated successfully" });
        setLocation('/credit-notes');
      } else {
        toast({ title: "Error", description: data.message || "Failed to update credit note", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update credit note", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/credit-notes')} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Edit Credit Note</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-black">Customer Name
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="flex-1" data-testid="select-customer">
                  <SelectValue placeholder="Select or add a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.displayName || customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="default" size="icon" data-testid="button-search-customer">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="select-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_return">Sales Return</SelectItem>
                <SelectItem value="post_sale_discount">Post Sale Discount</SelectItem>
                <SelectItem value="deficiency_in_services">Deficiency in Services</SelectItem>
                <SelectItem value="correction_in_invoice">Correction in Invoice</SelectItem>
                <SelectItem value="change_in_pos">Change in POS</SelectItem>
                <SelectItem value="finalization_of_amount">Finalization of Provisional Assessment</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-black">Credit Note#</Label>
            <div className="flex items-center gap-2">
              <Input value={creditNoteNumber} onChange={(e) => setCreditNoteNumber(e.target.value)} data-testid="input-credit-note-number" />
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Reference#</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} data-testid="input-reference-number" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-black">Credit Note Date</Label>
            <Input type="date" value={creditNoteDate} onChange={(e) => setCreditNoteDate(e.target.value)} data-testid="input-credit-note-date" />
          </div>
          <div>
            <Label>Salesperson</Label>
            <div className="flex gap-2">
              <Select value={salesperson} onValueChange={setSalesperson}>
                <SelectTrigger className="flex-1" data-testid="select-salesperson">
                  <SelectValue placeholder="Select or Add Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons.map(sp => (
                    <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-blue-600"
                    onClick={() => setSalespersonDialogOpen(true)}
                    data-testid="button-add-salesperson"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Salesperson
                  </Button>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-1">Subject <HelpCircle className="h-3 w-3 text-slate-400" /></Label>
          <Textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Let your customer know what this Credit Note is for"
            className="resize-none"
            data-testid="input-subject"
          />
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-md">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-medium">Item Table</h3>
            <Button variant="link" size="sm" className="text-blue-600">Bulk Actions</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left">Item Details</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-left">Tax(%)</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      {/* Show item name directly if itemId is not in items list (e.g., from invoice) */}
                      {item.name && !items.find(i => i.id === item.itemId) ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Select value="" onValueChange={(val) => handleItemChange(item.id, val)}>
                            <SelectTrigger className="w-48 text-xs" data-testid={`select-item-${index}`}>
                              <SelectValue placeholder="Change item..." />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map(i => (
                                <SelectItem key={i.id} value={i.id}>
                                  {i.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Select value={item.itemId} onValueChange={(val) => handleItemChange(item.id, val)}>
                          <SelectTrigger className="w-48" data-testid={`select-item-${index}`}>
                            <SelectValue placeholder="Type or click to select an Item." />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map(i => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AccountSelectDropdown
                        value={item.account}
                        onValueChange={(val) => updateLineItem(item.id, { account: val })}
                        placeholder="Select an account"
                        triggerClassName="w-40"
                        testId={`select-account-${index}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        
                        className="w-20 text-right"
                        data-testid={`input-quantity-${index}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                        
                        className="w-24 text-right"
                        data-testid={`input-rate-${index}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateLineItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                          
                          className="w-16 text-right"
                          data-testid={`input-discount-${index}`}
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={item.taxName}
                        onValueChange={(val) => {
                          const taxOption = TAX_OPTIONS.find(t => t.value === val);
                          updateLineItem(item.id, { taxName: val, tax: taxOption?.rate || 0 });
                        }}
                      >
                        <SelectTrigger className="w-28" data-testid={`select-tax-${index}`}>
                          <SelectValue placeholder="Select a Tax" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAX_OPTIONS.map(tax => (
                            <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500"
                        disabled={lineItems.length === 1}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-4">
            <Button variant="link" className="text-blue-600 gap-1" onClick={addLineItem} data-testid="button-add-row">
              <Plus className="h-4 w-4" /> Add New Row
            </Button>
            <Button variant="link" className="text-blue-600 gap-1" data-testid="button-add-bulk">
              <Plus className="h-4 w-4" /> Add Items in Bulk
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Customer Notes</Label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Will be displayed on the credit note"
              className="resize-none"
              data-testid="input-customer-notes"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Sub Total</span>
              <span className="font-medium">{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600">Shipping Charges</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                  
                  className="w-24 text-right"
                  data-testid="input-shipping-charges"
                />
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <RadioGroup value={tdsType} onValueChange={setTdsType} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="TDS" id="tds" />
                  <Label htmlFor="tds">TDS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="TCS" id="tcs" />
                  <Label htmlFor="tcs">TCS</Label>
                </div>
              </RadioGroup>
              <Select value={tdsTax} onValueChange={setTdsTax}>
                <SelectTrigger className="w-32" data-testid="select-tds-tax">
                  <SelectValue placeholder="Select a Tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="tds1">TDS 1%</SelectItem>
                  <SelectItem value="tds2">TDS 2%</SelectItem>
                </SelectContent>
              </Select>
              <span className="w-20 text-right">- 0.00</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600">Adjustment</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  
                  className="w-24 text-right"
                  data-testid="input-adjustment"
                />
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </div>
              <span className="w-20 text-right">{adjustment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold">Total ( ₹ )</span>
              <span className="font-bold text-lg">{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Terms & Conditions</Label>
          <Textarea
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
            className="resize-none min-h-[100px]"
            data-testid="input-terms"
          />
        </div>

        <div className="text-sm text-slate-500">
          Additional Fields: Start adding custom fields for your credit notes by going to Settings &gt; Sales &gt; Credit Notes.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <span className="text-slate-500 mr-auto"></span>
        <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={isSubmitting} data-testid="button-save-draft">
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit('OPEN')} disabled={isSubmitting} data-testid="button-save-open">
          Save as Open
        </Button>
        <Button variant="ghost" onClick={() => setLocation('/credit-notes')} data-testid="button-cancel">
          Cancel
        </Button>
      </div>

      <Dialog open={salespersonDialogOpen} onOpenChange={setSalespersonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salesperson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newSalespersonName}
                onChange={(e) => setNewSalespersonName(e.target.value)}
                placeholder="Enter salesperson name"
                data-testid="input-new-salesperson-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newSalespersonEmail}
                onChange={(e) => setNewSalespersonEmail(e.target.value)}
                placeholder="Enter email (optional)"
                data-testid="input-new-salesperson-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalespersonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSalesperson} data-testid="button-confirm-add-salesperson">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
