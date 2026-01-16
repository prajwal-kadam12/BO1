import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  FileText,
  Plus,
  X,
  Search,
  Upload,
  ChevronDown,
  HelpCircle,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSelectDropdown } from "@/components/AccountSelectDropdown";
import { VendorAddressModal } from "@/components/VendorAddressModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vendor {
  id: string;
  displayName: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  billingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    countryRegion?: string;
  };
  gstin?: string;
  gstTreatment?: string;
}

interface Customer {
  id: string;
  name: string;
  displayName: string;
  email?: string;
  phone?: string;
}

interface Item {
  id: string;
  name: string;
  description?: string;
  purchaseDescription?: string;
  rate?: string | number;
  purchaseRate?: string | number;
  sellingPrice?: number;
  purchasePrice?: number;
}

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  tax: string;
  taxAmount: number;
  amount: number;
}

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due end of the month",
  "Due end of next month",
];

const SHIPMENT_PREFERENCES = [
  "Standard Shipping",
  "Express Shipping",
  "Overnight Shipping",
  "Local Pickup",
  "Freight Shipping",
];

const TAX_OPTIONS = [
  { value: "none", label: "Select a Tax" },
  { value: "gst_5", label: "GST 5%" },
  { value: "gst_12", label: "GST 12%" },
  { value: "gst_18", label: "GST 18%" },
  { value: "gst_28", label: "GST 28%" },
];

export default function PurchaseOrderEdit() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    gstTreatment: "",
    sourceOfSupply: "MH - Maharashtra",
    destinationOfSupply: "MH - Maharashtra",
    vendorBillingAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      countryRegion: "India",
    },
    deliveryAddressType: "organization" as "organization" | "customer",
    deliveryAddress: {
      attention: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pinCode: "",
      countryRegion: "India",
    },
    organizationDetails: {
      name: "Rohan Bhosale",
      address:
        "Hinjewadi - Wakad road\nHinjewadi\nPune, Maharashtra\nIndia, 411057",
    },
    selectedCustomer: null as Customer | null,
    customerSearchQuery: "",
    subject: "",
    referenceNumber: "",
    date: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    paymentTerms: "Due on Receipt",
    shipmentPreference: "",
    notes: "",
    termsAndConditions: "",
    discountType: "percent",
    discountValue: 0,
    adjustment: 0,
    adjustmentDescription: "",
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const [customersRes, orgRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/organization"),
        ]);

        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.data || []);
        }

        if (orgRes.ok) {
          const data = await orgRes.json();
          const orgs = data.data || [];
          if (orgs.length > 0 && !params.id) {
            // Only pre-fill for new, or if not already set
            const org = orgs[0];
            setFormData((prev) => ({
              ...prev,
              organizationDetails: {
                name: org.name || prev.organizationDetails.name,
                address:
                  [
                    org.street1,
                    org.street2,
                    org.city,
                    org.state,
                    org.postalCode
                      ? `${org.location}, ${org.postalCode}`
                      : org.location,
                  ]
                    .filter(Boolean)
                    .join("\n") || prev.organizationDetails.address,
              },
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchCustomers();
  }, [params.id]);

  useEffect(() => {
    fetchInitialData();
  }, [params.id]);

  const fetchInitialData = async () => {
    try {
      const [vendorsRes, itemsRes, poRes, customersRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/items"),
        fetch(`/api/purchase-orders/${params.id}`),
        fetch("/api/customers"),
      ]);

      let vList: Vendor[] = [];
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        vList = data.data || [];
        setVendors(vList);
      }

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.data || []);
      }

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.data || []);
      }

      if (poRes.ok) {
        const data = await poRes.json();
        const po = data.data;

        const currentVendor = vList.find((v: Vendor) => v.id === po.vendorId);
        if (currentVendor) setSelectedVendor(currentVendor);

        setPurchaseOrderNumber(po.purchaseOrderNumber);
        setFormData({
          vendorId: po.vendorId || "",
          vendorName: po.vendorName || "",
          gstTreatment: po.gstTreatment || "",
          sourceOfSupply: po.sourceOfSupply || "MH - Maharashtra",
          destinationOfSupply: po.destinationOfSupply || "MH - Maharashtra",
          vendorBillingAddress: {
            street1:
              po.vendorBillingAddress?.street1 ||
              currentVendor?.billingAddress?.street1 ||
              "",
            street2:
              po.vendorBillingAddress?.street2 ||
              currentVendor?.billingAddress?.street2 ||
              "",
            city:
              po.vendorBillingAddress?.city ||
              currentVendor?.billingAddress?.city ||
              "",
            state:
              po.vendorBillingAddress?.state ||
              currentVendor?.billingAddress?.state ||
              "",
            pinCode:
              po.vendorBillingAddress?.pinCode ||
              currentVendor?.billingAddress?.pinCode ||
              "",
            countryRegion:
              po.vendorBillingAddress?.countryRegion ||
              currentVendor?.billingAddress?.countryRegion ||
              "India",
          },
          deliveryAddressType: po.deliveryAddressType || "organization",
          deliveryAddress: po.deliveryAddress || {
            attention: "",
            street1: "",
            street2: "",
            city: "",
            state: "",
            pinCode: "",
            countryRegion: "India",
          },
          organizationDetails: po.organizationDetails || {
            name: "Rohan Bhosale",
            address:
              "Hinjewadi - Wakad road\nHinjewadi\nPune, Maharashtra\nIndia, 411057",
          },
          selectedCustomer: po.selectedCustomer || null,
          customerSearchQuery: "",
          subject: po.subject || "",
          referenceNumber: po.referenceNumber || "",
          date: po.date || new Date().toISOString().split("T")[0],
          deliveryDate: po.deliveryDate || "",
          paymentTerms: po.paymentTerms || "Due on Receipt",
          shipmentPreference: po.shipmentPreference || "",
          notes: po.notes || "",
          termsAndConditions: po.termsAndConditions || "",
          discountType: po.discountType || "percent",
          discountValue: po.discountValue || 0,
          adjustment: po.adjustment || 0,
          adjustmentDescription: po.adjustmentDescription || "",
        });
        setLineItems(po.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Failed to load purchase order", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setFormData({
        ...formData,
        vendorId: vendor.id,
        vendorName: vendor.displayName,
        gstTreatment: vendor.gstTreatment || "",
        vendorBillingAddress: {
          street1: vendor.billingAddress?.street1 || "",
          street2: vendor.billingAddress?.street2 || "",
          city: vendor.billingAddress?.city || "",
          state: vendor.billingAddress?.state || "",
          pinCode: vendor.billingAddress?.pinCode || "",
          countryRegion: vendor.billingAddress?.countryRegion || "India",
        },
      });
    }
  };

  const calculateSubTotal = () =>
    lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const calculateTaxTotal = () =>
    lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const calculateDiscount = () => {
    const subTotal = calculateSubTotal();
    return formData.discountType === "percent"
      ? (subTotal * formData.discountValue) / 100
      : formData.discountValue;
  };
  const calculateTotal = () =>
    calculateSubTotal() -
    calculateDiscount() +
    calculateTaxTotal() +
    formData.adjustment;

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "rate" || field === "tax") {
            const baseAmount = updated.quantity * updated.rate;
            let taxRate = 0;
            if (updated.tax && updated.tax !== "none") {
              taxRate = parseInt(updated.tax.replace(/\D/g, "")) || 0;
            }
            updated.taxAmount = (baseAmount * taxRate) / 100;
            updated.amount = baseAmount + updated.taxAmount;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const deleteLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast({ title: "At least one item is required", variant: "destructive" });
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: "",
      itemName: "",
      description: "",
      account: "Cost of Goods Sold",
      quantity: 1,
      rate: 0,
      tax: "none",
      taxAmount: 0,
      amount: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleSubmit = async () => {
    if (!formData.vendorId) {
      toast({ title: "Please select a vendor", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/purchase-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchaseOrderNumber,
          items: lineItems,
          subTotal: calculateSubTotal(),
          discountAmount: calculateDiscount(),
          taxAmount: calculateTaxTotal(),
          total: calculateTotal(),
        }),
      });

      if (response.ok) {
        toast({ title: "Purchase order updated successfully" });
        setLocation("/purchase-orders");
      } else {
        toast({
          title: "Failed to update purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-slate-600" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Purchase Order
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Select
                value={formData.vendorId}
                onValueChange={handleVendorChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="space-y-4">
            <Label className="text-black">
              Delivery Address <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroup
                  value={formData.deliveryAddressType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, deliveryAddressType: v as any })
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="organization" id="addr-org-edit" />
                    <Label htmlFor="addr-org-edit" className="font-normal">
                      Organization
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="addr-cust-edit" />
                    <Label htmlFor="addr-cust-edit" className="font-normal">
                      Customer
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {formData.deliveryAddressType === "organization" ? (
              <div className="border rounded-md p-4 bg-slate-50/50 space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-semibold">
                    Organization Name
                  </Label>
                  <Input
                    value={formData.organizationDetails.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationDetails: {
                          ...formData.organizationDetails,
                          name: e.target.value,
                        },
                      })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase font-semibold">
                    Organization Address
                  </Label>
                  <Textarea
                    value={formData.organizationDetails.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationDetails: {
                          ...formData.organizationDetails,
                          address: e.target.value,
                        },
                      })
                    }
                    className="bg-white min-h-[100px] resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl">
                <Popover
                  open={isCustomerPopoverOpen}
                  onOpenChange={setIsCustomerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerPopoverOpen}
                      className="w-full justify-between bg-white"
                    >
                      {formData.selectedCustomer
                        ? formData.selectedCustomer.displayName
                        : "Select a Customer"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search customers..."
                        value={formData.customerSearchQuery}
                        onValueChange={(v) =>
                          setFormData({ ...formData, customerSearchQuery: v })
                        }
                      />
                      <CommandEmpty>
                        <div className="p-4 text-center space-y-4">
                          <p className="text-sm text-slate-500">
                            No customers found.
                          </p>
                          <Button
                            variant="default"
                            className="w-full py-6 text-base"
                            onClick={() => setLocation("/customers/new")}
                          >
                            <Plus className="mr-2 h-5 w-5" /> Create Customer
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {customers
                          .filter((c) =>
                            c.displayName
                              .toLowerCase()
                              .includes(
                                formData.customerSearchQuery.toLowerCase(),
                              ),
                          )
                          .map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.displayName}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  selectedCustomer: customer,
                                });
                                setIsCustomerPopoverOpen(false);
                              }}
                            >
                              {customer.displayName}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Purchase Order#</Label>
              <Input
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference#</Label>
              <Input
                value={formData.referenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v) =>
                  setFormData({ ...formData, paymentTerms: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shipment Preference</Label>
              <Select
                value={formData.shipmentPreference}
                onValueChange={(v) =>
                  setFormData({ ...formData, shipmentPreference: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_PREFERENCES.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Let your vendor know what this purchase order is for"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Item Details</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <Select
                          value={item.itemId}
                          onValueChange={(val) => {
                            const selectedItem = items.find(
                              (i) => i.id === val,
                            );
                            if (selectedItem) {
                              updateLineItem(
                                item.id,
                                "itemId",
                                selectedItem.id,
                              );
                              updateLineItem(
                                item.id,
                                "itemName",
                                selectedItem.name,
                              );
                              updateLineItem(
                                item.id,
                                "description",
                                selectedItem.purchaseDescription ||
                                  selectedItem.description ||
                                  "",
                              );
                              updateLineItem(
                                item.id,
                                "rate",
                                Number(
                                  selectedItem.purchaseRate ||
                                    selectedItem.purchasePrice ||
                                    0,
                                ),
                              );
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea
                          className="text-xs h-20 resize-none"
                          placeholder="Item description..."
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <Input
                        type="number"
                        className="w-24 ml-auto text-right"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "quantity",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <Input
                        type="number"
                        className="w-32 ml-auto text-right"
                        value={item.rate}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "rate",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right align-top pt-4">
                      <div className="space-y-2">
                        <Select
                          value={item.tax}
                          onValueChange={(v) =>
                            updateLineItem(item.id, "tax", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-right font-medium">
                          ₹
                          {item.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-10 align-top pt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => deleteLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-slate-50 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" /> Add another line
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t">
            <div className="w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sub Total</span>
                <span className="font-medium">
                  ₹
                  {calculateSubTotal().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Total (₹)</span>
                <span>
                  ₹
                  {calculateTotal().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-start gap-4 pt-8 border-t">
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              Update Purchase Order
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/purchase-orders")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
