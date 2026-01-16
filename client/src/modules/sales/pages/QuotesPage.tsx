import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, MoreHorizontal, ChevronDown, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import QuoteDetailPanel from "../components/QuoteDetailPanel";

interface QuoteListItem {
  id: string;
  date: string;
  quoteNumber: string;
  referenceNumber: string;
  customerName: string;
  status: string;
  convertedTo?: string;
  total: number;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  referenceNumber: string;
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  salesperson: string;
  projectName: string;
  subject: string;
  placeOfSupply: string;
  pdfTemplate: string;
  items: any[];
  subTotal: number;
  shippingCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  adjustment: number;
  total: number;
  customerNotes: string;
  termsAndConditions: string;
  status: string;
  emailRecipients: string[];
  createdAt: string;
  activityLogs: any[];
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return 'text-green-600';
    case 'SENT':
      return 'text-blue-600';
    case 'DRAFT':
      return 'text-slate-500';
    case 'DECLINED':
      return 'text-red-600';
    case 'CONVERTED':
      return 'text-purple-600';
    default:
      return 'text-slate-500';
  }
};

const getStatusDisplayText = (status: string, convertedTo?: string) => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === 'CONVERTED') {
    if (convertedTo === 'invoice') {
      return 'Converted To Invoice';
    } else if (convertedTo === 'sales-order') {
      return 'Converted To Sales Order';
    }
    return 'Converted';
  }
  if (upperStatus === 'SENT') {
    return 'Quotation Send';
  }
  if (upperStatus === 'DRAFT') {
    return 'Draft';
  }
  if (upperStatus === 'ACCEPTED') {
    return 'Accepted';
  }
  if (upperStatus === 'DECLINED') {
    return 'Declined';
  }
  if (upperStatus === 'EXPIRED') {
    return 'Expired';
  }
  return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function QuotesPage() {
  const [, setLocation] = useLocation();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedQuote(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quote detail:', error);
    }
  };

  const handleQuoteClick = (quote: QuoteListItem) => {
    fetchQuoteDetail(quote.id);
  };

  const handleClosePanel = () => {
    setSelectedQuote(null);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      setLocation(`/quotes/${selectedQuote.id}/edit`);
    }
  };

  const toggleSelectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedQuotes.includes(id)) {
      setSelectedQuotes(selectedQuotes.filter(i => i !== id));
    } else {
      setSelectedQuotes([...selectedQuotes, id]);
    }
  };

  const applyFilter = (quoteList: QuoteListItem[]) => {
    if (activeFilter === "All") return quoteList;
    return quoteList.filter(quote => {
      const status = quote.status.toUpperCase();
      switch (activeFilter) {
        case "Draft":
          return status === "DRAFT";
        case "Pending Approval":
          return status === "PENDING_APPROVAL" || status === "PENDING APPROVAL";
        case "Approved":
          return status === "APPROVED";
        case "Sent":
          return status === "SENT";
        case "Customer Viewed":
          return status === "CUSTOMER_VIEWED" || status === "CUSTOMER VIEWED";
        case "Accepted":
          return status === "ACCEPTED";
        case "Invoiced":
          return status === "INVOICED" || status === "CONVERTED";
        case "Declined":
          return status === "DECLINED";
        default:
          return true;
      }
    });
  };

  const filteredQuotes = applyFilter(quotes).filter(quote =>
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredQuotes, 10);

  return (
    <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="quotes-layout">
        <ResizablePanel
          defaultSize={selectedQuote ? 30 : 100}
          minSize={25}
          className={`flex flex-col bg-white ${selectedQuote ? 'border-r border-slate-200' : ''}`}
        >
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-xl font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                      {activeFilter === "All" ? "All Quotes" : `${activeFilter} Quotes`}
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setActiveFilter("All")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Draft")}>
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Pending Approval")}>
                      Pending Approval
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Approved")}>
                      Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Sent")}>
                      Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Customer Viewed")}>
                      Customer Viewed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Accepted")}>
                      Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Invoiced")}>
                      Invoiced
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter("Declined")}>
                      Declined
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setLocation("/quotes/create")}
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9"
                >
                  <Plus className="h-4 w-4" /> New
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!selectedQuote && (
              <div className="px-4 pb-3 flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto border-t border-slate-200 relative">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading quotes...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No quotes found.</p>
                  <Button
                    onClick={() => setLocation("/quotes/create")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create your first quote
                  </Button>
                </div>
              ) : selectedQuote ? (
                <div className="divide-y divide-slate-100">
                  {paginatedItems.map((quote) => (
                    <div
                      key={quote.id}
                      className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                        }`}
                      onClick={() => handleQuoteClick(quote)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onClick={(e) => toggleSelectQuote(quote.id, e)}
                          />
                          <span className="font-medium text-slate-900 truncate">{quote.customerName}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(quote.total)}
                        </span>
                      </div>
                      <div className="ml-6 flex items-center gap-2 text-sm">
                        <span className="text-slate-500">{quote.quoteNumber}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{formatDate(quote.date)}</span>
                      </div>
                      <div className="ml-6 mt-1">
                        <span className={`text-sm font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusDisplayText(quote.status, quote.convertedTo)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        <Checkbox />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quote Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                      <th className="w-10 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((quote) => (
                      <tr
                        key={quote.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleQuoteClick(quote)}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedQuotes.includes(quote.id)}
                            onClick={(e) => toggleSelectQuote(quote.id, e)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(quote.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-blue-600 hover:underline">
                            {quote.quoteNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {quote.referenceNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {quote.customerName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${getStatusColor(quote.status)}`}>
                            {getStatusDisplayText(quote.status, quote.convertedTo)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/${quote.id}/edit`); }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/quotes/create?cloneFrom=${quote.id}`); }}>Clone</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Send</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filteredQuotes.length > 0 && (
              <div className="flex-none border-t border-slate-200 bg-white">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </div>
        </ResizablePanel>

        {selectedQuote && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-slate-50">
              <div className="h-full overflow-hidden">
                <QuoteDetailPanel
                  quote={selectedQuote}
                  onClose={handleClosePanel}
                  onEdit={handleEditQuote}
                  onRefresh={() => {
                    fetchQuotes();
                    setSelectedQuote(null);
                  }}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
