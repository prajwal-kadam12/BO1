import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, X, Search, Upload, Pencil, ArrowLeft, AlertCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
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

interface SalesOrderItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
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

const paymentTermsOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const deliveryMethodOptions = [
  { value: "standard", label: "Standard Delivery" },
  { value: "express", label: "Express Delivery" },
  { value: "pickup", label: "Customer Pickup" },
];

export default function SalesOrderCreatePage() {
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
  } = useTransactionBootstrap({ transactionType: 'sales_order' });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextOrderNumber, setNextOrderNumber] = useState("SO-00001");
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);
  const [customerIdFromUrl, setCustomerIdFromUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    salesOrderNumber: "",
    referenceNumber: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedShipmentDate: "",
    paymentTerms: "due_on_receipt",
    deliveryMethod: "standard",
    salesperson: "",
    placeOfSupply: "",
    customerNotes: "Looking forward to your business.",
    termsAndConditions: "",
    shippingCharges: 0,
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
        customerName: customerSnapshot.displayName || customerSnapshot.customerName,
        placeOfSupply: customerSnapshot.placeOfSupply || prev.placeOfSupply,
        paymentTerms: customerSnapshot.paymentTerms ?
          (customerSnapshot.paymentTerms.toLowerCase().includes('15') ? 'net_15' :
            customerSnapshot.paymentTerms.toLowerCase().includes('30') ? 'net_30' :
              customerSnapshot.paymentTerms.toLowerCase().includes('45') ? 'net_45' :
                customerSnapshot.paymentTerms.toLowerCase().includes('60') ? 'net_60' : 'due_on_receipt')
          : prev.paymentTerms
      }));
    }
  }, [customerSnapshot]);

  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([
    {
      id: "1",
      itemId: "",
      name: "",
      description: "",
      hsnSac: "",
      quantity: 1,
      unit: "pcs",
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
    fetchNextOrderNumber();
    fetchSalespersons();

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
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name
        }));
        setCustomerIdFromUrl(null);
      }
    }
  }, [customerIdFromUrl, customers]);

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

  const fetchNextOrderNumber = async () => {
    try {
      const response = await fetch('/api/sales-orders/next-number');
      if (response.ok) {
        const data = await response.json();
        const orderNumber = data.data?.salesOrderNumber || "SO-00001";
        setNextOrderNumber(orderNumber);
        setFormData(prev => ({ ...prev, salesOrderNumber: orderNumber }));
      }
    } catch (error) {
      console.error('Failed to fetch next order number:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name || "";
    return customerName.toLowerCase().includes(customerSearchTerm.toLowerCase());
  });

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "__add_new_customer__") {
      setLocation("/customers/new");
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name
      }));
    }
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedItems = [...orderItems];
      const rate = parseFloat(item.rate.replace(/[₹,]/g, '')) || 0;
      updatedItems[index] = {
        ...updatedItems[index],
        itemId,
        name: item.name,
        description: item.description || '',
        hsnSac: item.hsnSac || '',
        rate,
        amount: rate * updatedItems[index].quantity
      };
      setOrderItems(updatedItems);
    }
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
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
    setOrderItems(updatedItems);
  };

  const addNewRow = () => {
    setOrderItems([
      ...orderItems,
      {
        id: String(Date.now()),
        itemId: "",
        name: "",
        description: "",
        hsnSac: "",
        quantity: 1,
        unit: "pcs",
        rate: 0,
        discount: 0,
        discountType: "percentage",
        tax: "none",
        amount: 0,
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return orderItems.reduce((sum, item) => {
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
    if (!formData.customerId) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    const validItems = orderItems.filter(item => item.itemId);
    if (validItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const subTotal = calculateSubTotal();
      const taxAmount = calculateTax();

      const customer = customers.find(c => c.id === formData.customerId);
      const customerState = customer?.billingAddress?.state?.toLowerCase() || '';
      const supplyState = formData.placeOfSupply?.toLowerCase() || '';
      const isInterState = customerState && supplyState && customerState !== supplyState;

      const orderData = {
        salesOrderNumber: formData.salesOrderNumber || nextOrderNumber,
        customerId: formData.customerId,
        customerName: formData.customerName,
        referenceNumber: formData.referenceNumber,
        date: formData.orderDate,
        expectedShipmentDate: formData.expectedShipmentDate,
        paymentTerms: paymentTermsOptions.find(p => p.value === formData.paymentTerms)?.label || "Due on Receipt",
        deliveryMethod: deliveryMethodOptions.find(d => d.value === formData.deliveryMethod)?.label || "Standard Delivery",
        salesperson: formData.salesperson,
        placeOfSupply: formData.placeOfSupply,
        billingAddress: customer?.billingAddress || { street: "", city: "", state: "", country: "", pincode: "" },
        shippingAddress: customer?.shippingAddress || { street: "", city: "", state: "", country: "", pincode: "" },
        items: validItems.map(item => ({
          id: item.id,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          hsnSac: item.hsnSac,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount,
          discountType: item.discountType,
          tax: getTaxRate(item.tax),
          taxName: item.tax,
          amount: item.amount,
          ordered: item.quantity,
          invoicedQty: 0,
          invoiceStatus: "Not Invoiced"
        })),
        subTotal,
        shippingCharges: formData.shippingCharges,
        cgst: isInterState ? 0 : taxAmount / 2,
        sgst: isInterState ? 0 : taxAmount / 2,
        igst: isInterState ? taxAmount : 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        orderStatus: status === 'draft' ? 'Draft' : 'Confirmed',
        invoiceStatus: "Not Invoiced",
        paymentStatus: "Unpaid",
        shipmentStatus: "Pending",
        invoices: [],
        createdBy: "Admin User"
      };

      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast({ title: `Sales order ${status === 'draft' ? 'saved as draft' : 'created'} successfully` });
        setLocation('/sales-orders');
      } else {
        toast({ title: "Failed to create sales order", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error creating sales order:', error);
      toast({ title: "Error creating sales order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/sales-orders')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">New Sales Order</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black">Customer Name
              <span className="text-red-600">*</span>
            </Label>
            <Select value={formData.customerId} onValueChange={handleCustomerChange}>
              <SelectTrigger className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="select-customer">
                <SelectValue placeholder="Select or add a customer" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customers..."
                      className="h-8"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {filteredCustomers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id} data-testid={`option-customer-${customer.id}`}>
                    {customer.name}
                  </SelectItem>
                ))}
                <div className="border-t mt-1 pt-1">
                  <SelectItem value="__add_new_customer__">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Plus className="h-4 w-4" />
                      Add New Customer
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="icon" data-testid="button-search-customer">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black">Sales Order#
              <span className="text-red-600">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.salesOrderNumber || nextOrderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, salesOrderNumber: e.target.value }))}
                className="flex-1"
                data-testid="input-order-number"
              />
              <Button variant="outline" size="icon" data-testid="button-edit-order-number">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reference#</Label>
            <Input
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              data-testid="input-reference-number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-black">Sales Order Date
              <span className="text-red-600">*</span>
            </Label>
            <Input
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
              data-testid="input-order-date"
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Shipment Date</Label>
            <Input
              type="date"
              value={formData.expectedShipmentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedShipmentDate: e.target.value }))}
              data-testid="input-shipment-date"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Select value={formData.paymentTerms} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentTerms: v }))}>
              <SelectTrigger data-testid="select-payment-terms">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                {paymentTermsOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <Select value={formData.deliveryMethod} onValueChange={(v) => setFormData(prev => ({ ...prev, deliveryMethod: v }))}>
              <SelectTrigger data-testid="select-delivery-method">
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                {deliveryMethodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <SelectTrigger data-testid="select-salesperson">
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
          <div className="space-y-2">
            <Label>Place of Supply</Label>
            <Select value={formData.placeOfSupply} onValueChange={(v) => setFormData(prev => ({ ...prev, placeOfSupply: v }))}>
              <SelectTrigger data-testid="select-place-of-supply">
                <SelectValue placeholder="Select place of supply" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maharashtra">Maharashtra</SelectItem>
                <SelectItem value="gujarat">Gujarat</SelectItem>
                <SelectItem value="karnataka">Karnataka</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 font-medium text-sm text-slate-700 dark:text-slate-300">
            Item Table
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase w-8"></th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item Details</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase w-24">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Rate (₹)</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase w-28">Discount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase w-32">Tax</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Amount</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {orderItems.map((item, index) => (
                  <tr key={item.id} data-testid={`row-item-${index}`}>
                    <td className="px-4 py-2 text-slate-400">::</td>
                    <td className="px-4 py-2">
                      <Select value={item.itemId} onValueChange={(v) => handleItemChange(index, v)}>
                        <SelectTrigger className="border-dashed" data-testid={`select-item-${index}`}>
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
                        onChange={(e) => updateOrderItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="text-center"
                        data-testid={`input-quantity-${index}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateOrderItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="text-right"
                        data-testid={`input-rate-${index}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateOrderItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center"
                          data-testid={`input-discount-${index}`}
                        />
                        <Select
                          value={item.discountType}
                          onValueChange={(v) => updateOrderItem(index, 'discountType', v)}
                        >
                          <SelectTrigger className="w-14" data-testid={`select-discount-type-${index}`}>
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
                      <Select value={item.tax} onValueChange={(v) => updateOrderItem(index, 'tax', v)}>
                        <SelectTrigger data-testid={`select-tax-${index}`}>
                          <SelectValue placeholder="Select a Tax" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxOptions.map(tax => (
                            <SelectItem key={tax.value} value={tax.value}>{tax.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => removeRow(index)}
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
          <div className="px-4 py-3 flex gap-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={addNewRow} data-testid="button-add-row">
              <Plus className="h-4 w-4 mr-1" />
              Add New Row
            </Button>
            <Button variant="link" className="text-blue-600 p-0 h-auto" data-testid="button-add-bulk">
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
                className="min-h-20"
                data-testid="textarea-customer-notes"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Sub Total</span>
              <span className="font-medium text-slate-900 dark:text-white" data-testid="text-subtotal">{formatCurrency(calculateSubTotal())}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Shipping Charges</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                className="w-32 text-right"
                data-testid="input-shipping-charges"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="tds" data-testid="checkbox-tds" />
                <Label htmlFor="tds" className="text-slate-600 dark:text-slate-400">TDS</Label>
                <Checkbox id="tcs" data-testid="checkbox-tcs" />
                <Label htmlFor="tcs" className="text-slate-600 dark:text-slate-400">TCS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Select>
                  <SelectTrigger className="w-32" data-testid="select-tds-tcs">
                    <SelectValue placeholder="Select a Tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-slate-500">- 0.00</span>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Adjustment</span>
              <Input
                type="number"
                step="0.01"
                value={formData.adjustment}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                className="w-32 text-right"
                data-testid="input-adjustment"
              />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white">Total ( ₹ )</span>
              <span className="font-bold text-lg text-slate-900 dark:text-white" data-testid="text-total">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                className="min-h-[100px]"
                data-testid="textarea-terms"
              />
            </div>
            <div className="space-y-2">
              <Label>Attach File(s) to Sales Order</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                <Button variant="outline" className="gap-2" data-testid="button-upload-file">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
                <p className="text-xs text-slate-500 mt-2">You can upload a maximum of 5 files, 10MB each</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            data-testid="button-save-draft"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit('confirmed')}
            disabled={loading}
            data-testid="button-save-send"
          >
            {loading ? 'Saving...' : 'Save and Send'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation('/sales-orders')}
            data-testid="button-cancel"
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
