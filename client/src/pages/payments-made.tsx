// import { useState } from "react";
// import { useLocation } from "wouter";
// import { useQuery } from "@tanstack/react-query";
// import { Plus, Search, Filter, CreditCard, MoreHorizontal, Trash2, X, Pencil, Mail, Printer, ChevronDown, Download, Eye } from "lucide-react";
// import { usePagination } from "@/hooks/use-pagination";
// import { TablePagination } from "@/components/table-pagination";
// import { useBranding } from "@/hooks/use-branding";
// import { useOrganization } from "@/context/OrganizationContext";
// import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { useToast } from "@/hooks/use-toast";
// import { robustIframePrint } from "@/lib/robust-print";
// import { generatePDFFromElement } from "@/lib/pdf-utils";

// interface BillPayment {
//   billId: string;
//   billNumber: string;
//   billDate: string;
//   billAmount: number;
//   paymentAmount: number;
// }

// interface PaymentMade {
//   id: string;
//   paymentNumber: string;
//   vendorId: string;
//   vendorName: string;
//   vendorGstin?: string;
//   vendorAddress?: {
//     street?: string;
//     city?: string;
//     state?: string;
//     pincode?: string;
//     country?: string;
//   };
//   paymentAmount: number;
//   paymentDate: string;
//   paymentMode: string;
//   paidThrough?: string;
//   depositTo?: string;
//   paymentType: string;
//   status: string;
//   reference?: string;
//   billPayments?: Record<string, BillPayment> | BillPayment[];
//   sourceOfSupply?: string;
//   destinationOfSupply?: string;
//   notes?: string;
//   unusedAmount?: number;
//   createdAt: string;
// }

// interface Vendor {
//   id: string;
//   vendorName: string;
//   companyName?: string;
//   gstin?: string;
//   address?: string;
//   city?: string;
//   state?: string;
//   pincode?: string;
//   country?: string;
// }

// // Convert number to words for Indian Rupees
// function numberToWords(num: number): string {
//   if (num === 0) return "Zero Only";

//   const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
//     "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
//   const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

//   function convertLessThanOneThousand(n: number): string {
//     let result = "";
//     if (n >= 100) {
//       result += ones[Math.floor(n / 100)] + " Hundred ";
//       n %= 100;
//     }
//     if (n >= 20) {
//       result += tens[Math.floor(n / 10)] + " ";
//       n %= 10;
//     }
//     if (n > 0) {
//       result += ones[n] + " ";
//     }
//     return result.trim();
//   }

//   const crore = Math.floor(num / 10000000);
//   num %= 10000000;
//   const lakh = Math.floor(num / 100000);
//   num %= 100000;
//   const thousand = Math.floor(num / 1000);
//   num %= 1000;
//   const remainder = Math.floor(num);
//   const paise = Math.round((num % 1) * 100);

//   let result = "Indian Rupee ";
//   if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
//   if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
//   if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
//   if (remainder > 0) result += convertLessThanOneThousand(remainder);

//   result += " Only";
//   return result.trim();
// }

// // Helper to safely get payment number as string (handles corrupted data)
// function getPaymentNumberString(paymentNumber: any): string {
//   if (typeof paymentNumber === 'string') {
//     return paymentNumber;
//   }
//   if (paymentNumber && typeof paymentNumber === 'object' && paymentNumber.nextNumber) {
//     return paymentNumber.nextNumber;
//   }
//   return '';
// }

// export default function PaymentsMade() {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
//   const [selectedPayment, setSelectedPayment] = useState<PaymentMade | null>(null);
//   const [showPdfView, setShowPdfView] = useState(false);

//   const { data: paymentsData, isLoading, refetch } = useQuery<{ success: boolean; data: PaymentMade[] }>({
//     queryKey: ['/api/payments-made'],
//   });

//   const { data: vendorsData } = useQuery<{ success: boolean; data: Vendor[] }>({
//     queryKey: ['/api/vendors'],
//   });

//   const { data: branding } = useBranding();
//   const { currentOrganization } = useOrganization();

//   const payments = paymentsData?.data || [];
//   const vendors = vendorsData?.data || [];

//   const filteredPayments = payments.filter(payment =>
//     getPaymentNumberString(payment.paymentNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
//     String(payment.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
//     String(payment.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredPayments, 10);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//     }).format(amount);
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return '-';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
//   };

//   const handleDelete = (id: string) => {
//     setPaymentToDelete(id);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!paymentToDelete) return;
//     try {
//       const response = await fetch(`/api/payments-made/${paymentToDelete}`, { method: 'DELETE' });
//       if (response.ok) {
//         toast({ title: "Payment deleted successfully" });
//         if (selectedPayment?.id === paymentToDelete) {
//           setSelectedPayment(null);
//         }
//         refetch();
//       } else {
//         toast({ title: "Failed to delete payment", variant: "destructive" });
//       }
//     } catch (error) {
//       toast({ title: "Failed to delete payment", variant: "destructive" });
//     } finally {
//       setDeleteDialogOpen(false);
//       setPaymentToDelete(null);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status?.toUpperCase()) {
//       case 'PAID':
//         return <span className="text-green-600 font-medium">PAID</span>;
//       case 'DRAFT':
//         return <span className="text-slate-500">Draft</span>;
//       case 'REFUNDED':
//         return <span className="text-red-600 font-medium">REFUNDED</span>;
//       default:
//         return <span>{status}</span>;
//     }
//   };

//   const getBillNumbers = (payment: PaymentMade) => {
//     if (!payment.billPayments) return '-';

//     if (Array.isArray(payment.billPayments)) {
//       return payment.billPayments.map(bp => bp.billNumber).join(', ') || '-';
//     }

//     const billNums = Object.values(payment.billPayments).map(bp => bp.billNumber);
//     return billNums.length > 0 ? billNums.join(', ') : '-';
//   };

//   const getBillPaymentsArray = (payment: PaymentMade): BillPayment[] => {
//     if (!payment.billPayments) return [];
//     if (Array.isArray(payment.billPayments)) return payment.billPayments;
//     return Object.values(payment.billPayments);
//   };

//   const getVendorDetails = (payment: PaymentMade) => {
//     const vendor = vendors.find(v => v.id === payment.vendorId);
//     return vendor;
//   };

//   const getPaidThroughLabel = (value?: string) => {
//     const options: Record<string, string> = {
//       'petty_cash': 'Petty Cash',
//       'undeposited_funds': 'Undeposited Funds',
//       'cash_on_hand': 'Cash on Hand',
//       'bank_account': 'Bank Account',
//     };
//     return options[value || ''] || value || '-';
//   };

//   const getPaymentModeLabel = (value?: string) => {
//     const options: Record<string, string> = {
//       'cash': 'Cash',
//       'bank_transfer': 'Bank Transfer',
//       'cheque': 'Cheque',
//       'credit_card': 'Credit Card',
//       'upi': 'UPI',
//       'neft': 'NEFT',
//       'rtgs': 'RTGS',
//       'imps': 'IMPS',
//     };
//     return options[value || ''] || value || '-';
//   };

//   const handleRowClick = (payment: PaymentMade) => {
//     setSelectedPayment(payment);
//   };

//   const calculateUnusedAmount = (payment: PaymentMade) => {
//     if (payment.unusedAmount !== undefined) return payment.unusedAmount;
//     const billPayments = getBillPaymentsArray(payment);
//     const usedAmount = billPayments.reduce((sum, bp) => sum + (bp.paymentAmount || 0), 0);
//     return Math.max(0, payment.paymentAmount - usedAmount);
//   };

//   const handlePrint = async () => {
//     toast({ title: "Preparing print...", description: "Please wait while we prepare the document." });

//     if (!showPdfView) {
//       setShowPdfView(true);
//       await new Promise(resolve => setTimeout(resolve, 1500));
//     }

//     try {
//       await robustIframePrint("payment-receipt-content");
//     } catch (error) {
//       console.error("Print error:", error);
//       toast({ title: "Error", description: "Failed to open print dialog.", variant: "destructive" });
//     }
//   };

//   const handleDownloadPDF = async () => {
//     if (!selectedPayment) return;
//     toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });

//     if (!showPdfView) {
//       setShowPdfView(true);
//       await new Promise(resolve => setTimeout(resolve, 1500));
//     }

//     try {
//       await generatePDFFromElement("payment-receipt-content", `Payment-${getPaymentNumberString(selectedPayment.paymentNumber)}.pdf`);
//       toast({ title: "Success", description: "Payment receipt downloaded successfully." });
//     } catch (error) {
//       console.error("PDF generation error:", error);
//       toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
//     }
//   };


//   return (
//     <div className="flex h-full">
//       <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="payments-made-layout">
//         <ResizablePanel
//           defaultSize={selectedPayment ? 30 : 100}
//           minSize={20}
//           className="flex flex-col overflow-hidden bg-white"
//         >
//           {/* Main List View */}
//           <div className="max-w-full mx-auto space-y-6 animate-in fade-in duration-500 p-6">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//               <div className="flex items-center gap-2">
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" className="gap-1 text-xl font-semibold">
//                       All Payments <ChevronDown className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="start">
//                     <DropdownMenuItem>All Payments</DropdownMenuItem>
//                     <DropdownMenuItem>Paid</DropdownMenuItem>
//                     <DropdownMenuItem>Refunded</DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Button
//                   className="gap-2"
//                   onClick={() => setLocation('/payments-made/new')}
//                   data-testid="button-record-payment"
//                 >
//                   <Plus className="h-4 w-4" /> New
//                 </Button>
//                 <Button variant="outline" size="icon">
//                   <MoreHorizontal className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search payments..."
//                   className="pl-9"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   data-testid="input-search-payments"
//                 />
//               </div>
//               <Button variant="outline" className="gap-2">
//                 <Filter className="h-4 w-4" /> Filter
//               </Button>
//             </div>

//             {isLoading ? (
//               <div className="flex items-center justify-center py-16">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//               </div>
//             ) : payments.length === 0 ? (
//               <Card className="border-dashed">
//                 <CardContent className="flex flex-col items-center justify-center py-16 text-center">
//                   <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
//                     <CreditCard className="h-8 w-8 text-muted-foreground" />
//                   </div>
//                   <h3 className="text-lg font-semibold mb-2" data-testid="text-payments-empty">No payments recorded</h3>
//                   <p className="text-muted-foreground mb-4 max-w-sm">
//                     Record payments made to vendors to keep track of your accounts payable.
//                   </p>
//                   <Button
//                     className="gap-2"
//                     onClick={() => setLocation('/payments-made/new')}
//                     data-testid="button-record-first-payment"
//                   >
//                     <Plus className="h-4 w-4" /> Record Your First Payment
//                   </Button>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
//                       <tr>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
//                           <Checkbox
//                             checked={paginatedItems.length > 0 && paginatedItems.every(p => false)} // Logic for bulk select if needed
//                             data-testid="checkbox-select-all"
//                           />
//                         </th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Payment #</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Reference#</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Vendor Name</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Bill#</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Mode</th>
//                         <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
//                         <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
//                         <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Unused Amount</th>
//                         <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
//                           <Search className="h-4 w-4 mx-auto" />
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
//                       {paginatedItems.map((payment) => (
//                         <tr
//                           key={payment.id}
//                           className={`hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedPayment?.id === payment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
//                           onClick={() => handleRowClick(payment)}
//                           data-testid={`row-payment-${payment.id}`}
//                         >
//                           <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
//                             <Checkbox data-testid={`checkbox-payment-${payment.id}`} />
//                           </td>
//                           <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
//                           <td className="px-4 py-4 text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">{getPaymentNumberString(payment.paymentNumber)}</td>
//                           <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{payment.reference || '-'}</td>
//                           <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">{payment.vendorName}</td>
//                           <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{getBillNumbers(payment)}</td>
//                           <td className="px-4 py-4 text-sm capitalize text-slate-600 dark:text-slate-300 whitespace-nowrap">{getPaymentModeLabel(payment.paymentMode)}</td>
//                           <td className="px-4 py-4 text-sm whitespace-nowrap">{getStatusBadge(payment.status)}</td>
//                           <td className="px-4 py-4 text-sm text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
//                             {formatCurrency(payment.paymentAmount)}
//                           </td>
//                           <td className="px-4 py-4 text-sm text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
//                             {formatCurrency(calculateUnusedAmount(payment))}
//                           </td>
//                           <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate" data-testid={`button-payment-actions-${payment.id}`}>
//                                   <MoreHorizontal className="h-4 w-4" />
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end">
//                                 <DropdownMenuItem onClick={() => handleRowClick(payment)} data-testid={`action-view-${payment.id}`}>View</DropdownMenuItem>
//                                 <DropdownMenuItem onClick={() => setLocation(`/payments-made/edit/${payment.id}`)} data-testid={`action-edit-${payment.id}`}>Edit</DropdownMenuItem>
//                                 <DropdownMenuSeparator />
//                                 <DropdownMenuItem
//                                   className="text-destructive"
//                                   onClick={() => handleDelete(payment.id)}
//                                   data-testid={`action-delete-${payment.id}`}
//                                 >
//                                   <Trash2 className="mr-2 h-4 w-4" />
//                                   Delete
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 <div className="p-4 border-t border-slate-200 dark:border-slate-700">
//                   <TablePagination
//                     currentPage={currentPage}
//                     totalPages={totalPages}
//                     totalItems={totalItems}
//                     itemsPerPage={itemsPerPage}
//                     onPageChange={goToPage}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         </ResizablePanel>

//         {/* Detail Panel */}
//         {selectedPayment && (
//           <>
//             <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
//             <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
//               <div className="flex flex-col h-full overflow-hidden">
//                 {/* Detail Header - Sidebar with List */}
//                 {/* <div className="border-b">
//             <div className="max-h-[200px] overflow-y-auto">
//               {filteredPayments.map((payment) => (
//                 <div
//                   key={payment.id}
//                   className={`p-3 border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedPayment.id === payment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
//                   onClick={() => setSelectedPayment(payment)}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Checkbox />
//                       <div>
//                         <div className="font-medium text-sm truncate max-w-[180px]">{payment.vendorName}</div>
//                         <div className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)} - {getPaymentModeLabel(payment.paymentMode)}</div>
//                         <span className="text-xs text-green-600">{payment.status}</span>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-semibold">{formatCurrency(payment.paymentAmount)}</div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div> */}

//                 {/* Detail Actions */}
//                 <div className="flex items-center justify-between p-3 border-b bg-slate-50 dark:bg-slate-800">
//                   <div className="font-semibold">{getPaymentNumberString(selectedPayment.paymentNumber)}</div>
//                   <div className="flex items-center gap-2">
//                     <Button variant="outline" size="sm" className="gap-1">
//                       <Plus className="h-3 w-3" />
//                     </Button>
//                     <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/payments-made/edit/${selectedPayment.id}`)}>
//                       <Pencil className="h-3 w-3" /> Edit
//                     </Button>
//                     <Button variant="outline" size="sm" className="gap-1">
//                       <Mail className="h-3 w-3" /> Send Email
//                     </Button>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="outline" size="sm" className="gap-1">
//                           <Printer className="h-3 w-3" /> PDF/Print <ChevronDown className="h-3 w-3" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent>
//                         <DropdownMenuItem onClick={handleDownloadPDF}>
//                           <Download className="mr-2 h-4 w-4" /> Download PDF
//                         </DropdownMenuItem>
//                         <DropdownMenuItem onClick={handlePrint}>
//                           <Printer className="mr-2 h-4 w-4" /> Print
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>

//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-8 w-8">
//                           <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => setShowPdfView(!showPdfView)}>
//                           <Eye className="h-4 w-4 mr-2" />
//                           {showPdfView ? 'View Details' : 'View PDF'}
//                         </DropdownMenuItem>
//                         <DropdownMenuItem>
//                           <Mail className="h-4 w-4 mr-2" /> Send Email
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(null)}>
//                       <X className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Detail Content */}
//                 <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
//                   {showPdfView ? (
//                     <div className="max-w-4xl mx-auto shadow-lg bg-white my-8">
//                       <div
//                         id="payment-receipt-content"
//                         className="bg-white border border-slate-200"
//                         style={{
//                           width: '210mm',
//                           minHeight: '297mm',
//                           backgroundColor: 'white',
//                           padding: '48px',
//                           fontFamily: 'Arial, sans-serif',
//                           color: '#000',
//                           margin: '0 auto',
//                           position: 'relative'
//                         }}
//                       >
//                         {/* Paid Badge Overlay */}
//                         <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none paid-badge-overlay">
//                           <div className="bg-green-500 text-white text-[10px] font-bold py-1 px-10 absolute top-4 -left-8 -rotate-45 shadow-sm uppercase tracking-wider">
//                             Paid
//                           </div>
//                         </div>

//                         {/* Standard Purchase PDF Header */}
//                         <PurchasePDFHeader
//                           logo={branding?.logo || undefined}
//                           documentTitle="Payment Made"
//                           documentNumber={selectedPayment.paymentNumber}
//                           date={selectedPayment.paymentDate}
//                           referenceNumber={selectedPayment.reference}
//                           organization={currentOrganization || undefined}
//                         />

//                         <div className="border-t border-slate-100 mb-6"></div>

//                         {/* Title */}
//                         <h3 className="text-center text-xs font-semibold tracking-[0.2em] mb-8 uppercase text-slate-700 dark:text-slate-300">PAYMENT RECEIPT</h3>

//                         <div className="flex gap-8 mb-8">
//                           {/* Left Column - Details */}
//                           <div className="flex-1 space-y-3">
//                             {[
//                               { label: "Payment#", value: getPaymentNumberString(selectedPayment.paymentNumber) },
//                               { label: "Payment Date", value: formatDate(selectedPayment.paymentDate) },
//                               { label: "Reference Number", value: selectedPayment.reference || '' },
//                               { label: "Paid To", value: selectedPayment.vendorName, highlight: true },
//                               { label: "Place Of Supply", value: selectedPayment.sourceOfSupply || '-' },
//                               { label: "Payment Mode", value: getPaymentModeLabel(selectedPayment.paymentMode) },
//                               { label: "Paid Through", value: getPaidThroughLabel(selectedPayment.paidThrough) },
//                               { label: "Amount Paid In Words", value: numberToWords(selectedPayment.paymentAmount) },
//                             ].map((row, i) => (
//                               <div key={i} className="flex border-b border-slate-50 pb-1.5">
//                                 <div className="w-32 text-[10px] text-slate-400">{row.label}</div>
//                                 <div className={`flex-1 text-[10px] font-medium ${row.highlight ? 'text-blue-600' : 'text-slate-800 dark:text-slate-200'}`}>
//                                   {row.value}
//                                 </div>
//                               </div>
//                             ))}
//                           </div>

//                           {/* Right Column - Amount Box */}
//                           <div className="w-40 pt-2">
//                             <div className="bg-[#82b366] text-white p-4 rounded-sm text-center shadow-sm">
//                               <div className="text-[10px] mb-0.5 opacity-90">Amount Paid</div>
//                               <div className="text-lg font-bold">{formatCurrency(selectedPayment.paymentAmount)}</div>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Paid To Section */}
//                         <div className="mb-8">
//                           <h4 className="text-[10px] font-semibold text-slate-400 mb-2">Paid To</h4>
//                           <div className="text-[10px] space-y-0.5 text-slate-700 dark:text-slate-300">
//                             <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedPayment.vendorName}</p>
//                             {(() => {
//                               const vendor = getVendorDetails(selectedPayment);
//                               if (vendor) {
//                                 return (
//                                   <>
//                                     {vendor.address && <p>{vendor.address}</p>}
//                                     {(vendor.city || vendor.state || vendor.pincode) && (
//                                       <p>{[vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ')}</p>
//                                     )}
//                                     {vendor.country && <p>{vendor.country}</p>}
//                                     {vendor.gstin && <p className="mt-1 text-slate-500 uppercase">GSTIN {vendor.gstin}</p>}
//                                   </>
//                                 );
//                               }
//                               return null;
//                             })()}
//                           </div>
//                         </div>

//                         <div className="border-t border-slate-100 mb-6"></div>

//                         {/* Payment for Section */}
//                         {getBillPaymentsArray(selectedPayment).length > 0 && (
//                           <div>
//                             <h4 className="text-xs font-bold mb-4 text-slate-800 dark:text-slate-200">Payment for</h4>
//                             <table className="w-full text-[10px]">
//                               <thead>
//                                 <tr className="bg-slate-100 dark:bg-slate-800/50">
//                                   <th className="px-3 py-2 text-left font-bold text-slate-700">Bill Number</th>
//                                   <th className="px-3 py-2 text-left font-bold text-slate-700">Bill Date</th>
//                                   <th className="px-3 py-2 text-right font-bold text-slate-700">Bill Amount</th>
//                                   <th className="px-3 py-2 text-right font-bold text-slate-700">Payment Amount</th>
//                                 </tr>
//                               </thead>
//                               <tbody className="divide-y divide-slate-200">
//                                 {getBillPaymentsArray(selectedPayment).map((bp, index) => (
//                                   <tr key={index}>
//                                     <td className="px-3 py-2 text-blue-600 font-medium">{bp.billNumber}</td>
//                                     <td className="px-3 py-2 text-slate-600">{formatDate(bp.billDate)}</td>
//                                     <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(bp.billAmount)}</td>
//                                     <td className="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">{formatCurrency(bp.paymentAmount || 0)}</td>
//                                   </tr>
//                                 ))}
//                               </tbody>
//                             </table>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ) : (
//                     <>
//                       {/* Original Detail View */}
//                       <div className="bg-white dark:bg-slate-900 border p-8 shadow-sm">
//                         <div className="flex justify-between items-start mb-8">
//                           <div>
//                             <h3 className="text-xl font-bold mb-1">Receipt for {selectedPayment.vendorName}</h3>
//                             <p className="text-sm text-muted-foreground">Payment Date: {formatDate(selectedPayment.paymentDate)}</p>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayment.paymentAmount)}</div>
//                             <Badge variant="outline" className="mt-1">{selectedPayment.status}</Badge>
//                           </div>
//                         </div>

//                         <div className="grid grid-cols-2 gap-8 mb-8">
//                           <div>
//                             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment Details</h4>
//                             <div className="space-y-2 text-sm">
//                               <div className="flex justify-between border-b pb-1">
//                                 <span className="text-muted-foreground">Payment Number:</span>
//                                 <span className="font-medium">{getPaymentNumberString(selectedPayment.paymentNumber)}</span>
//                               </div>
//                               <div className="flex justify-between border-b pb-1">
//                                 <span className="text-muted-foreground">Payment Mode:</span>
//                                 <span className="font-medium uppercase">{getPaymentModeLabel(selectedPayment.paymentMode)}</span>
//                               </div>
//                               <div className="flex justify-between border-b pb-1">
//                                 <span className="text-muted-foreground">Paid Through:</span>
//                                 <span className="font-medium">{getPaidThroughLabel(selectedPayment.paidThrough)}</span>
//                               </div>
//                               <div className="flex justify-between border-b pb-1">
//                                 <span className="text-muted-foreground">Reference:</span>
//                                 <span className="font-medium">{selectedPayment.reference || '-'}</span>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Journal Section Moved here */}
//                       <div className="mt-6">
//                         {/* ... existing journal tabs ... */}
//                         <Tabs defaultValue="journal">
//                           <TabsList>
//                             <TabsTrigger value="journal">Journal</TabsTrigger>
//                           </TabsList>
//                           <TabsContent value="journal" className="mt-4">
//                             <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
//                               <div className="flex items-center justify-between mb-4">
//                                 <div className="text-sm text-muted-foreground">
//                                   Amount is displayed in your base currency <Badge variant="secondary" className="ml-2">INR</Badge>
//                                 </div>
//                                 <div className="flex gap-2">
//                                   <Button variant="outline" size="sm">Accrual</Button>
//                                   <Button variant="ghost" size="sm">Cash</Button>
//                                 </div>
//                               </div>

//                               <div className="font-semibold mb-2">Vendor Payment - {getPaymentNumberString(selectedPayment.paymentNumber)}</div>
//                               <table className="w-full text-sm">
//                                 <thead className="bg-slate-100 dark:bg-slate-700">
//                                   <tr>
//                                     <th className="px-3 py-2 text-left">ACCOUNT</th>
//                                     <th className="px-3 py-2 text-right">DEBIT</th>
//                                     <th className="px-3 py-2 text-right">CREDIT</th>
//                                   </tr>
//                                 </thead>
//                                 <tbody>
//                                   <tr className="border-b">
//                                     <td className="px-3 py-2">{getPaidThroughLabel(selectedPayment.paidThrough)}</td>
//                                     <td className="px-3 py-2 text-right">0.00</td>
//                                     <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                   </tr>
//                                   <tr className="border-b">
//                                     <td className="px-3 py-2">Prepaid Expenses</td>
//                                     <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                     <td className="px-3 py-2 text-right">0.00</td>
//                                   </tr>
//                                   <tr className="font-bold bg-slate-100 dark:bg-slate-700">
//                                     <td className="px-3 py-2"></td>
//                                     <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                     <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                   </tr>
//                                 </tbody>
//                               </table>

//                               {getBillPaymentsArray(selectedPayment).length > 0 && (
//                                 <>
//                                   <div className="font-semibold mb-2 mt-6">Payments Made - {getBillNumbers(selectedPayment)}</div>
//                                   <table className="w-full text-sm">
//                                     <thead className="bg-slate-100 dark:bg-slate-700">
//                                       <tr>
//                                         <th className="px-3 py-2 text-left">ACCOUNT</th>
//                                         <th className="px-3 py-2 text-right">DEBIT</th>
//                                         <th className="px-3 py-2 text-right">CREDIT</th>
//                                       </tr>
//                                     </thead>
//                                     <tbody>
//                                       <tr className="border-b">
//                                         <td className="px-3 py-2">Prepaid Expenses</td>
//                                         <td className="px-3 py-2 text-right">0.00</td>
//                                         <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                       </tr>
//                                       <tr className="border-b">
//                                         <td className="px-3 py-2">Accounts Payable</td>
//                                         <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                         <td className="px-3 py-2 text-right">0.00</td>
//                                       </tr>
//                                       <tr className="font-bold bg-slate-100 dark:bg-slate-700">
//                                         <td className="px-3 py-2"></td>
//                                         <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                         <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
//                                       </tr>
//                                     </tbody>
//                                   </table>
//                                 </>
//                               )}
//                             </div>
//                           </TabsContent>
//                         </Tabs>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </ResizablePanel>
//           </>
//         )}
//       </ResizablePanelGroup>

//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Payment</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete this payment? This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, CreditCard, MoreHorizontal, Trash2, X, Pencil, Mail, Printer, ChevronDown } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/table-pagination";
import { useBranding } from "@/hooks/use-branding";
import { useOrganization } from "@/context/OrganizationContext";
import { PurchasePDFHeader } from "@/components/purchase-pdf-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface BillPayment {
  billId: string;
  billNumber: string;
  billDate: string;
  billAmount: number;
  paymentAmount: number;
}

interface PaymentMade {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  vendorAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  paymentAmount: number;
  paymentDate: string;
  paymentMode: string;
  paidThrough?: string;
  depositTo?: string;
  paymentType: string;
  status: string;
  reference?: string;
  billPayments?: Record<string, BillPayment> | BillPayment[];
  sourceOfSupply?: string;
  destinationOfSupply?: string;
  notes?: string;
  unusedAmount?: number;
  createdAt: string;
}

interface Vendor {
  id: string;
  vendorName: string;
  companyName?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

// Convert number to words for Indian Rupees
function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanOneThousand(n: number): string {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);
  const paise = Math.round((num % 1) * 100);

  let result = "Indian Rupee ";
  if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  result += " Only";
  return result.trim();
}

// Helper to safely get payment number as string (handles corrupted data)
function getPaymentNumberString(paymentNumber: any): string {
  if (typeof paymentNumber === 'string') {
    return paymentNumber;
  }
  if (paymentNumber && typeof paymentNumber === 'object' && paymentNumber.nextNumber) {
    return paymentNumber.nextNumber;
  }
  return '';
}

export default function PaymentsMade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMade | null>(null);

  const { data: paymentsData, isLoading, refetch } = useQuery<{ success: boolean; data: PaymentMade[] }>({
    queryKey: ['/api/payments-made'],
  });

  const { data: vendorsData } = useQuery<{ success: boolean; data: Vendor[] }>({
    queryKey: ['/api/vendors'],
  });

  const { data: branding } = useBranding();
  const { currentOrganization } = useOrganization();

  const payments = paymentsData?.data || [];
  const vendors = vendorsData?.data || [];

  const filteredPayments = payments.filter(payment =>
    getPaymentNumberString(payment.paymentNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(payment.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(payment.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredPayments, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      const response = await fetch(`/api/payments-made/${paymentToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Payment deleted successfully" });
        if (selectedPayment?.id === paymentToDelete) {
          setSelectedPayment(null);
        }
        refetch();
      } else {
        toast({ title: "Failed to delete payment", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete payment", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <span className="text-green-600 font-medium">PAID</span>;
      case 'DRAFT':
        return <span className="text-slate-500">Draft</span>;
      case 'REFUNDED':
        return <span className="text-red-600 font-medium">REFUNDED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getBillNumbers = (payment: PaymentMade) => {
    if (!payment.billPayments) return '-';

    if (Array.isArray(payment.billPayments)) {
      return payment.billPayments.map(bp => bp.billNumber).join(', ') || '-';
    }

    const billNums = Object.values(payment.billPayments).map(bp => bp.billNumber);
    return billNums.length > 0 ? billNums.join(', ') : '-';
  };

  const getBillPaymentsArray = (payment: PaymentMade): BillPayment[] => {
    if (!payment.billPayments) return [];
    if (Array.isArray(payment.billPayments)) return payment.billPayments;
    return Object.values(payment.billPayments);
  };

  const getVendorDetails = (payment: PaymentMade) => {
    const vendor = vendors.find(v => v.id === payment.vendorId);
    return vendor;
  };

  const getPaidThroughLabel = (value?: string) => {
    const options: Record<string, string> = {
      'petty_cash': 'Petty Cash',
      'undeposited_funds': 'Undeposited Funds',
      'cash_on_hand': 'Cash on Hand',
      'bank_account': 'Bank Account',
    };
    return options[value || ''] || value || '-';
  };

  const getPaymentModeLabel = (value?: string) => {
    const options: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'cheque': 'Cheque',
      'credit_card': 'Credit Card',
      'upi': 'UPI',
      'neft': 'NEFT',
      'rtgs': 'RTGS',
      'imps': 'IMPS',
    };
    return options[value || ''] || value || '-';
  };

  const handleRowClick = (payment: PaymentMade) => {
    setSelectedPayment(payment);
  };

  const calculateUnusedAmount = (payment: PaymentMade) => {
    if (payment.unusedAmount !== undefined) return payment.unusedAmount;
    const billPayments = getBillPaymentsArray(payment);
    const usedAmount = billPayments.reduce((sum, bp) => sum + (bp.paymentAmount || 0), 0);
    return Math.max(0, payment.paymentAmount - usedAmount);
  };

  const handlePrint = () => {
    const content = document.getElementById('payment-receipt-content')?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${getPaymentNumberString(selectedPayment?.paymentNumber)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            @media print {
              @page { margin: 10mm; }
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              #payment-receipt-content { 
                border: none !important; 
                box-shadow: none !important; 
                width: 100% !important; 
                max-width: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Hide the Paid badge during print */
              .paid-badge-overlay {
                display: none !important;
              }
            }
            /* Fix for oklch in tailwind cdn */
            * {
              --tw-ring-color: transparent !important;
              --tw-ring-offset-color: transparent !important;
              --tw-ring-shadow: none !important;
              --tw-shadow: none !important;
              --tw-shadow-colored: none !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div id="payment-receipt-content" class="w-full">
            ${content}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!selectedPayment) return;

    const element = document.getElementById('payment-receipt-content');
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Create a style element for polyfills to remove oklch variables site-wide
      const polyfillStyles = document.createElement('style');
      polyfillStyles.innerHTML = `
        * {
          --tw-ring-color: transparent !important;
          --tw-ring-offset-color: transparent !important;
          --tw-ring-shadow: none !important;
          --tw-shadow: none !important;
          --tw-shadow-colored: none !important;
          outline-color: transparent !important;
          caret-color: transparent !important;
          accent-color: transparent !important;
          
          /* Force standard RGB colors for PDF consistency */
          color-scheme: light !important;
        }
        /* Fix for light lines and colors in PDF */
        .border-slate-50 { border-color: #f1f5f9 !important; border-bottom-width: 1px !important; }
        .border-slate-100 { border-color: #f1f5f9 !important; border-bottom-width: 1px !important; }
        .border-slate-200 { border-color: #e2e8f0 !important; border-bottom-width: 1px !important; }
        .text-slate-400 { color: #94a3b8 !important; }
        .text-slate-500 { color: #64748b !important; }
        .text-slate-600 { color: #475569 !important; }
        .text-slate-700 { color: #334155 !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .bg-slate-100 { background-color: #f1f5f9 !important; }
        
        /* Force background visibility */
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        
        /* Hide badge for PDF generation */
        .paid-badge-overlay {
          display: none !important;
        }
      `;
      document.head.appendChild(polyfillStyles);

      // Force a re-layout and wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('payment-receipt-content');
          if (clonedElement) {
            // Hide the badge in the clone
            const badge = clonedElement.querySelector('.paid-badge-overlay');
            if (badge) (badge as HTMLElement).style.display = 'none';

            // Find ALL elements in the cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;

              // 1. Clear any inline styles that might use oklch
              const inlineStyle = htmlEl.getAttribute('style') || '';
              if (inlineStyle.includes('oklch')) {
                htmlEl.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, 'inherit'));
              }

              // 2. Clear known Tailwind 4 variables that often hold oklch
              htmlEl.style.setProperty('--tw-ring-color', 'transparent', 'important');
              htmlEl.style.setProperty('--tw-ring-offset-color', 'transparent', 'important');
              htmlEl.style.setProperty('--tw-ring-shadow', 'none', 'important');
              htmlEl.style.setProperty('--tw-shadow', 'none', 'important');
              htmlEl.style.setProperty('--tw-shadow-colored', 'none', 'important');

              // 3. Force computed styles to fall back
              const computed = window.getComputedStyle(htmlEl);

              // Check all potential color properties
              const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'];
              colorProps.forEach(prop => {
                const value = computed[prop as any];
                if (value && value.includes('oklch')) {
                  // Standard fallbacks
                  if (prop === 'color') htmlEl.style.setProperty('color', '#0f172a', 'important');
                  else if (prop === 'backgroundColor') htmlEl.style.setProperty('background-color', 'transparent', 'important');
                  else if (prop === 'borderColor') htmlEl.style.setProperty('border-color', '#e2e8f0', 'important');
                  else htmlEl.style.setProperty(prop, 'inherit', 'important');
                }
              });
            });
          }
        }
      });

      document.head.removeChild(polyfillStyles);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payment-${getPaymentNumberString(selectedPayment.paymentNumber)}.pdf`);

      toast({ title: "PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="payments-made-layout">
        <ResizablePanel
          defaultSize={selectedPayment ? 30 : 100}
          minSize={20}
          className="flex flex-col overflow-hidden bg-white border-r"
        >
          {/* Main List View */}
          <div className={`flex flex-col h-full ${selectedPayment ? 'w-full' : 'max-w-full mx-auto p-6'} animate-in fade-in duration-500`}>
            {!selectedPayment && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-1 text-xl font-semibold hover:bg-transparent p-0">
                        All Payments <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>All Payments</DropdownMenuItem>
                      <DropdownMenuItem>Paid</DropdownMenuItem>
                      <DropdownMenuItem>Refunded</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setLocation('/payments-made/new')}
                    data-testid="button-record-payment"
                  >
                    <Plus className="h-4 w-4" /> New
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedPayment && (
              <div className="flex items-center justify-between p-4 border-b bg-white">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1 font-semibold p-0 hover:bg-transparent">
                      All Payments <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>All Payments</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setLocation('/payments-made/new')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!selectedPayment && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-payments"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : payments.length === 0 ? (
              <Card className="border-dashed m-6">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-payments-empty">No payments recorded</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Record payments made to vendors to keep track of your accounts payable.
                  </p>
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setLocation('/payments-made/new')}
                    data-testid="button-record-first-payment"
                  >
                    <Plus className="h-4 w-4" /> Record Your First Payment
                  </Button>
                </CardContent>
              </Card>
            ) : selectedPayment ? (
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${selectedPayment.id === payment.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                        }`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <Checkbox
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate uppercase text-slate-900">
                              {payment.vendorName}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {formatDate(payment.paymentDate)} • {getPaymentModeLabel(payment.paymentMode)}
                            </div>
                            <div className={`text-[10px] font-bold mt-1 uppercase ${payment.status === 'PAID' ? 'text-green-600' : 'text-slate-400'
                              }`}>
                              {payment.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-sm">
                            {formatCurrency(payment.paymentAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                          <Checkbox
                            checked={paginatedItems.length > 0 && paginatedItems.every(p => false)} // Logic for bulk select if needed
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Payment #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Reference#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Vendor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Bill#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Unused Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                          <Search className="h-4 w-4 mx-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedItems.map((payment) => (
                        <tr
                          key={payment.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedPayment?.id === payment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => handleRowClick(payment)}
                          data-testid={`row-payment-${payment.id}`}
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox data-testid={`checkbox-payment-${payment.id}`} />
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                          <td className="px-4 py-4 text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">{getPaymentNumberString(payment.paymentNumber)}</td>
                          <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{payment.reference || '-'}</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">{payment.vendorName}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{getBillNumbers(payment)}</td>
                          <td className="px-4 py-4 text-sm capitalize text-slate-600 dark:text-slate-300 whitespace-nowrap">{getPaymentModeLabel(payment.paymentMode)}</td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                          <td className="px-4 py-4 text-sm text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(payment.paymentAmount)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatCurrency(calculateUnusedAmount(payment))}
                          </td>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover-elevate" data-testid={`button-payment-actions-${payment.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRowClick(payment)} data-testid={`action-view-${payment.id}`}>View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/payments-made/edit/${payment.id}`)} data-testid={`action-edit-${payment.id}`}>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(payment.id)}
                                  data-testid={`action-delete-${payment.id}`}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {filteredPayments.length > 0 && (
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

        {/* Detail Panel */}
        {selectedPayment && (
          <>
            <ResizableHandle withHandle className="w-1 bg-slate-100 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
            <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
              <div className="flex flex-col h-full overflow-hidden">
                {/* Detail Header */}
                <div className="flex items-center justify-between p-3 border-b bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold">{getPaymentNumberString(selectedPayment.paymentNumber)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => setLocation(`/payments-made/edit/${selectedPayment.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 h-8">
                      <Mail className="h-3.5 w-3.5" /> Send Email
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-8">
                          <Printer className="h-3.5 w-3.5" /> PDF/Print <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handlePrint}>Print</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadPDF}>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
                  {/* Receipt Preview */}
                  <div id="payment-receipt-content" className="bg-white dark:bg-slate-900 border shadow-lg mx-auto max-w-[800px] relative p-12 text-slate-800 dark:text-slate-200 rounded-sm">
                    {/* Paid Badge Overlay */}
                    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none paid-badge-overlay">
                      <div className="bg-[#4CAF50] text-white text-[10px] font-bold py-1 px-10 absolute top-4 -left-8 -rotate-45 shadow-sm uppercase tracking-wider">
                        Paid
                      </div>
                    </div>

                    {/* Header with Organization Info */}
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex gap-4 items-start">
                        {branding?.logo && typeof branding.logo === 'string' ? (
                          <img src={branding.logo} alt="Logo" className="h-16 w-auto object-contain" />
                        ) : (
                          <div className="h-16 w-16 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-bold text-xl">
                            {currentOrganization?.name?.[0]}
                          </div>
                        )}
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">{currentOrganization?.name}</h2>
                          <div className="text-xs text-slate-500 space-y-0.5">
                            <p>{currentOrganization?.location}</p>
                            {currentOrganization?.gstin && <p>GSTIN: {currentOrganization.gstin}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h1 className="text-2xl font-bold text-slate-400 uppercase tracking-tight">PAYMENT MADE</h1>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 mb-8"></div>

                    <div className="flex justify-between gap-12 mb-10">
                      {/* Left Side Details */}
                      <div className="flex-1 grid grid-cols-[140px,1fr] gap-y-3 text-sm">
                        <div className="text-slate-400 text-xs uppercase font-medium">Payment#</div>
                        <div className="text-slate-900 font-medium text-xs">{getPaymentNumberString(selectedPayment.paymentNumber)}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium">Payment Date</div>
                        <div className="text-slate-900 font-medium text-xs">{formatDate(selectedPayment.paymentDate)}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium">Reference Number</div>
                        <div className="text-slate-900 font-medium text-xs">{selectedPayment.reference || '-'}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium">Paid To</div>
                        <div className="text-blue-600 font-bold text-xs uppercase">{selectedPayment.vendorName}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium">Payment Mode</div>
                        <div className="text-slate-900 font-medium text-xs">{getPaymentModeLabel(selectedPayment.paymentMode)}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium">Paid Through</div>
                        <div className="text-slate-900 font-medium text-xs">{getPaidThroughLabel(selectedPayment.paidThrough)}</div>

                        <div className="text-slate-400 text-xs uppercase font-medium mt-2">Amount Paid In Words</div>
                        <div className="text-slate-900 font-medium text-xs mt-2 italic">{numberToWords(selectedPayment.paymentAmount)}</div>
                      </div>

                      {/* Right Side Amount Box */}
                      <div className="w-48">
                        <div className="bg-[#82b366] text-white p-6 rounded-sm text-center shadow-md">
                          <div className="text-xs mb-1 opacity-90 uppercase font-medium tracking-wider">Amount Paid</div>
                          <div className="text-2xl font-bold">{formatCurrency(selectedPayment.paymentAmount)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bill Details Table */}
                    {getBillPaymentsArray(selectedPayment).length > 0 && (
                      <div className="mt-12">
                        <h4 className="text-sm font-bold mb-4 text-slate-800 uppercase tracking-wider border-b pb-2">Payment for</h4>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-y">
                              <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Bill Number</th>
                              <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Bill Date</th>
                              <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase">Bill Amount</th>
                              <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase">Payment Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {getBillPaymentsArray(selectedPayment).map((bp, index) => (
                              <tr key={index}>
                                <td className="px-4 py-4 text-blue-600 font-bold">{bp.billNumber}</td>
                                <td className="px-4 py-4 text-slate-600">{formatDate(bp.billDate)}</td>
                                <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(bp.billAmount)}</td>
                                <td className="px-4 py-4 text-right text-slate-900 font-bold">{formatCurrency(bp.paymentAmount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Journal Section */}
                  <div className="mt-8 max-w-[800px] mx-auto">
                    <Tabs defaultValue="journal">
                      <TabsList>
                        <TabsTrigger value="journal">Journal</TabsTrigger>
                      </TabsList>
                      <TabsContent value="journal" className="mt-4">
                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-muted-foreground">
                              Amount is displayed in your base currency <Badge variant="secondary" className="ml-2">INR</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Accrual</Button>
                              <Button variant="ghost" size="sm">Cash</Button>
                            </div>
                          </div>

                          <div className="font-semibold mb-2">Vendor Payment - {getPaymentNumberString(selectedPayment.paymentNumber)}</div>
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                              <tr>
                                <th className="px-3 py-2 text-left">ACCOUNT</th>
                                <th className="px-3 py-2 text-right">DEBIT</th>
                                <th className="px-3 py-2 text-right">CREDIT</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="px-3 py-2">{getPaidThroughLabel(selectedPayment.paidThrough)}</td>
                                <td className="px-3 py-2 text-right">0.00</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="px-3 py-2">Prepaid Expenses</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">0.00</td>
                              </tr>
                              <tr className="font-bold bg-slate-100 dark:bg-slate-700">
                                <td className="px-3 py-2"></td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          {getBillPaymentsArray(selectedPayment).length > 0 && (
                            <>
                              <div className="font-semibold mb-2 mt-6">Payments Made - {getBillNumbers(selectedPayment)}</div>
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-700">
                                  <tr>
                                    <th className="px-3 py-2 text-left">ACCOUNT</th>
                                    <th className="px-3 py-2 text-right">DEBIT</th>
                                    <th className="px-3 py-2 text-right">CREDIT</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b">
                                    <td className="px-3 py-2">Prepaid Expenses</td>
                                    <td className="px-3 py-2 text-right">0.00</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr className="border-b">
                                    <td className="px-3 py-2">Accounts Payable</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">0.00</td>
                                  </tr>
                                  <tr className="font-bold bg-slate-100 dark:bg-slate-700">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">{selectedPayment.paymentAmount.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
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
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}