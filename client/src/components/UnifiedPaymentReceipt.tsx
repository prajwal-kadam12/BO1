/**
 * Unified PDF Receipt Component
 * This component uses ONLY inline styles to ensure pixel-perfect consistency
 * between preview and downloaded PDF. No Tailwind classes.
 */

import React from 'react';
import { useOrganization } from "@/context/OrganizationContext";
import { SalesPDFHeader } from "@/components/sales-pdf-header";

interface JournalEntry {
    account: string;
    debit: number;
    credit: number;
}

interface PaymentReceived {
    id: string;
    paymentNumber: string;
    date: string;
    referenceNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    invoices: any[];
    mode: string;
    depositTo: string;
    amount: number;
    unusedAmount: number;
    bankCharges: number;
    tax: string;
    taxAmount: number;
    notes: string;
    attachments: string[];
    sendThankYou: boolean;
    status: string;
    paymentType: string;
    placeOfSupply: string;
    descriptionOfSupply: string;
    amountInWords: string;
    journalEntries: JournalEntry[];
    createdAt: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function UnifiedPaymentReceipt({
    payment,
    branding,
    organization,
    isPreview = false
}: {
    payment: PaymentReceived;
    branding?: any;
    organization?: any;
    isPreview?: boolean;
}) {
    // Fixed A4 dimensions - SINGLE SOURCE OF TRUTH
    // In preview mode: use max-width to allow scaling
    // In download mode: use fixed width for PDF generation
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
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <SalesPDFHeader
                        organization={organization}
                        logo={branding?.logo}
                        documentTitle="PAYMENT RECEIPT"
                        documentNumber={payment.paymentNumber}
                        date={payment.date}
                    />
                </div>

                {/* Payment Details */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#4b5563' }}>Payment Date</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatDate(payment.date)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#4b5563' }}>Reference Number</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{payment.referenceNumber || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#4b5563' }}>Payment Mode</span>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{payment.mode}</span>
                    </div>
                </div>

                {/* Amount Section */}
                <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600', marginBottom: '8px', margin: '0 0 8px 0' }}>
                            Amount Received In Words
                        </p>
                        <p style={{ fontWeight: '600', color: '#0f172a', margin: '0' }}>{payment.amountInWords || 'N/A'}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                        <div style={{
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            padding: '12px 32px',
                            borderRadius: '4px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                                Amount Received
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>
                                {formatCurrency(payment.amount)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Received From */}
                <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                    <div>
                        <h4 style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#374151',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: '0 0 12px 0',
                        }}>
                            RECEIVED FROM
                        </h4>
                        <p style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', margin: '0 0 8px 0' }}>
                            {payment.customerName}
                        </p>
                        <div style={{ fontSize: '12px', color: '#4b5563' }}>
                            <p style={{ margin: '2px 0' }}>{payment.placeOfSupply || '(MH) - Maharashtra'}</p>
                            <p style={{ margin: '2px 0' }}>India</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '48px', margin: '0 0 48px 0' }}>
                                Authorized Signature
                            </p>
                            {branding?.signature?.url && (
                                <img
                                    src={branding.signature.url}
                                    alt="Signature"
                                    style={{ height: '48px', width: 'auto', display: 'block', marginLeft: 'auto' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Table */}
                {payment.invoices && payment.invoices.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#374151',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: '0 0 12px 0',
                        }}>
                            Payment For
                        </h4>
                        <table style={{
                            width: '100%',
                            fontSize: '12px',
                            borderCollapse: 'collapse',
                            border: 'none',
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #d1d5db' }}>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                    }}>
                                        Invoice Number
                                    </th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                    }}>
                                        Invoice Date
                                    </th>
                                    <th style={{
                                        textAlign: 'right',
                                        padding: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                    }}>
                                        Invoice Amount
                                    </th>
                                    <th style={{
                                        textAlign: 'right',
                                        padding: '8px',
                                        fontWeight: '600',
                                        color: '#374151',
                                    }}>
                                        Payment Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {payment.invoices.map((invoice: any, index: number) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '8px', color: '#0f172a' }}>
                                            {invoice.invoiceNumber || '-'}
                                        </td>
                                        <td style={{ padding: '8px', color: '#0f172a' }}>
                                            {invoice.date ? formatDate(invoice.date) : '-'}
                                        </td>
                                        <td style={{ padding: '8px', color: '#0f172a', textAlign: 'right' }}>
                                            {formatCurrency(invoice.amount || 0)}
                                        </td>
                                        <td style={{ padding: '8px', color: '#0f172a', textAlign: 'right' }}>
                                            {formatCurrency(invoice.paymentAmount || invoice.amount || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Over Payment */}
                {payment.unusedAmount > 0 && (
                    <div style={{
                        paddingTop: '16px',
                        borderTop: '1px solid #d1d5db',
                        textAlign: 'center',
                    }}>
                        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px', margin: '0 0 4px 0' }}>
                            Over payment
                        </p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0' }}>
                            {formatCurrency(payment.unusedAmount)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
