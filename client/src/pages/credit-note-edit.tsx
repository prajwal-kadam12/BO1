import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  X,
  Loader2,
  HelpCircle,
  AlertCircle,
  Calendar as CalendarIcon
} from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-screen animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 flex-none">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/credit-notes')} className="rounded-full hover:bg-slate-100" data-testid="button-back">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">Edit Credit Note</h1>
            <Badge variant="outline" className="ml-2">
              {creditNoteNumber}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={isSubmitting} data-testid="button-save-draft">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit('OPEN')} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-open">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update and Open
          </Button>
          <Button variant="ghost" onClick={() => setLocation('/credit-notes')} data-testid="button-cancel">
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto invisible-scrollbar">
        <div className="max-w-6xl mx-auto p-8 pb-32">
          <div className="space-y-8">
            {/* Credit Note Details Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Credit Note Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
                      <div className="flex gap-2">
                        <Select value={customerId} onValueChange={handleCustomerChange}>
                          <SelectTrigger className="bg-white border-slate-200 flex-1" data-testid="select-customer">
                            <SelectValue placeholder="Select or add a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map(customer => (
                              <SelectItem key={customer.id} value={customer.id}>{customer.displayName || customer.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="shrink-0" data-testid="button-search-customer">
                          <Search className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reason</Label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-reason">
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

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Credit Note#</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={creditNoteNumber}
                          onChange={(e) => setCreditNoteNumber(e.target.value)}
                          className="bg-white"
                          data-testid="input-credit-note-number"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 text-xs text-slate-500">
                            This is the unique identifier for the credit note.
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Reference#</Label>
                      <Input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="bg-white"
                        data-testid="input-reference-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Credit Note Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !creditNoteDate && "text-muted-foreground")}
                            data-testid="input-credit-note-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {creditNoteDate && !isNaN(Date.parse(creditNoteDate)) ? format(new Date(creditNoteDate), "dd/MM/yyyy") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={creditNoteDate ? new Date(creditNoteDate) : undefined}
                            onSelect={(d) => d && setCreditNoteDate(d.toISOString().split('T')[0])}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Salesperson</Label>
                      <Select value={salesperson} onValueChange={setSalesperson}>
                        <SelectTrigger className="bg-white border-slate-200" data-testid="select-salesperson">
                          <SelectValue placeholder="Select Salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          {salespersons.map(sp => (
                            <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                          ))}
                          <div className="border-t my-1" />
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-blue-600 h-9 px-2 font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              setSalespersonDialogOpen(true);
                            }}
                            data-testid="button-add-salesperson"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Salesperson
                          </Button>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium flex items-center gap-1">
                      Subject
                      <Popover>
                        <PopoverTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs text-slate-500">
                          A brief description of the credit note for the customer.
                        </PopoverContent>
                      </Popover>
                    </Label>
                    <Textarea
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Let your customer know what this Credit Note is for"
                      className="bg-white resize-y min-h-[60px]"
                      data-testid="input-subject"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Card */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Item Table</h2>
                  <Button variant="link" size="sm" className="text-blue-600 font-medium" data-testid="button-bulk-actions">Bulk Actions</Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-10 pl-4">#</TableHead>
                        <TableHead className="w-[280px]">Item Details</TableHead>
                        <TableHead className="w-[180px]">Account</TableHead>
                        <TableHead className="text-right w-24">Quantity</TableHead>
                        <TableHead className="text-right w-28">Rate</TableHead>
                        <TableHead className="text-right w-24">Discount</TableHead>
                        <TableHead className="text-left w-32">Tax (%)</TableHead>
                        <TableHead className="text-right w-32">Amount</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="pl-4 text-slate-500 font-medium">{index + 1}</TableCell>
                          <TableCell>
                            {item.name && !items.find(i => i.id === item.itemId) ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-sm text-slate-900">{item.name}</span>
                                <Select value="" onValueChange={(val) => handleItemChange(item.id, val)}>
                                  <SelectTrigger className="w-full h-8 text-xs border-dashed text-slate-500" data-testid={`select - item - ${index} `}>
                                    <SelectValue placeholder="Change item..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map(i => (
                                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <Select value={item.itemId} onValueChange={(val) => handleItemChange(item.id, val)}>
                                <SelectTrigger className="border-0 shadow-none focus:ring-0 px-0 h-auto font-medium text-slate-900" data-testid={`select - item - ${index} `}>
                                  <SelectValue placeholder="Select Item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map(i => (
                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <AccountSelectDropdown
                              value={item.account}
                              onValueChange={(val) => updateLineItem(item.id, { account: val })}
                              placeholder="Select Account"
                              triggerClassName="w-full border-0 shadow-none focus:ring-0 bg-transparent px-0 h-9"
                              testId={`select - account - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              className="text-right h-9 border-slate-200"
                              data-testid={`input - quantity - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                              className="text-right h-9 border-slate-200"
                              data-testid={`input - rate - ${index} `}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateLineItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                                className="text-right h-9 border-slate-200"
                                data-testid={`input - discount - ${index} `}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.taxName}
                              onValueChange={(val) => {
                                const taxOption = TAX_OPTIONS.find(t => t.value === val);
                                updateLineItem(item.id, { taxName: val, tax: taxOption?.rate || 0 });
                              }}
                            >
                              <SelectTrigger className="h-9 border-slate-200 text-xs" data-testid={`select - tax - ${index} `}>
                                <SelectValue placeholder="Tax" />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_OPTIONS.map(tax => (
                                  <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              disabled={lineItems.length === 1}
                              data-testid={`button - remove - item - ${index} `}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-4">
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 h-auto p-0 font-medium" onClick={addLineItem} data-testid="button-add-row">
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
                          placeholder="Will be displayed on the credit note"
                          className="min-h-[100px] resize-y"
                          data-testid="input-customer-notes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Terms & Conditions</Label>
                        <Textarea
                          value={termsAndConditions}
                          onChange={(e) => setTermsAndConditions(e.target.value)}
                          placeholder="Enter the terms and conditions of your business..."
                          className="min-h-[100px] resize-y"
                          data-testid="input-terms"
                        />
                      </div>
                    </div>

                    {/* Right Column (Totals) */}
                    <div className="bg-slate-50/50 rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Sub Total</span>
                        <span className="font-medium text-slate-900">{subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Shipping Charges</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={shippingCharges}
                            onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right h-8 bg-white"
                            data-testid="input-shipping-charges"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-2">
                        <div className="flex items-center gap-2">
                          <RadioGroup value={tdsType} onValueChange={setTdsType} className="flex gap-2">
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="TDS" id="tds" className="h-3 w-3" />
                              <Label htmlFor="tds" className="text-xs">TDS</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="TCS" id="tcs" className="h-3 w-3" />
                              <Label htmlFor="tcs" className="text-xs">TCS</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={tdsTax} onValueChange={setTdsTax}>
                            <SelectTrigger className="w-24 h-8 text-xs bg-white" data-testid="select-tds-tax">
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="tds1">TDS 1%</SelectItem>
                              <SelectItem value="tds2">TDS 2%</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="w-20 text-right text-slate-900">- 0.00</span>
                        </div>
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
                          <span className="text-slate-900 w-20 text-right">{adjustment.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base text-slate-900">Total (₹)</span>
                          <span className="font-bold text-xl text-slate-900">{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer removed - buttons moved to header */}

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
