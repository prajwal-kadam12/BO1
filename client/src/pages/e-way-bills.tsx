// import { useState, useEffect } from "react";
// import { usePagination } from "@/hooks/use-pagination";
// import { TablePagination } from "@/components/table-pagination";
// import { TransporterSelect } from "@/components/transporter-select";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//     ResizableHandle,
//     ResizablePanel,
//     ResizablePanelGroup,
// } from "@/components/ui/resizable";
// import {
//     Plus,
//     X,
//     ChevronDown,
//     Search,
//     ChevronsUpDown,
//     Check,
// } from "lucide-react";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import {
//     Command,
//     CommandEmpty,
//     CommandGroup,
//     CommandInput,
//     CommandItem,
//     CommandList,
// } from "@/components/ui/command";
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from "@/components/ui/popover";
// import { cn } from "@/lib/utils";
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//     Dialog,
//     DialogContent,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
// import { Checkbox } from "@/components/ui/checkbox";
// import EWayBillDetailPanel from "@/modules/e-way-bills/components/EWayBillDetailPanel";

// interface EWayBillListItem {
//     id: string;
//     ewayBillNumber: string;
//     documentType: string;
//     documentNumber: string;
//     customerName: string;
//     customerGstin: string;
//     customerId: string;
//     date: string;
//     expiryDate: string;
//     total: number;
//     status: string;
//     transactionType: string;
// }

// interface EWayBillDetail extends EWayBillListItem {
//     transactionSubType: string;
//     dispatchFrom: any;
//     billFrom: any;
//     billTo: any;
//     shipTo: any;
//     placeOfDelivery: string;
//     transporter: string;
//     distance: number;
//     modeOfTransportation: string;
//     vehicleType: string;
//     vehicleNo: string;
//     transporterDocNo: string;
//     transporterDocDate: string;
//     items: any[];
// }

// interface Customer {
//     id: string;
//     displayName: string;
//     billingAddress?: any;
//     shippingAddress?: any;
// }

// const formatCurrency = (amount: any) => {
//     if (!amount || isNaN(Number(amount))) return '₹0.00';
//     return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// };

// const formatDate = (dateString: string) => {
//     if (!dateString) return '-';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
// };

// const getStatusColor = (status: string) => {
//     switch (status?.toUpperCase()) {
//         case 'GENERATED': return 'bg-green-100 text-green-700 border-green-200';
//         case 'NOT_GENERATED': return 'bg-amber-100 text-amber-700 border-amber-200';
//         case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
//         default: return 'bg-slate-100 text-slate-600 border-slate-200';
//     }
// };

// const documentTypes = [
//     { value: 'credit_notes', label: 'Credit Notes' },
//     { value: 'invoices', label: 'Invoices' },
//     { value: 'delivery_challans', label: 'Delivery Challans' },
//     { value: 'sales_orders', label: 'Sales Orders' },
// ];

// const transactionSubTypes = [
//     { value: 'sales_return', label: 'Sales Return' },
//     { value: 'supply', label: 'Supply' },
//     { value: 'export', label: 'Export' },
//     { value: 'job_work', label: 'Job Work' },
// ];

// const transactionTypes = [
//     { value: 'regular', label: 'Regular' },
//     { value: 'bill_to_ship_to', label: 'Bill To - Ship To' },
//     { value: 'bill_from_dispatch_from', label: 'Bill From - Dispatch From' },
//     { value: 'combination', label: 'Combination of 2 and 3' },
// ];

// const INDIAN_STATES_WITH_CODES = [
//     { code: "MH", name: "Maharashtra" },
//     { code: "DL", name: "Delhi" },
//     { code: "KA", name: "Karnataka" },
// ];

// export default function EWayBills() {
//     const { toast } = useToast();
//     const [ewayBills, setEwayBills] = useState<EWayBillListItem[]>([]);
//     const [selectedBill, setSelectedBill] = useState<EWayBillDetail | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//     const [billToDelete, setBillToDelete] = useState<string | null>(null);
//     const [showCreateForm, setShowCreateForm] = useState(false);
//     const [customers, setCustomers] = useState<Customer[]>([]);
//     const [creditNotes, setCreditNotes] = useState<any[]>([]);
//     const [invoices, setInvoices] = useState<any[]>([]);
//     const [deliveryChallans, setDeliveryChallans] = useState<any[]>([]);
//     const [salesOrders, setSalesOrders] = useState<any[]>([]);

//     const [formData, setFormData] = useState({
//         documentType: 'invoices',
//         transactionSubType: 'supply',
//         customerId: '',
//         customerName: '',
//         documentNumber: '',
//         documentId: '',
//         date: new Date().toISOString().split('T')[0],
//         transactionType: 'regular',
//         placeOfDelivery: '',
//         transporter: '',
//         distance: 0,
//         modeOfTransportation: 'road',
//         vehicleType: 'regular',
//         vehicleNo: '',
//         transporterDocNo: '',
//         transporterDocDate: '',
//         total: 0,
//     });

//     const [addressData, setAddressData] = useState({
//         dispatchFrom: { street: '', city: '', state: '', country: 'India', pincode: '' },
//         billFrom: { street: '', city: '', state: '', country: 'India', pincode: '' },
//         billTo: { street: '', city: '', state: '', country: 'India', pincode: '' },
//         shipTo: { street: '', city: '', state: '', country: 'India', pincode: '' },
//     });

//     useEffect(() => {
//         fetchEWayBills();
//         fetchCustomers();
//         fetchDocuments();
//     }, []);

//     const fetchEWayBills = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch('/api/eway-bills');
//             if (response.ok) {
//                 const data = await response.json();
//                 setEwayBills(data.data || []);
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchCustomers = async () => {
//         const response = await fetch('/api/customers');
//         if (response.ok) {
//             const data = await response.json();
//             setCustomers(data.data || []);
//         }
//     };

//     const fetchDocuments = async () => {
//         try {
//             const [cn, inv, dc, so] = await Promise.all([
//                 fetch('/api/credit-notes').then(r => r.json()),
//                 fetch('/api/invoices').then(r => r.json()),
//                 fetch('/api/delivery-challans').then(r => r.json()),
//                 fetch('/api/sales-orders').then(r => r.json())
//             ]);
//             setCreditNotes(cn.data || []);
//             setInvoices(inv.data || []);
//             setDeliveryChallans(dc.data || []);
//             setSalesOrders(so.data || []);
//         } catch (e) {
//             console.error("Error fetching docs", e);
//         }
//     };

//     const fetchEWayBillDetail = async (id: string) => {
//         try {
//             const response = await fetch(`/api/eway-bills/${id}`);
//             if (response.ok) {
//                 const data = await response.json();
//                 setSelectedBill(data.data);
//             }
//         } catch (error) {
//             console.error('Error fetching bill details:', error);
//         }
//     };

//     const handleCustomerSelect = (customer: Customer) => {
//         setFormData(prev => ({
//             ...prev,
//             customerId: customer.id,
//             customerName: customer.displayName,
//             documentId: '',
//             documentNumber: '',
//             total: 0
//         }));
//         if (customer.billingAddress) {
//             setAddressData(prev => ({
//                 ...prev,
//                 billTo: { ...prev.billTo, ...customer.billingAddress }
//             }));
//         }
//     };

//     const handleDocumentSelect = (doc: any) => {
//         setFormData(prev => ({
//             ...prev,
//             documentId: doc.id,
//             documentNumber: doc.invoiceNumber || doc.challanNumber || doc.creditNoteNumber || doc.salesOrderNumber || '',
//             total: doc.total || 0
//         }));
//     };

//     const getDocumentOptions = () => {
//         if (!formData.customerId) return [];
//         switch (formData.documentType) {
//             case 'credit_notes': return creditNotes.filter(cn => cn.customerId === formData.customerId).map(doc => ({ ...doc, number: doc.creditNoteNumber }));
//             case 'invoices': return invoices.filter(inv => inv.customerId === formData.customerId).map(doc => ({ ...doc, number: doc.invoiceNumber }));
//             case 'delivery_challans': return deliveryChallans.filter(dc => dc.customerId === formData.customerId).map(doc => ({ ...doc, number: doc.challanNumber }));
//             case 'sales_orders': return salesOrders.filter(so => so.customerId === formData.customerId).map(doc => ({ ...doc, number: doc.salesOrderNumber }));
//             default: return [];
//         }
//     };

//     const handleAddressChange = (type: string, field: string, value: string) => {
//         setAddressData(prev => ({
//             ...prev,
//             [type]: { ...prev[type as keyof typeof prev], [field]: value }
//         }));
//     };

//     const handleSubmit = async () => {
//         try {
//             const method = selectedBill ? 'PUT' : 'POST';
//             const url = selectedBill ? `/api/eway-bills/${selectedBill.id}` : '/api/eway-bills';
//             const response = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ ...formData, ...addressData })
//             });
//             if (response.ok) {
//                 toast({ title: "Success", description: "e-Way Bill saved successfully" });
//                 setShowCreateForm(false);
//                 fetchEWayBills();
//             }
//         } catch (error) {
//             toast({ title: "Error", description: "Failed to save e-Way Bill", variant: "destructive" });
//         }
//     };

//     const handleDeleteBill = async () => {
//         if (!billToDelete) return;
//         try {
//             const response = await fetch(`/api/eway-bills/${billToDelete}`, { method: 'DELETE' });
//             if (response.ok) {
//                 toast({ title: "Success", description: "e-Way Bill deleted successfully" });
//                 setDeleteDialogOpen(false);
//                 setSelectedBill(null);
//                 fetchEWayBills();
//             }
//         } catch (error) {
//             toast({ title: "Error", description: "Failed to delete e-Way Bill", variant: "destructive" });
//         }
//     };

//     const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(ewayBills, 10);

//     return (
//         <div className="flex h-[calc(100vh-80px)] animate-in fade-in duration-300">
//             <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="eway-bills-layout">
//                 <ResizablePanel
//                     defaultSize={selectedBill ? 25 : 100}
//                     minSize={20}
//                     className="flex flex-col overflow-hidden bg-white border-r border-slate-200"
//                 >
//                     <div className="flex-1 flex flex-col h-full overflow-hidden">
//                         <div className="flex items-center justify-between gap-4 p-4 border-b border-border/60 bg-white sticky top-0 z-10">
//                             <h2 className="text-lg font-semibold px-2">All e-Way Bills</h2>
//                             <Button className="gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreateForm(true)}>
//                                 <Plus className="h-4 w-4" /> New
//                             </Button>
//                         </div>

//                         <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
//                             <div className="relative flex-1 max-sm">
//                                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                                 <Input placeholder="Search e-Way Bills..." className="pl-8 h-9" />
//                             </div>
//                         </div>

//                         <div className="flex-1 overflow-hidden">
//                             <ScrollArea className="h-full">
//                                 <table className="w-full">
//                                     <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
//                                         <tr className="text-left text-[11px] uppercase text-slate-500 font-bold tracking-wider">
//                                             {selectedBill ? (
//                                                 <th className="px-4 py-3">All e-Way Bills <ChevronDown className="inline h-3 w-3 ml-1" /></th>
//                                             ) : (
//                                                 <>
//                                                     <th className="p-3 w-10"><Checkbox /></th>
//                                                     <th className="p-3">e-Way Bill No</th>
//                                                     <th className="p-3">Date</th>
//                                                     <th className="p-3">Customer</th>
//                                                     <th className="p-3">Doc No</th>
//                                                     <th className="p-3">Status</th>
//                                                     <th className="p-3 text-right">Amount</th>
//                                                 </>
//                                             )}
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {paginatedItems.map((bill) => (
//                                             <tr
//                                                 key={bill.id}
//                                                 className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${selectedBill?.id === bill.id ? 'bg-[#F3F4FB]' : ''}`}
//                                                 onClick={() => fetchEWayBillDetail(bill.id)}
//                                             >
//                                                 {selectedBill ? (
//                                                     <td className="p-3">
//                                                         <div className="flex items-center justify-between w-full">
//                                                             <div className="flex items-center gap-3">
//                                                                 <Checkbox className="rounded-[4px] border-slate-300" onClick={(e) => e.stopPropagation()} />
//                                                                 <div className="flex flex-col gap-0.5">
//                                                                     <span className="text-[14px] font-semibold text-[#334155] leading-tight">
//                                                                         {bill.ewayBillNumber || 'Not Generated'}
//                                                                     </span>
//                                                                     <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
//                                                                         <span>{formatDate(bill.date)}</span>
//                                                                         <span className="text-slate-300">•</span>
//                                                                         <span>{bill.customerName}</span>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                             <span className="text-[14px] font-semibold text-[#1e293b]">
//                                                                 {formatCurrency(bill.total)}
//                                                             </span>
//                                                         </div>
//                                                     </td>
//                                                 ) : (
//                                                     <>
//                                                         <td className="p-3" onClick={(e) => e.stopPropagation()}><Checkbox /></td>
//                                                         <td className="p-3 text-sm font-medium">{bill.ewayBillNumber || '-'}</td>
//                                                         <td className="p-3 text-sm">{formatDate(bill.date)}</td>
//                                                         <td className="p-3 text-sm">{bill.customerName}</td>
//                                                         <td className="p-3 text-sm">{bill.documentNumber}</td>
//                                                         <td className="p-3">
//                                                             <Badge className={cn("text-[10px] h-5", getStatusColor(bill.status))}>
//                                                                 {bill.status}
//                                                             </Badge>
//                                                         </td>
//                                                         <td className="p-3 text-sm text-right font-semibold">
//                                                             {formatCurrency(bill.total)}
//                                                         </td>
//                                                     </>
//                                                 )}
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </ScrollArea>
//                             {ewayBills.length > 0 && (
//                                 <TablePagination
//                                     currentPage={currentPage}
//                                     totalPages={totalPages}
//                                     totalItems={totalItems}
//                                     itemsPerPage={itemsPerPage}
//                                     onPageChange={goToPage}
//                                 />
//                             )}
//                         </div>
//                     </div>
//                 </ResizablePanel>

//                 {selectedBill && (
//                     <>
//                         <ResizableHandle withHandle className="w-[1px] bg-slate-200 hover:bg-blue-400 transition-colors" />
//                         <ResizablePanel defaultSize={75} minSize={40} className="bg-white">
//                             <EWayBillDetailPanel
//                                 ewayBill={selectedBill as any}
//                                 onClose={() => setSelectedBill(null)}
//                                 onEdit={() => setShowCreateForm(true)}
//                                 onDelete={() => { setBillToDelete(selectedBill.id); setDeleteDialogOpen(true); }}
//                             />
//                         </ResizablePanel>
//                     </>
//                 )}
//             </ResizablePanelGroup>

//             <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
//                 <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl">
//                     <div className="p-4 border-b flex items-center justify-between bg-muted/20">
//                         <DialogTitle className="text-xl font-bold">New e-Way Bill</DialogTitle>
//                         <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
//                             <X className="h-4 w-4" />
//                         </Button>
//                     </div>
//                     <ScrollArea className="flex-1 p-6">
//                         <div className="space-y-8">
//                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                                 <div className="space-y-2">
//                                     <Label>Document Type</Label>
//                                     <Select value={formData.documentType} onValueChange={(val) => setFormData(prev => ({ ...prev, documentType: val }))}>
//                                         <SelectTrigger><SelectValue /></SelectTrigger>
//                                         <SelectContent>
//                                             {documentTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <Label>Customer Name</Label>
//                                     <Popover>
//                                         <PopoverTrigger asChild>
//                                             <Button variant="outline" className="w-full justify-between">
//                                                 {formData.customerName || "Select customer..."}
//                                                 <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
//                                             </Button>
//                                         </PopoverTrigger>
//                                         <PopoverContent className="w-full p-0">
//                                             <Command>
//                                                 <CommandInput placeholder="Search customer..." />
//                                                 <CommandList>
//                                                     <CommandEmpty>No customer found.</CommandEmpty>
//                                                     <CommandGroup>
//                                                         {customers.map((c) => (
//                                                             <CommandItem key={c.id} onSelect={() => handleCustomerSelect(c)}>
//                                                                 <Check className={cn("mr-2 h-4 w-4", formData.customerId === c.id ? "opacity-100" : "opacity-0")} />
//                                                                 {c.displayName}
//                                                             </CommandItem>
//                                                         ))}
//                                                     </CommandGroup>
//                                                 </CommandList>
//                                             </Command>
//                                         </PopoverContent>
//                                     </Popover>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <Label>Document Number</Label>
//                                     <Popover>
//                                         <PopoverTrigger asChild>
//                                             <Button variant="outline" className="w-full justify-between" disabled={!formData.customerId}>
//                                                 {formData.documentNumber || "Select document..."}
//                                                 <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
//                                             </Button>
//                                         </PopoverTrigger>
//                                         <PopoverContent className="w-full p-0">
//                                             <Command>
//                                                 <CommandInput placeholder="Search document..." />
//                                                 <CommandList>
//                                                     <CommandEmpty>No document found.</CommandEmpty>
//                                                     <CommandGroup>
//                                                         {getDocumentOptions().map((doc: any) => (
//                                                             <CommandItem key={doc.id} onSelect={() => handleDocumentSelect(doc)}>
//                                                                 <Check className={cn("mr-2 h-4 w-4", formData.documentId === doc.id ? "opacity-100" : "opacity-0")} />
//                                                                 {doc.number} ({formatCurrency(doc.total)})
//                                                             </CommandItem>
//                                                         ))}
//                                                     </CommandGroup>
//                                                 </CommandList>
//                                             </Command>
//                                         </PopoverContent>
//                                     </Popover>
//                                 </div>
//                             </div>
//                         </div>
//                     </ScrollArea>
//                     <div className="p-4 border-t bg-muted/20 flex justify-end gap-3">
//                         <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
//                         <Button onClick={handleSubmit} className="px-8 bg-indigo-600 hover:bg-indigo-700">Save</Button>
//                     </div>
//                 </DialogContent>
//             </Dialog>

//             <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//                 <AlertDialogContent>
//                     <AlertDialogHeader>
//                         <AlertDialogTitle>Delete e-Way Bill</AlertDialogTitle>
//                         <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel>Cancel</AlertDialogCancel>
//                         <AlertDialogAction onClick={handleDeleteBill} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </div>
//     );
// }
import { useState, useEffect } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { TransporterSelect } from "@/components/transporter-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    Plus,
    X,
    Settings,
    FileText,
    Truck,
    Train,
    Plane,
    Ship,
    ExternalLink,
    Pencil,
    ChevronDown,
    Trash2,
    Check,
    ChevronsUpDown,
    Search
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface EWayBillListItem {
    id: string;
    ewayBillNumber: string;
    documentType: string;
    documentNumber: string;
    customerName: string;
    customerGstin: string;
    customerId: string;
    date: string;
    expiryDate: string;
    total: number;
    status: string;
    transactionType: string;
}

interface EWayBillDetail {
    id: string;
    ewayBillNumber: string;
    documentType: string;
    transactionSubType: string;
    customerName: string;
    customerGstin: string;
    customerId: string;
    documentNumber: string;
    date: string;
    expiryDate: string;
    transactionType: string;
    dispatchFrom: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    billFrom: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    billTo: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    shipTo: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    placeOfDelivery: string;
    transporter: string;
    distance: number;
    modeOfTransportation: string;
    vehicleType: string;
    vehicleNo: string;
    transporterDocNo: string;
    transporterDocDate: string;
    items: any[];
    total: number;
    status: string;
    createdAt: string;
}

interface Customer {
    id: string;
    displayName: string;
    companyName: string;
    gstin?: string;
    billingAddress?: any;
    shippingAddress?: any;
}

interface CreditNote {
    id: string;
    creditNoteNumber: string;
    customerId: string;
    customerName: string;
    total: number;
    date: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    total: number;
    date: string;
}

interface DeliveryChallan {
    id: string;
    challanNumber: string;
    customerId: string;
    customerName: string;
    total: number;
    date: string;
}

interface SalesOrder {
    id: string;
    salesOrderNumber: string;
    customerId: string;
    customerName: string;
    total: number;
    date: string;
}

const formatCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatAddress = (address: any): string[] => {
    if (!address) return ['-'];
    if (typeof address === 'string') return [address];
    if (typeof address !== 'object') return ['-'];
    const parts = [
        address.street ? String(address.street) : '',
        address.city ? String(address.city) : '',
        address.state ? String(address.state) : '',
        address.country ? String(address.country) : '',
        address.pincode ? String(address.pincode) : ''
    ].filter(Boolean);
    return parts.length > 0 ? parts : ['-'];
};

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'GENERATED':
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
        case 'NOT_GENERATED':
            return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        case 'CANCELLED':
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
        case 'EXPIRED':
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
};

const documentTypes = [
    { value: 'credit_notes', label: 'Credit Notes' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'delivery_challans', label: 'Delivery Challans' },
    { value: 'sales_orders', label: 'Sales Orders' },
];

const transactionSubTypes = [
    { value: 'sales_return', label: 'Sales Return' },
    { value: 'supply', label: 'Supply' },
    { value: 'export', label: 'Export' },
    { value: 'job_work', label: 'Job Work' },
];

const transactionTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'bill_to_ship_to', label: 'Bill To - Ship To' },
    { value: 'bill_from_dispatch_from', label: 'Bill From - Dispatch From' },
    { value: 'combination', label: 'Combination of 2 and 3' },
];

const ewayBillStatuses = [
    { value: 'all', label: 'All' },
    { value: 'NOT_GENERATED', label: 'Not Generated (0)' },
    { value: 'GENERATED', label: 'Generated' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'EXPIRED', label: 'Expired' },
];

// Indian States with codes for e-Way Bill
const INDIAN_STATES_WITH_CODES = [
    { code: "AP", name: "Andhra Pradesh" },
    { code: "AR", name: "Arunachal Pradesh" },
    { code: "AS", name: "Assam" },
    { code: "BR", name: "Bihar" },
    { code: "CG", name: "Chhattisgarh" },
    { code: "GA", name: "Goa" },
    { code: "GJ", name: "Gujarat" },
    { code: "HR", name: "Haryana" },
    { code: "HP", name: "Himachal Pradesh" },
    { code: "JH", name: "Jharkhand" },
    { code: "KA", name: "Karnataka" },
    { code: "KL", name: "Kerala" },
    { code: "MP", name: "Madhya Pradesh" },
    { code: "MH", name: "Maharashtra" },
    { code: "MN", name: "Manipur" },
    { code: "ML", name: "Meghalaya" },
    { code: "MZ", name: "Mizoram" },
    { code: "NL", name: "Nagaland" },
    { code: "OD", name: "Odisha" },
    { code: "PB", name: "Punjab" },
    { code: "RJ", name: "Rajasthan" },
    { code: "SK", name: "Sikkim" },
    { code: "TN", name: "Tamil Nadu" },
    { code: "TS", name: "Telangana" },
    { code: "TR", name: "Tripura" },
    { code: "UP", name: "Uttar Pradesh" },
    { code: "UK", name: "Uttarakhand" },
    { code: "WB", name: "West Bengal" },
    { code: "AN", name: "Andaman and Nicobar Islands" },
    { code: "CH", name: "Chandigarh" },
    { code: "DN", name: "Dadra and Nagar Haveli" },
    { code: "DD", name: "Daman and Diu" },
    { code: "DL", name: "Delhi" },
    { code: "JK", name: "Jammu and Kashmir" },
    { code: "LA", name: "Ladakh" },
    { code: "LD", name: "Lakshadweep" },
    { code: "PY", name: "Puducherry" },
];

const transactionPeriods = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
];

const transactionTypeFilters = [
    { value: 'invoices', label: 'Invoices' },
    { value: 'credit_notes', label: 'Credit Notes' },
    { value: 'delivery_challans', label: 'Delivery Challans' },
    { value: 'all', label: 'All Types' },
];

interface EWayBillDetailPanelProps {
    bill: EWayBillDetail;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function EWayBillDetailPanel({ bill, onClose, onEdit, onDelete }: EWayBillDetailPanelProps) {
    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <h2 className="text-lg font-semibold" data-testid="text-view-title">
                        {bill.ewayBillNumber}
                    </h2>
                    <Badge className={getStatusColor(bill.status)}>
                        {bill.status}
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-view">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto flex-wrap">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={onEdit} data-testid="button-edit-eway-bill">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive"
                    onClick={onDelete}
                    data-testid="button-delete-eway-bill"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                        <h3 className="font-semibold text-lg">E-Way Bill Information</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">E-Way Bill Number:</span>
                                <p className="font-medium">{bill.ewayBillNumber}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Document Type:</span>
                                <p className="font-medium capitalize">{bill.documentType.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Transaction Sub Type:</span>
                                <p className="font-medium capitalize">{bill.transactionSubType.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{formatDate(bill.date)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Expiry Date:</span>
                                <p className="font-medium">{formatDate(bill.expiryDate)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Transaction Type:</span>
                                <p className="font-medium capitalize">{bill.transactionType.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Customer Information</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Customer Name:</span>
                                <p className="font-medium">{bill.customerName}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Customer GSTIN:</span>
                                <p className="font-medium">{bill.customerGstin || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Document Number:</span>
                                <p className="font-medium">{bill.documentNumber || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Address Details</h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">DISPATCH FROM</h4>
                                <div className="text-sm space-y-0.5">
                                    {formatAddress(bill.dispatchFrom).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">BILL FROM</h4>
                                <div className="text-sm space-y-0.5">
                                    {formatAddress(bill.billFrom).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">BILL TO</h4>
                                <div className="text-sm space-y-0.5">
                                    {formatAddress(bill.billTo).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">SHIP TO</h4>
                                <div className="text-sm space-y-0.5">
                                    {formatAddress(bill.shipTo).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Transportation Details</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Place of Delivery:</span>
                                <p className="font-medium">{bill.placeOfDelivery || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Transporter:</span>
                                <p className="font-medium capitalize">{bill.transporter?.replace('_', ' ') || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Distance:</span>
                                <p className="font-medium">{bill.distance || 0} km</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Mode of Transportation:</span>
                                <p className="font-medium capitalize">{bill.modeOfTransportation?.replace('_', ' ') || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Vehicle Type:</span>
                                <p className="font-medium capitalize">{bill.vehicleType?.replace('_', ' ') || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Vehicle Number:</span>
                                <p className="font-medium">{bill.vehicleNo || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Transporter Doc No:</span>
                                <p className="font-medium">{bill.transporterDocNo || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Transporter Doc Date:</span>
                                <p className="font-medium">{bill.transporterDocDate ? formatDate(bill.transporterDocDate) : '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Total Amount</h3>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(bill.total)}</p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

export default function EWayBills() {
    const { toast } = useToast();
    const [ewayBills, setEwayBills] = useState<EWayBillListItem[]>([]);
    const [selectedBill, setSelectedBill] = useState<EWayBillDetail | null>(null);
    const [selectedBills, setSelectedBills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [viewMode, setViewMode] = useState(false);

    const [periodFilter, setPeriodFilter] = useState('this_month');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

    const [formData, setFormData] = useState({
        documentType: 'credit_notes',
        transactionSubType: 'sales_return',
        customerId: '',
        customerName: '',
        documentNumber: '',
        documentId: '',
        date: new Date().toISOString().split('T')[0],
        transactionType: 'regular',
        placeOfDelivery: '',
        transporter: '',
        distance: 0,
        modeOfTransportation: 'road',
        vehicleType: 'regular',
        vehicleNo: '',
        transporterDocNo: '',
        transporterDocDate: '',
        total: 0,
    });

    const [addressData, setAddressData] = useState({
        dispatchFrom: {
            street: 'Hinjewadi - Wakad road',
            city: 'Hinjewadi',
            state: 'Pune',
            country: 'Maharashtra',
            pincode: 'India - 411057',
        },
        billFrom: {
            street: 'Hinjewadi - Wakad road',
            city: 'Hinjewadi',
            state: 'Pune',
            country: 'Maharashtra',
            pincode: 'India - 411057',
        },
        billTo: {
            street: 'Plot No.G- 2 Katfal',
            city: 'Baramati, Maharashtra',
            state: 'Industrial Development',
            country: 'Corporation Area, Baramati',
            pincode: 'India - 413133',
        },
        shipTo: {
            street: 'Plot No.G- 2 Katfal',
            city: 'Baramati, Maharashtra',
            state: 'Industrial Development',
            country: 'Corporation Area, Baramati',
            pincode: 'India - 413133',
        },
    });

    const [fromInvoiceId, setFromInvoiceId] = useState<string | null>(null);
    const [fromInvoiceNumber, setFromInvoiceNumber] = useState<string | null>(null);
    const [placeOfDeliveryOpen, setPlaceOfDeliveryOpen] = useState(false);
    const [itemDetailsOpen, setItemDetailsOpen] = useState(true);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    useEffect(() => {
        fetchEWayBills();
        fetchCustomers();
        fetchCreditNotes();
        fetchInvoices();
        fetchDeliveryChallans();
        fetchSalesOrders();

        // Check for fromInvoice or challanId parameters
        const params = new URLSearchParams(window.location.search);
        const invoiceId = params.get('fromInvoice');
        const challanId = params.get('challanId');

        if (invoiceId) {
            setFromInvoiceId(invoiceId);
            fetchInvoiceForEWayBill(invoiceId);
        } else if (challanId) {
            fetchChallanForEWayBill(challanId);
        }
    }, [periodFilter, transactionTypeFilter, statusFilter]);

    const fetchChallanForEWayBill = async (challanId: string) => {
        try {
            const response = await fetch(`/api/delivery-challans/${challanId}`);
            if (response.ok) {
                const data = await response.json();
                const challan = data.data;

                setShowCreateForm(true);

                // Pre-populate form with challan data
                setFormData({
                    documentType: 'delivery_challans',
                    transactionSubType: 'supply',
                    customerId: challan.customerId || '',
                    customerName: challan.customerName || '',
                    documentNumber: challan.challanNumber || '',
                    documentId: challan.id || '',
                    date: new Date().toISOString().split('T')[0],
                    transactionType: 'regular',
                    placeOfDelivery: challan.placeOfSupply || '',
                    transporter: '',
                    distance: 0,
                    modeOfTransportation: 'road',
                    vehicleType: 'regular',
                    vehicleNo: '',
                    transporterDocNo: '',
                    transporterDocDate: '',
                    total: Number(challan.total) || 0,
                });

                // Set items from challan
                if (challan.items && Array.isArray(challan.items)) {
                    setSelectedItems(challan.items.map((item: any) => ({
                        id: item.id || Math.random().toString(36).substr(2, 9),
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit,
                        rate: item.rate,
                        amount: item.amount,
                        tax: item.tax || 0,
                        gstRate: item.gstRate || 0,
                        hsnCode: item.hsnCode || '',
                    })));
                }

                // Set address from customer if available
                if (challan.customerId) {
                    const custResp = await fetch(`/api/customers/${challan.customerId}`);
                    if (custResp.ok) {
                        const custData = await custResp.json();
                        const customer = custData.data;

                        setAddressData({
                            ...addressData,
                            billTo: customer.billingAddress || addressData.billTo,
                            shipTo: customer.shippingAddress || addressData.shipTo,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching challan for e-way bill:", error);
        }
    };

    const fetchInvoiceForEWayBill = async (invoiceId: string) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`);
            if (response.ok) {
                const data = await response.json();
                const invoice = data.data;

                setFromInvoiceNumber(invoice.invoiceNumber);
                setShowCreateForm(true);

                // Pre-populate form with invoice data
                setFormData({
                    ...formData,
                    documentType: 'invoices',
                    transactionSubType: 'supply',
                    customerId: invoice.customerId || '',
                    customerName: invoice.customerName || '',
                    documentNumber: invoice.invoiceNumber || '',
                    documentId: invoice.id || '',
                    date: new Date().toISOString().split('T')[0],
                    transactionType: 'regular',
                    total: invoice.total || 0,
                });

                // Update address data from invoice
                if (invoice.billingAddress) {
                    setAddressData(prev => ({
                        ...prev,
                        billTo: {
                            street: invoice.billingAddress.street || '',
                            city: invoice.billingAddress.city || '',
                            state: invoice.billingAddress.state || '',
                            country: invoice.billingAddress.country || 'India',
                            pincode: invoice.billingAddress.pincode || '',
                        }
                    }));
                }
                if (invoice.shippingAddress) {
                    setAddressData(prev => ({
                        ...prev,
                        shipTo: {
                            street: invoice.shippingAddress.street || '',
                            city: invoice.shippingAddress.city || '',
                            state: invoice.shippingAddress.state || '',
                            country: invoice.shippingAddress.country || 'India',
                            pincode: invoice.shippingAddress.pincode || '',
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch invoice for e-Way Bill:', error);
        }
    };

    const fetchEWayBills = async () => {
        try {
            const params = new URLSearchParams();
            if (periodFilter !== 'all') params.append('period', periodFilter);
            if (transactionTypeFilter !== 'all') params.append('transactionType', transactionTypeFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/eway-bills?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setEwayBills(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch e-way bills:', error);
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

    const fetchCreditNotes = async () => {
        try {
            const response = await fetch('/api/credit-notes');
            if (response.ok) {
                const data = await response.json();
                setCreditNotes(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch credit notes:', error);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices');
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        }
    };

    const fetchDeliveryChallans = async () => {
        try {
            const response = await fetch('/api/delivery-challans');
            if (response.ok) {
                const data = await response.json();
                setDeliveryChallans(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch delivery challans:', error);
        }
    };

    const fetchSalesOrders = async () => {
        try {
            const response = await fetch('/api/sales-orders');
            if (response.ok) {
                const data = await response.json();
                setSalesOrders(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch sales orders:', error);
        }
    };

    const fetchItemsFromDocument = async (docType: string, docId: string) => {
        try {
            let url = '';
            if (docType === 'invoices') url = `/api/invoices/${docId}`;
            else if (docType === 'credit_notes') url = `/api/credit-notes/${docId}`;
            else if (docType === 'sales_orders') url = `/api/sales-orders/${docId}`;
            else if (docType === 'delivery_challans') url = `/api/delivery-challans/${docId}`;

            if (url) {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const doc = data.data;
                    if (doc && doc.items) {
                        setSelectedItems(doc.items);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch items from document:', error);
        }
    };

    const fetchBillDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/eway-bills/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedBill(data.data);


                if (data.data) {
                    setFormData({
                        documentType: data.data.documentType || 'credit_notes',
                        transactionSubType: data.data.transactionSubType || 'sales_return',
                        customerId: data.data.customerId || '',
                        customerName: data.data.customerName || '',
                        documentNumber: data.data.documentNumber || '',
                        documentId: data.data.documentId || '',
                        date: data.data.date || new Date().toISOString().split('T')[0],
                        transactionType: data.data.transactionType || 'regular',
                        placeOfDelivery: data.data.placeOfDelivery || '',
                        transporter: data.data.transporter || '',
                        distance: data.data.distance || 0,
                        modeOfTransportation: data.data.modeOfTransportation || 'road',
                        vehicleType: data.data.vehicleType || 'regular',
                        vehicleNo: data.data.vehicleNo || '',
                        transporterDocNo: data.data.transporterDocNo || '',
                        transporterDocDate: data.data.transporterDocDate || '',
                        total: data.data.total || 0,
                    });

                    if (data.data.dispatchFrom || data.data.billFrom || data.data.billTo || data.data.shipTo) {
                        setAddressData({
                            dispatchFrom: data.data.dispatchFrom || addressData.dispatchFrom,
                            billFrom: data.data.billFrom || addressData.billFrom,
                            billTo: data.data.billTo || addressData.billTo,
                            shipTo: data.data.shipTo || addressData.shipTo,
                        });
                    }

                    // Fetch items from the document
                    if (data.data.documentId) {
                        fetchItemsFromDocument(data.data.documentType, data.data.documentId);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch bill detail:', error);
        }
    };

    const handleSelectBill = (bill: EWayBillListItem) => {
        fetchBillDetail(bill.id);
        setViewMode(true);
        setShowCreateForm(false);
    };

    const handleCloseDetail = () => {
        setSelectedBill(null);
        setShowCreateForm(false);
        setViewMode(false);
    };

    const handleNewEWayBill = () => {
        setSelectedBill(null);
        setShowCreateForm(true);
        setFormData({
            documentType: 'credit_notes',
            transactionSubType: 'sales_return',
            customerId: '',
            customerName: '',
            documentNumber: '',
            documentId: '',
            date: new Date().toISOString().split('T')[0],
            transactionType: 'regular',
            placeOfDelivery: '',
            transporter: '',
            distance: 0,
            modeOfTransportation: 'road',
            vehicleType: 'regular',
            vehicleNo: '',
            transporterDocNo: '',
            transporterDocDate: '',
            total: 0,
        });
    };

    const handleDeleteBill = async () => {
        if (!billToDelete) return;

        try {
            const response = await fetch(`/api/eway-bills/${billToDelete}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({
                    title: "E-Way Bill Deleted",
                    description: "The e-way bill has been deleted successfully.",
                });
                fetchEWayBills();
                if (selectedBill?.id === billToDelete) {
                    setSelectedBill(null);
                    setShowCreateForm(false);
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete e-way bill. Please try again.",
                variant: "destructive"
            });
        } finally {
            setDeleteDialogOpen(false);
            setBillToDelete(null);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                ...addressData,
                status: 'NOT_GENERATED',
            };

            const url = selectedBill ? `/api/eway-bills/${selectedBill.id}` : '/api/eway-bills';
            const method = selectedBill ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: "E-Way Bill Saved",
                    description: "The e-way bill has been saved as draft.",
                });
                fetchEWayBills();
                setShowCreateForm(false);
                setSelectedBill(null);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save e-way bill.",
                variant: "destructive"
            });
        }
    };

    const handleSaveAndGenerate = async () => {
        try {
            const payload = {
                ...formData,
                ...addressData,
                status: 'NOT_GENERATED',
            };

            const url = selectedBill ? `/api/eway-bills/${selectedBill.id}` : '/api/eway-bills';
            const method = selectedBill ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();

                const generateResponse = await fetch(`/api/eway-bills/${data.data.id}/generate`, {
                    method: 'PATCH',
                });

                if (generateResponse.ok) {
                    toast({
                        title: "E-Way Bill Generated",
                        description: "The e-way bill has been generated successfully.",
                    });
                }

                fetchEWayBills();
                setShowCreateForm(false);
                setSelectedBill(null);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate e-way bill.",
                variant: "destructive"
            });
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setSelectedBill(null);
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData({
                ...formData,
                customerId: customer.id,
                customerName: customer.displayName || customer.companyName,
            });

            if (customer.billingAddress || customer.shippingAddress) {
                setAddressData({
                    ...addressData,
                    billTo: customer.billingAddress || addressData.billTo,
                    shipTo: customer.shippingAddress || customer.billingAddress || addressData.shipTo,
                });
            }
        }
    };

    const handleCreditNoteChange = (creditNoteId: string) => {
        const creditNote = creditNotes.find(cn => cn.id === creditNoteId);
        if (creditNote) {
            setFormData({
                ...formData,
                documentNumber: creditNote.creditNoteNumber,
                documentId: creditNote.id,
                customerId: creditNote.customerId,
                customerName: creditNote.customerName,
                total: creditNote.total || 0,
            });
            fetchItemsFromDocument('credit_notes', creditNote.id);
        }
    };

    const handleInvoiceChange = (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            setFormData({
                ...formData,
                documentNumber: invoice.invoiceNumber,
                documentId: invoice.id,
                customerId: invoice.customerId,
                customerName: invoice.customerName,
                total: invoice.total || 0,
            });
            fetchItemsFromDocument('invoices', invoice.id);
        }
    };

    const handleDeliveryChallanChange = (challanId: string) => {
        const challan = deliveryChallans.find(dc => dc.id === challanId);
        if (challan) {
            setFormData({
                ...formData,
                documentNumber: challan.challanNumber,
                documentId: challan.id,
                customerId: challan.customerId,
                customerName: challan.customerName,
                total: challan.total || 0,
            });
            fetchItemsFromDocument('delivery_challans', challan.id);
        }
    };

    const handleSalesOrderChange = (salesOrderId: string) => {
        const salesOrder = salesOrders.find(so => so.id === salesOrderId);
        if (salesOrder) {
            setFormData({
                ...formData,
                documentNumber: salesOrder.salesOrderNumber,
                documentId: salesOrder.id,
                customerId: salesOrder.customerId,
                customerName: salesOrder.customerName,
                total: salesOrder.total || 0,
            });
            fetchItemsFromDocument('sales_orders', salesOrder.id);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBills(ewayBills.map(b => b.id));
        } else {
            setSelectedBills([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedBills([...selectedBills, id]);
        } else {
            setSelectedBills(selectedBills.filter(i => i !== id));
        }
    };

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(ewayBills, 10);

    return (
        <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50" data-testid="eway-bills-page">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="eway-bills-layout">
                {!showCreateForm && (
                    <ResizablePanel
                        defaultSize={viewMode ? 30 : 100}
                        minSize={20}
                        className="flex flex-col overflow-hidden bg-white"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b space-y-4 bg-white sticky top-0 z-10">
                                <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-4 w-full">
                                    <h1 className="text-lg sm:text-xl font-semibold shrink-0" data-testid="text-page-title">e-Way Bills</h1>
                                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
                                        <Button variant="outline" size="sm" className="text-blue-600 whitespace-nowrap h-7 sm:h-8 text-[11px] sm:text-sm px-2 sm:px-3 w-[120px] sm:w-[140px] shrink-0 !min-w-[120px] sm:!min-w-[140px]" data-testid="button-portal-settings">
                                            <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0" />
                                            <span className="truncate shrink-0">
                                                <span className="hidden xs:inline">Change Portal Settings</span>
                                                <span className="xs:hidden">Portal Settings</span>
                                            </span>
                                        </Button>
                                        <Button onClick={handleNewEWayBill} size="sm" className="h-7 sm:h-8 shrink-0 text-[11px] sm:text-sm px-2 sm:px-3 w-[60px] sm:w-[80px] !min-w-[60px] sm:!min-w-[80px]" data-testid="button-new-eway-bill">
                                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0" />
                                            <span className="shrink-0">New</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 shrink-0 w-full">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap lg:hidden xl:hidden hidden">Period:</span>
                                        <Select value={periodFilter} onValueChange={setPeriodFilter} data-testid="select-period-filter">
                                            <SelectTrigger className="w-[120px] sm:w-[130px] h-8 text-sm px-2 shrink-0 !min-w-[120px] sm:!min-w-[130px]" data-testid="select-trigger-period">
                                                <SelectValue placeholder="Period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transactionPeriods.map((period) => (
                                                    <SelectItem key={period.value} value={period.value} className="text-sm">
                                                        {period.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap lg:hidden xl:hidden hidden">Type:</span>
                                        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter} data-testid="select-type-filter">
                                            <SelectTrigger className="w-[120px] sm:w-[130px] h-8 text-sm px-2 shrink-0 !min-w-[120px] sm:!min-w-[130px]" data-testid="select-trigger-type">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transactionTypeFilters.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="text-sm">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap lg:hidden xl:hidden hidden">Status:</span>
                                        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                                            <SelectTrigger className="w-[100px] sm:w-[110px] h-8 text-sm px-2 shrink-0 !min-w-[100px] sm:!min-w-[110px]" data-testid="select-trigger-status">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ewayBillStatuses.map((status) => (
                                                    <SelectItem key={status.value} value={status.value} className="text-sm">
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 bg-white">
                                <div className="flex-1 overflow-auto min-h-0">
                                    <table className="w-full" data-testid="table-eway-bills">
                                        <thead className="bg-muted/50 sticky top-0">
                                            <tr className="border-b">
                                                <th className="p-3 text-left w-10">
                                                    <Checkbox
                                                        checked={selectedBills.length === ewayBills.length && ewayBills.length > 0}
                                                        onCheckedChange={handleSelectAll}
                                                        data-testid="checkbox-select-all"
                                                    />
                                                </th>
                                                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Date
                                                    <ChevronDown className="w-3 h-3 inline ml-1" />
                                                </th>
                                                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaction#</th>
                                                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer Name</th>
                                                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer GSTIN</th>
                                                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiry Date</th>
                                                <th className="p-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={7} className="p-8 text-center text-muted-foreground" data-testid="text-loading">
                                                        Loading e-way bills...
                                                    </td>
                                                </tr>
                                            ) : ewayBills.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-8 text-center text-muted-foreground" data-testid="text-empty">
                                                        Yay! You do not have any pending invoices for which e-way bills have to be generated.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedItems.map((bill) => (
                                                    <tr
                                                        key={bill.id}
                                                        className={`border-b cursor-pointer hover-elevate ${selectedBill?.id === bill.id ? 'bg-accent' : ''
                                                            }`}
                                                        onClick={() => {
                                                            handleSelectBill(bill);
                                                            setShowCreateForm(true);
                                                        }}
                                                        data-testid={`row-eway-bill-${bill.id}`}
                                                    >
                                                        <td className="p-3">
                                                            <Checkbox
                                                                checked={selectedBills.includes(bill.id)}
                                                                onCheckedChange={(checked) => handleSelectOne(bill.id, checked as boolean)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                data-testid={`checkbox-select-${bill.id}`}
                                                            />
                                                        </td>
                                                        <td className="p-3 text-sm" data-testid={`text-date-${bill.id}`}>
                                                            {formatDate(bill.date)}
                                                        </td>
                                                        <td className="p-3 text-sm text-blue-600" data-testid={`text-transaction-${bill.id}`}>
                                                            {bill.documentNumber || bill.ewayBillNumber}
                                                        </td>
                                                        <td className="p-3 text-sm" data-testid={`text-customer-${bill.id}`}>
                                                            {bill.customerName}
                                                        </td>
                                                        <td className="p-3 text-sm" data-testid={`text-gstin-${bill.id}`}>
                                                            {bill.customerGstin || '-'}
                                                        </td>
                                                        <td className="p-3 text-sm" data-testid={`text-expiry-${bill.id}`}>
                                                            {formatDate(bill.expiryDate)}
                                                        </td>
                                                        <td className="p-3 text-sm text-right" data-testid={`text-total-${bill.id}`}>
                                                            {formatCurrency(bill.total)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex-none border-t border-slate-200 bg-white">
                                    <TablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={goToPage}
                                    />
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                )}

                {viewMode && selectedBill && !showCreateForm && (
                    <>
                        <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                        <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
                            <div className="h-full flex flex-col overflow-hidden bg-white">
                                <EWayBillDetailPanel
                                    bill={selectedBill}
                                    onClose={handleCloseDetail}
                                    onEdit={() => {
                                        setViewMode(false);
                                        setShowCreateForm(true);
                                    }}
                                    onDelete={() => {
                                        setBillToDelete(selectedBill.id);
                                        setDeleteDialogOpen(true);
                                    }}
                                />
                            </div>
                        </ResizablePanel>
                    </>
                )}

                {showCreateForm && (
                    <>
                        <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                        <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
                            <div className="h-full flex flex-col overflow-hidden bg-white">
                                <div className="flex-1 flex flex-col bg-background h-full overflow-hidden relative">
                                    <div className="p-4 border-b flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold" data-testid="text-form-title">
                                                {selectedBill ? 'Edit E-Way Bill' : 'New e-Way Bill'}
                                            </h2>
                                            {fromInvoiceNumber && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                    From Invoice #{fromInvoiceNumber}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleCloseDetail} data-testid="button-close-form">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <ScrollArea className="flex-1 p-4 sm:p-6">
                                        <div className="max-w-4xl space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-black">Document Type
                                                        <span className="text-red-600">*</span>
                                                    </Label>
                                                    <Select
                                                        value={formData.documentType}
                                                        onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                                                        data-testid="select-document-type"
                                                    >
                                                        <SelectTrigger data-testid="select-trigger-document-type">
                                                            <SelectValue placeholder="Select document type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {documentTypes.map((type) => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-black">Transaction Sub Type
                                                        <span className="text-red-600">*</span>
                                                    </Label>
                                                    <Select
                                                        value={formData.transactionSubType}
                                                        onValueChange={(value) => setFormData({ ...formData, transactionSubType: value })}
                                                        data-testid="select-transaction-sub-type"
                                                    >
                                                        <SelectTrigger data-testid="select-trigger-transaction-sub-type">
                                                            <SelectValue placeholder="Select sub type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {transactionSubTypes.map((type) => (
                                                                <SelectItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-black">Customer Name
                                                    <span className="text-red-600">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.customerId}
                                                    onValueChange={handleCustomerChange}
                                                    data-testid="select-customer-name"
                                                >
                                                    <SelectTrigger data-testid="select-trigger-customer-name">
                                                        <SelectValue placeholder="Select customer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customers.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id}>
                                                                {customer.displayName || customer.companyName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {formData.documentType === 'credit_notes' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Credit Note#
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.documentId}
                                                            onValueChange={handleCreditNoteChange}
                                                            data-testid="select-credit-note"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-credit-note">
                                                                <SelectValue placeholder="Select credit note" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {creditNotes.map((cn) => (
                                                                    <SelectItem key={cn.id} value={cn.id}>
                                                                        {cn.creditNoteNumber}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            data-testid="input-date"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Transaction Type
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.transactionType}
                                                            onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                                                            data-testid="select-transaction-type"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-transaction-type">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {transactionTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.documentType === 'invoices' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Invoice#
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.documentId}
                                                            onValueChange={handleInvoiceChange}
                                                            data-testid="select-invoice"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-invoice">
                                                                <SelectValue placeholder="Select invoice" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {invoices.map((inv) => (
                                                                    <SelectItem key={inv.id} value={inv.id}>
                                                                        {inv.invoiceNumber}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            data-testid="input-date-invoice"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Transaction Type
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.transactionType}
                                                            onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                                                            data-testid="select-transaction-type-invoice"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-transaction-type-invoice">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {transactionTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.documentType === 'delivery_challans' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Delivery Challan#
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.documentId}
                                                            onValueChange={handleDeliveryChallanChange}
                                                            data-testid="select-delivery-challan"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-delivery-challan">
                                                                <SelectValue placeholder="Select delivery challan" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {deliveryChallans.map((dc) => (
                                                                    <SelectItem key={dc.id} value={dc.id}>
                                                                        {dc.challanNumber}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            data-testid="input-date-delivery-challan"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Transaction Type
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.transactionType}
                                                            onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                                                            data-testid="select-transaction-type-delivery-challan"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-transaction-type-delivery-challan">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {transactionTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.documentType === 'sales_orders' && (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Sales Order#
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.documentId}
                                                            onValueChange={handleSalesOrderChange}
                                                            data-testid="select-sales-order"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-sales-order">
                                                                <SelectValue placeholder="Select sales order" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {salesOrders.map((so) => (
                                                                    <SelectItem key={so.id} value={so.id}>
                                                                        {so.salesOrderNumber}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            data-testid="input-date-sales-order"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-black">Transaction Type
                                                            <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.transactionType}
                                                            onValueChange={(value) => setFormData({ ...formData, transactionType: value })}
                                                            data-testid="select-transaction-type-sales-order"
                                                        >
                                                            <SelectTrigger data-testid="select-trigger-transaction-type-sales-order">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {transactionTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <h3 className="font-medium text-sm text-muted-foreground">Address Details</h3>
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            DISPATCH FROM <Pencil className="w-3 h-3 cursor-pointer text-blue-500" />
                                                        </Label>
                                                        <div className="text-sm space-y-0.5">
                                                            {formatAddress(addressData.dispatchFrom).map((line, i) => (
                                                                <p key={i}>{line}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-muted-foreground">BILL FROM</Label>
                                                        <div className="text-sm space-y-0.5">
                                                            {formatAddress(addressData.billFrom).map((line, i) => (
                                                                <p key={i}>{line}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-muted-foreground">BILL TO</Label>
                                                        <div className="text-sm space-y-0.5">
                                                            {formatAddress(addressData.billTo).map((line, i) => (
                                                                <p key={i}>{line}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-muted-foreground">SHIP TO</Label>
                                                        <div className="text-sm space-y-0.5">
                                                            {formatAddress(addressData.shipTo).map((line, i) => (
                                                                <p key={i}>{line}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-black">Place of Delivery
                                                    <span className="text-red-600">*</span>
                                                </Label>
                                                <Popover open={placeOfDeliveryOpen} onOpenChange={setPlaceOfDeliveryOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={placeOfDeliveryOpen}
                                                            className="w-full justify-between font-normal"
                                                            data-testid="select-trigger-place-of-delivery"
                                                        >
                                                            {formData.placeOfDelivery || "Select state"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search state..." />
                                                            <CommandList>
                                                                <CommandEmpty>No state found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {INDIAN_STATES_WITH_CODES.map((state) => (
                                                                        <CommandItem
                                                                            key={state.code}
                                                                            value={`${state.code} ${state.name}`}
                                                                            onSelect={() => {
                                                                                setFormData({ ...formData, placeOfDelivery: `[${state.code}] - ${state.name}` });
                                                                                setPlaceOfDeliveryOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formData.placeOfDelivery === `[${state.code}] - ${state.name}` ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            [{state.code}] - {state.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Item Details Section */}
                                            {selectedItems.length > 0 && (
                                                <div className="border rounded-lg p-4 space-y-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setItemDetailsOpen(!itemDetailsOpen)}
                                                        className="flex items-center gap-2 text-blue-600 hover:underline"
                                                        data-testid="button-toggle-item-details"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Item Details</span>
                                                        <ChevronDown
                                                            className={`w-4 h-4 transition-transform ${itemDetailsOpen ? "rotate-180" : ""
                                                                }`}
                                                        />
                                                    </button>

                                                    {itemDetailsOpen && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b">
                                                                        <th className="text-left py-2 px-3 font-semibold">#</th>
                                                                        <th className="text-left py-2 px-3 font-semibold">Item & Description</th>
                                                                        <th className="text-left py-2 px-3 font-semibold">HSN Code</th>
                                                                        <th className="text-left py-2 px-3 font-semibold">Quantity</th>
                                                                        <th className="text-right py-2 px-3 font-semibold">Taxable Amount</th>
                                                                        <th className="text-right py-2 px-3 font-semibold">CGST</th>
                                                                        <th className="text-right py-2 px-3 font-semibold">SGST</th>
                                                                        <th className="text-right py-2 px-3 font-semibold">Cess</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {selectedItems.map((item, index) => {
                                                                        const taxableAmount = (item.amount || item.total) || 0;
                                                                        const cgst = item.cgst || 0;
                                                                        const sgst = item.sgst || 0;
                                                                        const cess = item.cess || 0;

                                                                        return (
                                                                            <tr key={index} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                                                                                <td className="py-3 px-3">{index + 1}</td>
                                                                                <td className="py-3 px-3">
                                                                                    <div>
                                                                                        <p className="font-medium">{item.itemName || item.name || '-'}</p>
                                                                                        {item.description && (
                                                                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 px-3 text-muted-foreground">{item.hsnSac || item.hsn || '-'}</td>
                                                                                <td className="py-3 px-3">
                                                                                    {item.quantity} {item.unit || item.usageUnit || ''}
                                                                                </td>
                                                                                <td className="py-3 px-3 text-right font-medium">
                                                                                    {formatCurrency(taxableAmount)}
                                                                                </td>
                                                                                <td className="py-3 px-3 text-right text-muted-foreground">
                                                                                    {cgst ? `₹${cgst.toFixed(2)}` : '₹0.00'} {item.cgstPercent ? `(${item.cgstPercent}%)` : ''}
                                                                                </td>
                                                                                <td className="py-3 px-3 text-right text-muted-foreground">
                                                                                    {sgst ? `₹${sgst.toFixed(2)}` : '₹0.00'} {item.sgstPercent ? `(${item.sgstPercent}%)` : ''}
                                                                                </td>
                                                                                <td className="py-3 px-3 text-right text-muted-foreground">
                                                                                    {cess ? `₹${cess.toFixed(2)}` : '₹0.00'}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>

                                                            {/* Summary Row */}
                                                            <div className="mt-4 space-y-2 text-sm">
                                                                <div className="flex justify-end items-center gap-8">
                                                                    <span className="font-medium">Taxable Amount</span>
                                                                    <span className="font-semibold min-w-[120px] text-right">
                                                                        {formatCurrency(
                                                                            selectedItems.reduce((sum, item) => sum + ((item.amount || item.total || 0) * (100 - (item.discount || 0)) / 100), 0)
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-end items-center gap-8 text-base font-bold border-t pt-2">
                                                                    <span>TOTAL</span>
                                                                    <span className="min-w-[120px] text-right text-blue-600">
                                                                        {formatCurrency(selectedItems.reduce((sum, item) => sum + (item.amount || item.total || 0), 0))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Total Amount Display */}
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border p-4">
                                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Total Amount</h3>
                                                <p className="text-2xl font-bold text-blue-600" data-testid="text-form-total">
                                                    {formatCurrency(selectedItems.reduce((sum, item) => sum + (item.amount || item.total || 0), 0) || formData.total)}
                                                </p>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t">
                                                <h3 className="font-semibold text-sm">TRANSPORTATION DETAILS</h3>

                                                <TransporterSelect
                                                    value={formData.transporter}
                                                    onValueChange={(value) => setFormData({ ...formData, transporter: value })}
                                                    placeholder="Select the transporter's name"
                                                    data_testid="select-transporter"
                                                />

                                                <div className="space-y-2">
                                                    <Label className="text-black">Distance (In Km)
                                                        <span className="text-red-600">*</span>
                                                    </Label>
                                                    <div className="flex items-center gap-4">
                                                        <Input
                                                            type="number"
                                                            value={formData.distance}
                                                            onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) || 0 })}
                                                            placeholder="0"
                                                            className="max-w-[200px]"
                                                            data-testid="input-distance"
                                                        />
                                                        <a href="#" className="text-blue-600 text-sm hover:underline flex items-center gap-1" data-testid="link-calculate-distance">
                                                            Calculate Distance
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        If you enter 0 as the distance, e-Way Bill system will automatically calculate it based on the dispatch and delivery locations.
                                                    </p>
                                                </div>

                                                <div className="space-y-4 pt-4">
                                                    <h4 className="font-medium text-sm">PART B</h4>

                                                    <div className="space-y-2">
                                                        <Label>Mode of Transportation</Label>
                                                        <Tabs value={formData.modeOfTransportation} onValueChange={(value) => setFormData({ ...formData, modeOfTransportation: value })}>
                                                            <TabsList className="grid grid-cols-4 w-fit" data-testid="tabs-transport-mode">
                                                                <TabsTrigger value="road" className="flex items-center gap-1" data-testid="tab-road">
                                                                    <Truck className="w-4 h-4" /> Road
                                                                </TabsTrigger>
                                                                <TabsTrigger value="rail" className="flex items-center gap-1" data-testid="tab-rail">
                                                                    <Train className="w-4 h-4" /> Rail
                                                                </TabsTrigger>
                                                                <TabsTrigger value="air" className="flex items-center gap-1" data-testid="tab-air">
                                                                    <Plane className="w-4 h-4" /> Air
                                                                </TabsTrigger>
                                                                <TabsTrigger value="ship" className="flex items-center gap-1" data-testid="tab-ship">
                                                                    <Ship className="w-4 h-4" /> Ship
                                                                </TabsTrigger>
                                                            </TabsList>
                                                        </Tabs>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Vehicle Type</Label>
                                                        <RadioGroup
                                                            value={formData.vehicleType}
                                                            onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                                                            className="flex items-center gap-6"
                                                            data-testid="radio-vehicle-type"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="regular" id="regular" data-testid="radio-regular" />
                                                                <Label htmlFor="regular" className="font-normal">Regular</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="over_dimensional" id="over_dimensional" data-testid="radio-over-dimensional" />
                                                                <Label htmlFor="over_dimensional" className="font-normal">Over Dimensional Cargo</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Vehicle No</Label>
                                                        <Input
                                                            value={formData.vehicleNo}
                                                            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                                            placeholder="Enter vehicle number"
                                                            data-testid="input-vehicle-no"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Transporter's Doc No</Label>
                                                        <Input
                                                            value={formData.transporterDocNo}
                                                            onChange={(e) => setFormData({ ...formData, transporterDocNo: e.target.value })}
                                                            placeholder="Enter document number"
                                                            data-testid="input-transporter-doc-no"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Transporter's Doc Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.transporterDocDate}
                                                            onChange={(e) => setFormData({ ...formData, transporterDocDate: e.target.value })}
                                                            placeholder="dd/MM/yyyy"
                                                            data-testid="input-transporter-doc-date"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>

                                    <div className="p-4 border-t flex items-center gap-2">
                                        <Button onClick={handleSave} data-testid="button-save">
                                            Save
                                        </Button>
                                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAndGenerate} data-testid="button-save-generate">
                                            Save and Generate
                                        </Button>
                                        <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete E-Way Bill</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this e-way bill? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBill} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}