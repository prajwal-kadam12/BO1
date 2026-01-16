
import { X, Edit, Printer, MoreHorizontal, MessageSquare, Download, Share2, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EWayBill {
  id: string;
  ewayBillNumber: string;
  date: string;
  status: string;
  invoiceNumber: string;
  customerName: string;
  fromGSTIN: string;
  toGSTIN: string;
  placeOfDispatch: string;
  placeOfDelivery: string;
  transactionType: string;
  documentType: string;
  totalValue: number;
  validUntil: string;
  distance: number;
  vehicleNumber: string;
  transporterName: string;
  transporterDocNumber: string;
}

interface EWayBillDetailPanelProps {
  ewayBill: EWayBill;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EWayBillDetailPanel({ ewayBill, onClose, onEdit, onDelete }: EWayBillDetailPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">e-Way Bill Details</h2>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase">
            {ewayBill.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b bg-slate-50/30">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2">
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2">
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-[13px] text-slate-600 font-medium gap-1.5 hover:bg-slate-100 px-2">
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
        <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />
        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:bg-slate-100 px-2">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="gap-2">
              <ExternalLink className="h-4 w-4" /> View on Portal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 space-y-10">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <p className="text-[13px] text-slate-500 mb-1.5">e-Way Bill Number</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-indigo-600">{ewayBill.ewayBillNumber}</span>
                  <span className="text-sm text-slate-500">issued {ewayBill.date ? format(new Date(ewayBill.date), 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1.5 tracking-wide uppercase">Valid Until: {ewayBill.validUntil ? format(new Date(ewayBill.validUntil), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
              </div>

              <div className="space-y-5 pt-2">
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Customer / Recipient</p>
                  <p className="text-[14px] font-medium text-blue-600 hover:underline cursor-pointer">{ewayBill.customerName}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500 mb-1">Invoice Number</p>
                  <p className="text-[14px] font-medium text-slate-900">{ewayBill.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[13px] text-slate-500 mb-1">From GSTIN</p>
                    <p className="text-[14px] font-medium text-slate-900">{ewayBill.fromGSTIN}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-slate-500 mb-1">To GSTIN</p>
                    <p className="text-[14px] font-medium text-slate-900">{ewayBill.toGSTIN}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[13px] text-slate-500 mb-1">Dispatch From</p>
                    <p className="text-[14px] font-medium text-slate-900">{ewayBill.placeOfDispatch}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-slate-500 mb-1">Delivery To</p>
                    <p className="text-[14px] font-medium text-slate-900">{ewayBill.placeOfDelivery}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Info */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-6 space-y-4">
              <h3 className="text-[14px] font-bold text-slate-900 border-b border-slate-200 pb-2">Transportation Details</h3>
              <div className="grid grid-cols-1 gap-4 pt-1">
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Vehicle Number</p>
                  <p className="text-[13px] font-semibold text-slate-900">{ewayBill.vehicleNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Transporter Name</p>
                  <p className="text-[13px] font-semibold text-slate-900">{ewayBill.transporterName || '—'}</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Distance (Km)</p>
                  <p className="text-[13px] font-semibold text-slate-900">{ewayBill.distance} Km</p>
                </div>
                <div>
                  <p className="text-[12px] text-slate-500 mb-1">Transaction Type</p>
                  <p className="text-[13px] font-semibold text-slate-900">{ewayBill.transactionType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Item Details Placeholder */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <h3 className="text-[14px] font-bold text-slate-900">Consignment Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="text-left py-2 font-semibold uppercase text-[11px] tracking-wider">HSN/Description</th>
                      <th className="text-right py-2 font-semibold uppercase text-[11px] tracking-wider w-24">Qty</th>
                      <th className="text-right py-2 font-semibold uppercase text-[11px] tracking-wider w-32">Taxable Value</th>
                      <th className="text-right py-2 font-semibold uppercase text-[11px] tracking-wider w-32">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-4">
                        <p className="text-slate-900 font-medium">Consignment Items</p>
                        <p className="text-[11px] text-slate-500">Based on Invoice: {ewayBill.invoiceNumber}</p>
                      </td>
                      <td className="py-4 text-right text-slate-600">1.00</td>
                      <td className="py-4 text-right text-slate-600">{ewayBill.totalValue?.toFixed(2) || '0.00'}</td>
                      <td className="py-4 text-right text-slate-900 font-medium">{ewayBill.totalValue?.toFixed(2) || '0.00'}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-slate-50/50">
                      <td colSpan={2} className="py-3 px-3">Total Value</td>
                      <td colSpan={2} className="py-3 px-3 text-right text-indigo-600 text-base">{formatCurrency(ewayBill.totalValue || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
