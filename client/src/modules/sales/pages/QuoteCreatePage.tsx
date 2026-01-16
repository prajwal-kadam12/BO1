import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, X, Search, Upload, Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageSalespersonsDialog } from "@/components/ManageSalespersonsDialog";
import { useTransactionBootstrap } from "@/hooks/use-transaction-bootstrap";
import { formatAddressDisplay } from "@/lib/customer-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  email: string;
  billingAddress: any;
  shippingAddress: any;
}

interface Item {
  id: string;
  name: string;
  description: string;
  rate: string;
  hsnSac: string;
}

interface QuoteItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: string;
  tax: string;
  amount: number;
}

const taxOptions = [
  { value: "none", label: "No Tax" },
  { value: "GST0", label: "GST (0%)" },
  { value: "GST5", label: "GST (5%)" },
  { value: "GST12", label: "GST (12%)" },
  { value: "GST18", label: "GST (18%)" },
  { value: "GST28", label: "GST (28%)" },
];

const getTaxRate = (taxValue: string): number => {
  const rates: Record<string, number> = {
    "none": 0,
    "GST0": 0,
    "GST5": 5,
    "GST12": 12,
    "GST18": 18,
    "GST28": 28,
  };
  return rates[taxValue] || 0;
};

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
}

export default function QuoteCreatePage() {
  const [location, setLocation] = useLocation();
  
  // Transaction bootstrap for auto-population
  const {
    customerId: bootstrapCustomerId,
    customerSnapshot,
    taxRegime,
    isLoadingCustomer,
    customerError,
    formData: bootstrapFormData,
    onCustomerChange
  } = useTransactionBootstrap({ transactionType: 'quote' });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextQuoteNumber, setNextQuoteNumber] = useState("QT-000005");
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    billingAddress: {},
    shippingAddress: {},
    quoteNumber: "",
    referenceNumber: "",
    quoteDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    salesperson: "",
    projectName: "",
    subject: "",
    customerNotes: "Looking forward for your business.",
    termsAndConditions: "",
    shippingCharges: 0,
    tdsType: "",
    adjustment: 0,
    adjustmentDescription: "",
  });
  
  // Sync with bootstrap customer
  useEffect(() => {
    if (bootstrapCustomerId && !formData.customerId) {
      setFormData(prev => ({ ...prev, customerId: bootstrapCustomerId }));
    }
  }, [bootstrapCustomerId]);
  
  // Update form data when customer snapshot changes
  useEffect(() => {
    if (customerSnapshot) {
      setFormData(prev => ({
        ...prev,
        customerName: customerSnapshot.displayName || customerSnapshot.customerName
      }));
    }
  }, [customerSnapshot]);

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    {
      id: "1",
      itemId: "",
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      discountType: "percentage",
      tax: "none",
      amount: 0,
    }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    fetchNextQuoteNumber();
    fetchSalespersons();
    
    // Handle clone parameter
    const params = new URLSearchParams(location.split('?')[1]);
    const cloneFromId = params.get('cloneFrom');
    if (cloneFromId) {
      fetchQuoteToClone(cloneFromId);
    }
  }, [location]);

  const fetchQuoteToClone = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      if (response.ok) {
        const data = await response.json();
        const quote = data.data;

        // Pre-populate form with cloned quote data
        setFormData(prev => ({
          ...prev,
          customerId: quote.customerId || "",
          customerName: quote.customerName || "",
          referenceNumber: quote.referenceNumber || "",
          quoteDate: new Date().toISOString().split('T')[0],
          expiryDate: quote.expiryDate ? new Date(quote.expiryDate).toISOString().split('T')[0] : "",
          salesperson: quote.salesperson || "",
          projectName: quote.projectName || "",
          subject: quote.subject || "",
          customerNotes: quote.customerNotes || "Looking forward for your business.",
          termsAndConditions: quote.termsAndConditions || "",
          shippingCharges: quote.shippingCharges || 0,
          adjustment: quote.adjustment || 0,
        }));

        // Pre-populate items
        if (quote.items && quote.items.length > 0) {
          const clonedItems = quote.items.map((item: any, index: number) => ({
            id: String(Date.now() + index),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: item.taxName || "none",
            amount: item.amount || 0,
          }));
          setQuoteItems(clonedItems);
        }
      }
    } catch (error) {
      console.error('Failed to fetch quote for cloning:', error);
    }
  };

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

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchNextQuoteNumber = async () => {
    try {
      const response = await fetch('/api/quotes/next-number');
      if (response.ok) {
        const data = await response.json();
        setNextQuoteNumber(data.data?.quoteNumber || "QT-000005");
        setFormData(prev => ({ ...prev, quoteNumber: data.data?.quoteNumber || "QT-000005" }));
      }
    } catch (error) {
      console.error('Failed to fetch next quote number:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        billingAddress: customer.billingAddress || {},
        shippingAddress: customer.shippingAddress || customer.billingAddress || {}
      }));
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItems = [...quoteItems];
      const rate = parseFloat(item.rate.replace(/[₹,]/g, '')) || 0;
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
        name: item.name,
        description: item.description || '',
        rate,
        amount: rate * updatedItems[index].quantity
      };
      setQuoteItems(updatedItems);
    }
  };

  const updateQuoteItem = (index: number, field: string, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    const quantity = updatedItems[index].quantity;
    const rate = updatedItems[index].rate;
    const discount = updatedItems[index].discount;
    const discountType = updatedItems[index].discountType;

    let subtotal = quantity * rate;
    if (discountType === 'percentage') {
      subtotal = subtotal - (subtotal * discount / 100);
    } else {
      subtotal = subtotal - discount;
    }

    updatedItems[index].amount = Math.max(0, subtotal);
    setQuoteItems(updatedItems);
  };

  const addNewRow = () => {
    setQuoteItems([
      ...quoteItems,
      {
        id: String(Date.now()),
        itemId: "",
        name: "",
        description: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        discountType: "percentage",
        tax: "none",
        amount: 0,
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubTotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return quoteItems.reduce((sum, item) => {
      const taxRate = getTaxRate(item.tax);
      return sum + (item.amount * taxRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const tax = calculateTax();
    const shipping = formData.shippingCharges || 0;
    const adjustment = formData.adjustment || 0;
    return subTotal + tax + shipping + adjustment;
  };

  const handleSubmit = async (status: string) => {
    setLoading(true);
    try {
      const subTotal = calculateSubTotal();
      const taxAmount = calculateTax();

      const quoteData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        billingAddress: formData.billingAddress || {},
        shippingAddress: formData.shippingAddress || formData.billingAddress || {},
        quoteNumber: formData.quoteNumber,
        referenceNumber: formData.referenceNumber,
        date: formData.quoteDate,
        expiryDate: formData.expiryDate,
        salesperson: formData.salesperson,
        projectName: formData.projectName,
        subject: formData.subject,
        items: quoteItems.filter(item => item.itemId).map(item => ({
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: "",
          rate: item.rate,
          discount: item.discount,
          discountType: item.discountType,
          tax: getTaxRate(item.tax),
          taxName: item.tax,
          amount: item.amount
        })),
        subTotal,
        shippingCharges: formData.shippingCharges,
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        igst: 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        status,
        createdBy: "Admin User",
        attachments: attachedFiles.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type }))
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        setLocation('/quotes');
      } else {
        console.error('Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024;

    if (attachedFiles.length + files.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds 10MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newFile: AttachedFile = {
          id: String(Date.now() + Math.random()),
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string
        };
        setAttachedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">New Quote</h1>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black after:content-['*'] after:ml-0.5 after:text-red-500">Customer Name</Label>
            <Select value={formData.customerId} onValueChange={handleCustomerChange}>
              <SelectTrigger className="bg-blue-50 border-blue-200">
                <SelectValue placeholder="Select or add a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black after:content-['*'] after:ml-0.5 after:text-red-500">Quote</Label>
            <div className="flex gap-2">
              <Input
                value={formData.quoteNumber || nextQuoteNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, quoteNumber: e.target.value }))}
                className="flex-1"
              />
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reference#</Label>
            <Input
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black after:content-['*'] after:ml-0.5 after:text-red-500">Quote Date</Label>
            <Input
              type="date"
              value={formData.quoteDate}
              onChange={(e) => setFormData(prev => ({ ...prev, quoteDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Salesperson</Label>
            <Select value={formData.salesperson} onValueChange={(v) => {
              if (v === "manage_salespersons") {
                setShowManageSalespersons(true);
              } else {
                setFormData(prev => ({ ...prev, salesperson: v }));
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select or Add Salesperson" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8 h-9" />
                  </div>
                </div>
                {salespersons.map(sp => (
                  <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                ))}
                <div
                  className="flex items-center gap-2 p-2 text-sm text-blue-600 cursor-pointer hover:bg-slate-100 border-t mt-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowManageSalespersons(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Manage Salespersons
                </div>
              </SelectContent>
            </Select>
          </div>
          {/* Project Name field hidden as per requirements */}
          {/* <div className="space-y-2">
            <Label>Project Name</Label>
            <Select value={formData.projectName} onValueChange={(v) => setFormData(prev => ({ ...prev, projectName: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Project</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Select a customer to associate a project.</p>
          </div> */}
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <div className="flex gap-2">
            <Input
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Let your customer know what this Quote is for"
              className="flex-1"
            />
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-medium text-sm text-slate-700">
            Item Table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase w-8"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item Details</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase w-24">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Rate (₹)</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase w-28">Discount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase w-32">Tax</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-24">Tax Amt</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Amount</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quoteItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-slate-400">::</td>
                    <td className="px-4 py-2">
                      <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, v)}>
                        <SelectTrigger className="border-dashed">
                          <SelectValue placeholder="Type or click to select an item." />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuoteItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="text-center"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateQuoteItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateQuoteItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center"
                        />
                        <Select
                          value={item.discountType}
                          onValueChange={(v) => updateQuoteItem(index, 'discountType', v)}
                        >
                          <SelectTrigger className="w-14">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="amount">₹</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Select value={item.tax} onValueChange={(v) => updateQuoteItem(index, 'tax', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Tax" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxOptions.map(tax => (
                            <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-slate-500">
                      {getTaxRate(item.tax) > 0 ? (
                        <span>{formatCurrency(item.amount * getTaxRate(item.tax) / 100)} ({getTaxRate(item.tax)}%)</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(item.amount + (item.amount * getTaxRate(item.tax) / 100))}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => removeRow(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex gap-4">
            <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add New Row
            </Button>
            <Button variant="link" className="text-blue-600 p-0 h-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add Items in Bulk
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Notes</Label>
              <Textarea
                value={formData.customerNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                placeholder="Looking forward for your business."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Sub Total</span>
              <span className="font-medium">{formatCurrency(calculateSubTotal())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Shipping Charges</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                className="w-32 text-right"
              />
            </div>
            {/* TDS and TCS fields hidden as per requirements */}
            {/* <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Checkbox id="tds" />
                <Label htmlFor="tds" className="text-slate-600">TDS</Label>
                <Checkbox id="tcs" />
                <Label htmlFor="tcs" className="text-slate-600">TCS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select a Tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-slate-500">- 0.00</span>
              </div>
            </div> */}
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Adjustment</span>
              <Input
                type="number"
                step="0.01"
                value={formData.adjustment}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                className="w-32 text-right"
              />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="font-semibold">Total ( ₹ )</span>
              <span className="font-bold text-lg">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Attach File(s) to Quote</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="gap-2" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                </label>
                <p className="text-xs text-slate-500 mt-2">You can upload a maximum of 5 files, 10MB each</p>
              </div>
              {attachedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {attachedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2" data-testid={`file-item-${file.id}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Upload className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.id)} data-testid={`button-remove-file-${file.id}`}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Additional Fields: Start adding custom fields for your quotes by going to Settings → Sales → Quotes.
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleSubmit('SENT')}
            disabled={loading}
          >
            Send
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation('/quotes')}
          >
            Cancel
          </Button>
        </div>
      </div>

      <ManageSalespersonsDialog
        open={showManageSalespersons}
        onOpenChange={setShowManageSalespersons}
        onSalespersonChange={fetchSalespersons}
      />
    </div >
  );
}
