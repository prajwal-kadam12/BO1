import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Plus, X, Search, Upload, Pencil, ArrowLeft, Loader2, Settings } from "lucide-react";
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
  ordered?: number;
  invoicedQty?: number;
  invoiceStatus?: string;
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

const getTaxValueFromName = (taxName: string | undefined, rate: number): string => {
  if (taxName && taxOptions.find(t => t.value === taxName)) {
    return taxName;
  }
  const rateMap: Record<number, string> = {
    0: "none",
    5: "GST5",
    12: "GST12",
    18: "GST18",
    28: "GST28",
  };
  return rateMap[rate] || "none";
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

const getPaymentTermsValue = (label: string): string => {
  const option = paymentTermsOptions.find(p => p.label === label);
  return option?.value || "due_on_receipt";
};

const getDeliveryMethodValue = (label: string): string => {
  const option = deliveryMethodOptions.find(d => d.label === label);
  return option?.value || "standard";
};

export default function SalesOrderEditPage() {
  const [, params] = useRoute("/sales-orders/:id/edit");
  const orderId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalOrder, setOriginalOrder] = useState<any>({});
  const [showManageSalespersons, setShowManageSalespersons] = useState(false);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);

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
    customerNotes: "",
    termsAndConditions: "",
    shippingCharges: 0,
    adjustment: 0,
    adjustmentDescription: "",
    orderStatus: "Draft",
  });

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
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

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

  const fetchOrderData = async () => {
    if (!orderId) {
      setInitialLoading(false);
      toast({ title: "Invalid order ID", variant: "destructive" });
      setLocation('/sales-orders');
      return;
    }
    try {
      const response = await fetch(`/api/sales-orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        const order = data.data;

        setOriginalOrder(order);

        setFormData({
          customerId: order.customerId || "",
          customerName: order.customerName || "",
          salesOrderNumber: order.salesOrderNumber || "",
          referenceNumber: order.referenceNumber || "",
          orderDate: order.date || new Date().toISOString().split('T')[0],
          expectedShipmentDate: order.expectedShipmentDate || "",
          paymentTerms: getPaymentTermsValue(order.paymentTerms),
          deliveryMethod: getDeliveryMethodValue(order.deliveryMethod),
          salesperson: order.salesperson || "",
          placeOfSupply: order.placeOfSupply?.toLowerCase() || "",
          customerNotes: order.customerNotes || "",
          termsAndConditions: order.termsAndConditions || "",
          shippingCharges: order.shippingCharges || 0,
          adjustment: order.adjustment || 0,
          adjustmentDescription: "",
          orderStatus: order.orderStatus || "Draft",
        });

        if (order.items && order.items.length > 0) {
          setOrderItems(order.items.map((item: any) => ({
            id: item.id || String(Date.now()),
            itemId: item.itemId || "",
            name: item.name || "",
            description: item.description || "",
            hsnSac: item.hsnSac || "",
            quantity: item.quantity || 1,
            unit: item.unit || "pcs",
            rate: item.rate || 0,
            discount: item.discount || 0,
            discountType: item.discountType || "percentage",
            tax: getTaxValueFromName(item.taxName, item.tax || 0),
            amount: item.amount || 0,
            ordered: item.ordered,
            invoicedQty: item.invoicedQty,
            invoiceStatus: item.invoiceStatus,
          })));
        }
      } else {
        toast({ title: "Failed to load order", variant: "destructive" });
        setLocation('/sales-orders');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast({ title: "Error loading order", variant: "destructive" });
      setLocation('/sales-orders');
    } finally {
      setInitialLoading(false);
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
    if (!originalOrder?.id) {
      toast({ title: "Please wait for order data to load", variant: "destructive" });
      return;
    }

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

      const defaultAddress = { street: "", city: "", state: "", country: "", pincode: "" };
      const orderData = {
        ...originalOrder,
        salesOrderNumber: formData.salesOrderNumber,
        customerId: formData.customerId,
        customerName: formData.customerName,
        referenceNumber: formData.referenceNumber,
        date: formData.orderDate,
        expectedShipmentDate: formData.expectedShipmentDate,
        paymentTerms: paymentTermsOptions.find(p => p.value === formData.paymentTerms)?.label || "Due on Receipt",
        deliveryMethod: deliveryMethodOptions.find(d => d.value === formData.deliveryMethod)?.label || "Standard Delivery",
        salesperson: formData.salesperson,
        placeOfSupply: formData.placeOfSupply,
        billingAddress: customer?.billingAddress || originalOrder?.billingAddress || defaultAddress,
        shippingAddress: customer?.shippingAddress || originalOrder?.shippingAddress || defaultAddress,
        items: validItems.map(item => {
          const originalItem = originalOrder?.items?.find((oi: any) => oi.id === item.id) || {};
          return {
            ...originalItem,
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
            ordered: item.ordered ?? originalItem?.ordered ?? item.quantity,
            invoicedQty: item.invoicedQty ?? originalItem?.invoicedQty ?? 0,
            invoiceStatus: item.invoiceStatus ?? originalItem?.invoiceStatus ?? "Not Invoiced"
          };
        }),
        subTotal,
        shippingCharges: formData.shippingCharges,
        cgst: isInterState ? 0 : taxAmount / 2,
        sgst: isInterState ? 0 : taxAmount / 2,
        igst: isInterState ? taxAmount : 0,
        adjustment: formData.adjustment,
        total: calculateTotal(),
        customerNotes: formData.customerNotes,
        termsAndConditions: formData.termsAndConditions,
        orderStatus: status === 'draft' ? 'Draft' : (originalOrder?.orderStatus === 'Draft' ? 'Confirmed' : originalOrder?.orderStatus || 'Confirmed'),
      };

      const response = await fetch(`/api/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast({ title: `Sales order updated successfully` });
        setLocation('/sales-orders');
      } else {
        toast({ title: "Failed to update sales order", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error updating sales order:', error);
      toast({ title: "Error updating sales order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

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
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Edit Sales Order</h1>
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
                value={formData.salesOrderNumber}
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
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full pl-8 pr-2 py-1.5 text-sm border-b bg-transparent outline-none"
                    placeholder="Search"
                  />
                </div>
                {salespersons.map(sp => (
                  <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                ))}
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-blue-600 cursor-pointer hover:bg-slate-100"
                  onClick={() => {
                    setShowManageSalespersons(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
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
              <Plus className="h-4 w-4 mr-1" /> Add another line
            </Button>
            <Button variant="link" className="text-blue-600 p-0 h-auto" data-testid="button-add-bulk">
              <Plus className="h-4 w-4 mr-1" /> Add items in bulk
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
                placeholder="Looking forward to your business."
                className="resize-none"
                data-testid="input-customer-notes"
              />
              <p className="text-xs text-slate-500">Will be displayed on the sales order</p>
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                placeholder="Enter the terms and conditions of your business..."
                className="resize-none"
                data-testid="input-terms"
              />
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sub Total</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{formatCurrency(calculateSubTotal())}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Shipping Charges</span>
              </div>
              <Input
                type="number"
                min="0"
                value={formData.shippingCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                className="w-28 text-right"
                data-testid="input-shipping"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{formatCurrency(calculateTax())}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Adjustment</span>
              </div>
              <Input
                type="number"
                value={formData.adjustment}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                className="w-28 text-right"
                data-testid="input-adjustment"
              />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-600 gap-2">
              <span className="text-base font-semibold text-slate-900 dark:text-white">Total (₹)</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">₹{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Checkbox id="tds" data-testid="checkbox-tds" />
            <Label htmlFor="tds" className="text-sm text-slate-600 dark:text-slate-400">Apply TDS/TCS</Label>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation('/sales-orders')} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              data-testid="button-save-draft"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit('confirm')}
              disabled={loading}
              data-testid="button-save-confirm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save and Confirm
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
