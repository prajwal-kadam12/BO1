/**
 * Unified Delivery Challan PDF Component
 * Uses ONLY inline styles to ensure pixel-perfect consistency
 * between preview and downloaded PDF.
 */

import React from 'react';
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";

interface ChallanItem {
    id: string;
    name: string;
    description?: string;
    hsnSac?: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface ChallanDetail {
    id: string;
    challanNumber: string;
    referenceNumber: string;
    date: string;
    customerId: string;
    customerName: string;
    challanType: string;
    billingAddress: any;
    shippingAddress: any;
    placeOfSupply: string;
    gstin: string;
    items: ChallanItem[];
    subTotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    adjustment: number;
    total: number;
    customerNotes: string;
    termsAndConditions: string;
    status: string;
    invoiceStatus: string;
    invoiceId: string | null;
    createdAt: string;
}

function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAddress(address: any): string[] {
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
}

function getChallanTypeLabel(type: string): string {
    switch (type) {
        case 'supply_on_approval': return 'Supply on Approval';
        case 'supply_for_job_work': return 'Supply for Job Work';
        case 'supply_for_repair': return 'Supply for Repair';
        case 'removal_for_own_use': return 'Removal for Own Use';
        case 'others': return 'Others';
        default: return type || 'Others';
    }
}

export function UnifiedDeliveryChallan({
    challan,
    branding,
    organization,
    isPreview = false
}: {
    challan: ChallanDetail;
    branding?: any;
    organization?: any;
    isPreview?: boolean;
}) {
    // Fixed A4 dimensions
    const pageStyle: React.CSSProperties = {
        width: isPreview ? '100%' : '210mm',
        maxWidth: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
    };

    const containerStyle: React.CSSProperties = {
        padding: '48px',
        color: '#000000',
    };

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header Section */}
                <div style={{ marginBottom: '32px' }}>
                    <SalesPDFHeader
                        organization={organization}
                        logo={branding?.logo}
                        documentTitle="DELIVERY CHALLAN"
                        documentNumber={challan.challanNumber}
                        date={challan.date}
                    />
                </div>

                {/* Deliver To & Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '24px' }}>
                    <div>
                        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            DELIVER TO
                        </h4>
                        <p style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '16px', marginBottom: '4px', margin: '0 0 4px 0' }}>
                            {challan.customerName}
                        </p>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {formatAddress(challan.shippingAddress).map((line, i) => (
                                <p key={i} style={{ margin: '2px 0' }}>{line}</p>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Challan Date:</span>
                            <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '600' }}>
                                {formatDate(challan.date)}
                            </span>
                        </div>
                        <div>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Challan Type:</span>
                            <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '600' }}>
                                {getChallanTypeLabel(challan.challanType)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', marginBottom: '24px', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                #
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Item & Description
                            </th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                HSN/SAC
                            </th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Qty
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Rate
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {challan.items.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 12px' }}>{index + 1}</td>
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                                    {item.description && (
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                            {item.description}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    {item.hsnSac || '-'}
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                    {formatCurrency(item.rate)}
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '600' }}>
                                    {formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                    <div style={{ width: '384px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#374151', margin: '0' }}>
                                SUMMARY
                            </h4>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '14px', color: '#64748b' }}>Sub Total</span>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                    {formatCurrency(challan.subTotal)}
                                </span>
                            </div>
                            {challan.cgst > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>CGST (9%)</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {formatCurrency(challan.cgst)}
                                    </span>
                                </div>
                            )}
                            {challan.sgst > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', color: '#64748b' }}>SGST (9%)</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {formatCurrency(challan.sgst)}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #cbd5e1' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Total</span>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                                    {formatCurrency(challan.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature */}
                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                    {branding?.signature?.url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <img
                                src={branding.signature.url}
                                alt="Authorized Signature"
                                style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
                            />
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>
                                Authorized Signature
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '16px', fontFamily: 'cursive', color: '#1e293b' }}>
                                Signature
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>
                                Authorized Signature
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
