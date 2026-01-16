import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    Plus,
    Search,
} from "lucide-react";
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
import EWayBillDetailPanel from "@/modules/e-way-bills/components/EWayBillDetailPanel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

interface EWayBillDetail extends EWayBillListItem {
    transactionSubType: string;
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

const ewayBillStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'generated', label: 'Generated' },
    { value: 'not_generated', label: 'Not Generated' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' },
];

const formatCurrency = (amount: any) => {
    if (!amount || isNaN(Number(amount))) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

export default function EWayBills() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [ewayBills, setEwayBills] = useState<EWayBillListItem[]>([]);
    const [selectedBill, setSelectedBill] = useState<EWayBillDetail | null>(null);
    const [selectedBills, setSelectedBills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);

    const [periodFilter, setPeriodFilter] = useState('this_month');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchEWayBills();
    }, [periodFilter, transactionTypeFilter, statusFilter]);

    const fetchEWayBills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (periodFilter !== 'all') params.append('period', periodFilter);
            if (transactionTypeFilter !== 'all') params.append('documentType', transactionTypeFilter);
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

    const fetchEWayBillDetail = async (id: string) => {
        try {
            const response = await fetch(`/api/eway-bills/${id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedBill(data.data);
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
        }
    };

    const handleDeleteBill = async () => {
        if (!billToDelete) return;
        try {
            const response = await fetch(`/api/eway-bills/${billToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                toast({ title: "Success", description: "e-Way Bill deleted successfully" });
                setDeleteDialogOpen(false);
                setSelectedBill(null);
                fetchEWayBills();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete e-Way Bill", variant: "destructive" });
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

    const filteredEwayBills = ewayBills.filter(bill =>
        bill.ewayBillNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredEwayBills, 10);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={selectedBill ? 30 : 100} minSize={20} className="bg-white border-r">
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-none p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold px-2">E-Way Bills</h2>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation('/e-way-bills/create')}>
                                <Plus className="h-4 w-4" /> New
                            </Button>
                        </div>

                        <div className="flex-none p-4 border-b space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search E-Way Bills..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
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

                        <div className="flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 sticky top-0 z-10">
                                            <tr className="border-b">
                                                <th className="p-3 w-10"><Checkbox
                                                    checked={selectedBills.length === ewayBills.length && ewayBills.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                    data-testid="checkbox-select-all"
                                                /></th>
                                                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">E-Way Bill Details</th>
                                                {!selectedBill && (
                                                    <>
                                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                                        <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="p-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={selectedBill ? 2 : 5} className="p-8 text-center text-muted-foreground">
                                                        Loading e-way bills...
                                                    </td>
                                                </tr>
                                            ) : filteredEwayBills.length === 0 ? (
                                                <tr>
                                                    <td colSpan={selectedBill ? 2 : 5} className="p-8 text-center text-muted-foreground">
                                                        No e-Way Bills found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedItems.map((bill) => (
                                                    <tr
                                                        key={bill.id}
                                                        className={cn(
                                                            "border-b hover:bg-slate-50 cursor-pointer transition-colors",
                                                            selectedBill?.id === bill.id && "bg-blue-50"
                                                        )}
                                                        onClick={() => fetchEWayBillDetail(bill.id)}
                                                    >
                                                        <td className="p-3" onClick={(e) => e.stopPropagation()}><Checkbox
                                                            checked={selectedBills.includes(bill.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(bill.id, checked as boolean)}
                                                            data-testid={`checkbox-select-${bill.id}`}
                                                        /></td>
                                                        <td className="p-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900">{bill.ewayBillNumber || 'Draft'}</span>
                                                                <span className="text-xs text-slate-500">{bill.documentNumber} • {formatDate(bill.date)}</span>
                                                            </div>
                                                        </td>
                                                        {!selectedBill && (
                                                            <>
                                                                <td className="p-3 text-sm text-slate-600">{bill.customerName}</td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", getStatusColor(bill.status))}>
                                                                        {bill.status.replace('_', ' ')}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3 text-right text-sm font-semibold">{formatCurrency(bill.total)}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex-none border-t bg-white">
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
                    </div>
                </ResizablePanel>

                {selectedBill && (
                    <>
                        <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 transition-all" />
                        <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
                            <EWayBillDetailPanel
                                bill={selectedBill}
                                onClose={() => setSelectedBill(null)}
                                onEdit={() => setLocation(`/e-way-bills/${selectedBill.id}/edit`)}
                                onDelete={() => {
                                    setBillToDelete(selectedBill.id);
                                    setDeleteDialogOpen(true);
                                }}
                            />
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