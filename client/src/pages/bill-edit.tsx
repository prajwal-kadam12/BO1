import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  FileText, Plus, Trash2, ChevronDown, Search,
  Upload, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vendor {
  id: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
}

interface BillItem {
  id: string;
  itemName: string;
  description?: string;
  account: string;
  quantity: number;
  rate: number;
  tax?: string;
  taxAmount?: number;
  customerDetails?: string;
  amount: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Tax {
  id: string;
  name: string;
  rate: number;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  type?: string;
  unit?: string;
  usageUnit?: string;
  sellingPrice?: number;
  costPrice?: number;
  rate?: string | number;
  purchaseRate?: string | number;
  description?: string;
  purchaseDescription?: string;
  hsnCode?: string;
  hsnSac?: string;
  sacCode?: string;
  taxPreference?: string;
}

interface Customer {
  id: string;
  name: string;
  displayName?: string;
  companyName?: string;
}

export default function BillEdit() {
  const params = useParams();
  const billId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBill, setLoadingBill] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    vendorAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      gstin: ""
    },
    billNumber: "",
    orderNumber: "",
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentTerms: "Due on Receipt",
    reverseCharge: false,
    subject: "",
    notes: "",
    items: [] as BillItem[],
    subTotal: 0,
    discountType: "percent",
    discountValue: 0,
    discountAmount: 0,
    taxType: "TDS",
    taxCategory: "",
    taxAmount: 0,
    adjustment: 0,
    adjustmentDescription: "",
    total: 0,
    status: "OPEN"
  });

  // Helper function to parse rate values that might contain commas
  const parseRateValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas and parse as float
    const stringValue = String(value).replace(/,/g, '');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    fetchVendors();
    fetchAccounts();
    fetchTaxes();
    fetchProducts();
    fetchCustomers();
    if (billId) {
      fetchBill();
    }
  }, [billId]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`);
      if (response.ok) {
        const data = await response.json();
        const bill = data.data;
        setFormData({
          vendorId: bill.vendorId || "",
          vendorName: bill.vendorName || "",
          vendorAddress: bill.vendorAddress || {
            street1: "",
            street2: "",
            city: "",
            state: "",
            pinCode: "",
            country: "India",
            gstin: ""
          },
          billNumber: bill.billNumber || "",
          orderNumber: bill.orderNumber || "",
          billDate: bill.billDate || new Date().toISOString().split('T')[0],
          dueDate: bill.dueDate || new Date().toISOString().split('T')[0],
          paymentTerms: bill.paymentTerms || "Due on Receipt",
          reverseCharge: bill.reverseCharge || false,
          subject: bill.subject || "",
          notes: bill.notes || "",
          items: bill.items || [],
          subTotal: bill.subTotal || 0,
          discountType: bill.discountType || "percent",
          discountValue: bill.discountValue || 0,
          discountAmount: bill.discountAmount || 0,
          taxType: bill.taxType || "TDS",
          taxCategory: bill.taxCategory || "",
          taxAmount: bill.taxAmount || 0,
          adjustment: bill.adjustment || 0,
          adjustmentDescription: bill.adjustmentDescription || "",
          total: bill.total || 0,
          status: bill.status || "OPEN"
        });
      }
    } catch (error) {
      console.error('Failed to fetch bill:', error);
      toast({ title: "Failed to load bill", variant: "destructive" });
    } finally {
      setLoadingBill(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/bills/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const response = await fetch('/api/bills/taxes');
      if (response.ok) {
        const data = await response.json();
        setTaxes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch taxes:', error);
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

  const getCustomerDisplayName = (customerId: string) => {
    if (!customerId || customerId === 'none') return 'None';
    const customer = customers.find(c => c.id === customerId);
    return customer ? (customer.displayName || customer.name) : 'None';
  };

  const filteredVendors = vendors.filter(vendor => {
    const vendorName = vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName || "";
    return vendorName.toLowerCase().includes(vendorSearchTerm.toLowerCase());
  });

  const handleVendorChange = (vendorId: string) => {
    if (vendorId === "__add_new_vendor__") {
      setLocation("/vendors/new");
      return;
    }

    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName || "",
        vendorAddress: {
          street1: vendor.billingAddress?.street1 || "",
          street2: vendor.billingAddress?.street2 || "",
          city: vendor.billingAddress?.city || "",
          state: vendor.billingAddress?.state || "",
          pinCode: vendor.billingAddress?.pinCode || "",
          country: vendor.billingAddress?.country || "India",
          gstin: vendor.gstin || ""
        }
      }));
    }
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: String(Date.now()),
      itemName: "",
      description: "",
      account: "",
      quantity: 1,
      rate: 0,
      tax: "",
      taxAmount: 0,
      customerDetails: "none",
      amount: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setFormData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
            if (updatedItem.tax) {
              const taxRate = taxes.find(t => t.name === updatedItem.tax)?.rate || 0;
              updatedItem.taxAmount = (updatedItem.amount * taxRate) / 100;
            }
          }
          if (field === 'tax') {
            const taxRate = taxes.find(t => t.name === value)?.rate || 0;
            updatedItem.taxAmount = (updatedItem.amount * taxRate) / 100;
          }
          return updatedItem;
        }
        return item;
      });

      const subTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = updatedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const discountAmount = prev.discountType === 'percent'
        ? (subTotal * prev.discountValue) / 100
        : prev.discountValue;
      const total = subTotal - discountAmount + taxAmount + prev.adjustment;

      return {
        ...prev,
        items: updatedItems,
        subTotal,
        taxAmount,
        discountAmount,
        total
      };
    });
  };

  const removeItem = (id: string) => {
    setFormData(prev => {
      const updatedItems = prev.items.filter(item => item.id !== id);
      const subTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = updatedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const discountAmount = prev.discountType === 'percent'
        ? (subTotal * prev.discountValue) / 100
        : prev.discountValue;
      const total = subTotal - discountAmount + taxAmount + prev.adjustment;

      return {
        ...prev,
        items: updatedItems,
        subTotal,
        taxAmount,
        discountAmount,
        total
      };
    });
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => {
        const updatedItems = prev.items.map(item => {
          if (item.id === itemId) {
            // For bills (purchases), use purchaseRate first, then rate, then costPrice/sellingPrice
            const rate = parseRateValue(product.purchaseRate) || parseRateValue(product.rate) || product.costPrice || product.sellingPrice || 0;
            const amount = item.quantity * rate;
            return {
              ...item,
              itemName: product.name,
              description: product.purchaseDescription || product.description || "",
              rate: rate,
              amount: amount
            };
          }
          return item;
        });

        const subTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = updatedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
        const discountAmount = prev.discountType === 'percent'
          ? (subTotal * prev.discountValue) / 100
          : prev.discountValue;
        const total = subTotal - discountAmount + taxAmount + prev.adjustment;

        return {
          ...prev,
          items: updatedItems,
          subTotal,
          taxAmount,
          discountAmount,
          total
        };
      });
    }
  };

  const handleDiscountChange = (type: string, value: number) => {
    setFormData(prev => {
      const discountAmount = type === 'percent'
        ? (prev.subTotal * value) / 100
        : value;
      const total = prev.subTotal - discountAmount + prev.taxAmount + prev.adjustment;
      return {
        ...prev,
        discountType: type,
        discountValue: value,
        discountAmount,
        total
      };
    });
  };

  const handleAdjustmentChange = (value: number) => {
    setFormData(prev => {
      const total = prev.subTotal - prev.discountAmount + prev.taxAmount + value;
      return {
        ...prev,
        adjustment: value,
        total
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }
    if (!formData.billNumber) {
      toast({ title: "Please enter a bill number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          balanceDue: formData.total
        })
      });

      if (response.ok) {
        toast({ title: "Bill updated successfully" });
        setLocation("/bills");
      } else {
        throw new Error('Failed to update bill');
      }
    } catch (error) {
      toast({ title: "Failed to update bill", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingBill) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading bill...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">Edit Bill - {formData.billNumber}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-black">Vendor Name
                  <span className="text-red-600">*</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <Select onValueChange={handleVendorChange} value={formData.vendorId}>
                    <SelectTrigger className="flex-1" data-testid="select-vendor">
                      <SelectValue placeholder="Select a Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search vendors..."
                            className="h-8"
                            value={vendorSearchTerm}
                            onChange={(e) => setVendorSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      {filteredVendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.displayName || `${(vendor as any).firstName} ${(vendor as any).lastName}`.trim() || vendor.companyName}
                        </SelectItem>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <SelectItem
                          value="__add_new_vendor__"
                          onSelect={() => {
                            setLocation("/vendors/new");
                          }}
                        >
                          <div className="flex items-center gap-2 text-blue-600">
                            <Plus className="h-4 w-4" />
                            Add New Vendor
                          </div>
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setLocation("/vendors/new")} data-testid="button-add-vendor">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-black">Bill#</Label>
                <Input
                  value={formData.billNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                  className="mt-1"
                  data-testid="input-bill-number"
                  disabled
                />
              </div>
              <div>
                <Label>Order Number</Label>
                <Input
                  value={formData.orderNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                  className="mt-1"
                  data-testid="input-order-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-black">Bill Date</Label>
                <Input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                  className="mt-1"
                  data-testid="input-bill-date"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1"
                    data-testid="input-due-date"
                  />
                </div>
                <div className="flex-1">
                  <Label>Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-payment-terms">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="reverse-charge"
                checked={formData.reverseCharge}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reverseCharge: checked as boolean }))}
              />
              <Label htmlFor="reverse-charge" className="text-sm">
                This transaction is applicable for reverse charge
              </Label>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                Subject <Info className="h-3 w-3 text-slate-400" />
              </Label>
              <Textarea
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter a subject within 250 characters"
                className="mt-1 resize-none"
                maxLength={250}
                data-testid="input-subject"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>At Transaction Level</span>
              <ChevronDown className="h-4 w-4" />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b">
                <h3 className="font-medium text-slate-700">Item Table</h3>
                <Button variant="link" size="sm" className="text-blue-600">
                  Bulk Actions
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[200px] text-xs">ITEM DETAILS</TableHead>
                    <TableHead className="w-[150px] text-xs">ACCOUNT</TableHead>
                    <TableHead className="w-[100px] text-xs text-center">QUANTITY</TableHead>
                    <TableHead className="w-[100px] text-xs text-right">RATE (₹)</TableHead>
                    <TableHead className="w-[120px] text-xs">TAX</TableHead>
                    <TableHead className="w-[150px] text-xs">CUSTOMER DETAILS</TableHead>
                    <TableHead className="w-[100px] text-xs text-right">AMOUNT</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No items added yet. Click "Add New Row" to add items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.itemName || ""}
                            onValueChange={(value) => {
                              const product = products.find(p => p.name === value);
                              if (product) {
                                handleProductSelect(item.id, product.id);
                              }
                            }}
                          >
                            <SelectTrigger className="text-sm" data-testid={`select-item-${item.id}`}>
                              <SelectValue placeholder={loadingProducts ? "Loading items..." : "Select an item"} />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingProducts ? (
                                <SelectItem value="loading" disabled>Loading items...</SelectItem>
                              ) : products.length === 0 ? (
                                <SelectItem value="none" disabled>No items available</SelectItem>
                              ) : (
                                products.map(product => {
                                  const displayPrice = parseRateValue(product.purchaseRate) || parseRateValue(product.rate) || product.costPrice || product.sellingPrice || 0;
                                  return (
                                    <SelectItem key={product.id} value={product.name}>
                                      {product.name} {product.usageUnit ? `(${product.usageUnit})` : ''} - ₹{displayPrice.toLocaleString('en-IN')}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <AccountSelectDropdown
                            value={item.account}
                            onValueChange={(value) => updateItem(item.id, 'account', value)}
                            placeholder="Select an account"
                            triggerClassName="text-sm"
                            testId={`select-account-${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            
                            className="text-sm text-center"
                            min={0}
                            step={0.01}
                            data-testid={`input-quantity-${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            
                            className="text-sm text-right"
                            min={0}
                            step={0.01}
                            data-testid={`input-rate-${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.tax || ""}
                            onValueChange={(value) => updateItem(item.id, 'tax', value)}
                          >
                            <SelectTrigger className="text-sm" data-testid={`select-tax-${item.id}`}>
                              <SelectValue placeholder="Select a Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Tax</SelectItem>
                              {taxes.map(tax => (
                                <SelectItem key={tax.id} value={tax.name}>
                                  {tax.name} ({tax.rate}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.customerDetails || "none"}
                            onValueChange={(value) => updateItem(item.id, 'customerDetails', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select Customer">
                                {getCustomerDisplayName(item.customerDetails || "none")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.displayName || customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeItem(item.id)}
                            data-testid={`button-remove-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="p-3 border-t">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-add-new-row">
                      <Plus className="h-4 w-4" />
                      Add New Row
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={addItem}>Add Item</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-medium">{formData.subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-600">Discount</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => handleDiscountChange(formData.discountType, parseFloat(e.target.value) || 0)}
                      
                      className="w-16 text-sm text-right"
                      min={0}
                      data-testid="input-discount"
                    />
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) => handleDiscountChange(value, formData.discountValue)}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="amount">₹</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-pink-600 w-20 text-right">-{formData.discountAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="tds"
                      name="taxType"
                      value="TDS"
                      checked={formData.taxType === 'TDS'}
                      onChange={() => setFormData(prev => ({ ...prev, taxType: 'TDS' }))}
                    />
                    <Label htmlFor="tds">TDS</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="tcs"
                      name="taxType"
                      value="TCS"
                      checked={formData.taxType === 'TCS'}
                      onChange={() => setFormData(prev => ({ ...prev, taxType: 'TCS' }))}
                    />
                    <Label htmlFor="tcs">TCS</Label>
                  </div>
                  <Select
                    value={formData.taxCategory}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taxCategory: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a Tax" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tax</SelectItem>
                      {taxes.map(tax => (
                        <SelectItem key={tax.id} value={tax.name}>
                          {tax.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-600">Adjustment</span>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.adjustmentDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, adjustmentDescription: e.target.value }))}
                      placeholder="Description"
                      className="w-32 text-sm"
                    />
                    <Input
                      type="number"
                      value={formData.adjustment}
                      onChange={(e) => handleAdjustmentChange(parseFloat(e.target.value) || 0)}
                      
                      className="w-24 text-sm text-right"
                      data-testid="input-adjustment"
                    />
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t font-semibold text-lg">
                  <span>Total</span>
                  <span data-testid="text-total">{formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes"
                  className="mt-1 resize-none bg-white"
                  data-testid="input-notes"
                />
                <p className="text-xs text-slate-500 mt-1">It will not be shown in PDF</p>
              </div>
              <div>
                <Label>Attach File(s) to Bill</Label>
                <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center bg-white">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">You can upload a maximum of 5 files, 10MB each</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
            data-testid="button-save"
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/bills")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
