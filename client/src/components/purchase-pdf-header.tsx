import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { useOrganization } from "@/context/OrganizationContext";
import { useBranding } from "@/hooks/use-branding";

interface PurchasePDFHeaderProps {
  logo?: { url?: string | null };
  documentTitle: string;
  documentNumber: string;
  date: string;
  referenceNumber?: string;
  organization?: Organization;
}

export function PurchasePDFHeader({
  logo,
  documentTitle,
  documentNumber,
  date,
  referenceNumber,
  organization,
}: PurchasePDFHeaderProps) {
  // Use context for organization and branding if not provided
  const { currentOrganization } = useOrganization();
  const { data: branding } = useBranding();

  // Use provided organization or fallback to current organization
  const org = organization || currentOrganization;
  // Use provided logo or fallback to branding logo
  const logoToUse = logo?.url ? logo : branding?.logo;

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Build full address
  const getFullAddress = (org?: Organization): string[] => {
    if (!org) return [];
    const parts = [];
    if (org.street1) parts.push(org.street1);
    if (org.street2) parts.push(org.street2);
    if (org.city) parts.push(org.city);
    if (org.state) parts.push(org.state);
    if (org.postalCode) parts.push(org.postalCode);
    return parts;
  };

  const addressParts = getFullAddress(org);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
      {/* Left Section: Logo and Company Info */}
      <div style={{ flex: 1 }}>
        {/* Logo */}
        {logoToUse?.url ? (
          <img
            src={logoToUse.url}
            alt="Company Logo"
            style={{ height: '50px', width: 'auto', marginBottom: '12px', objectFit: 'contain' }}
          />
        ) : null}

        {/* Company Details */}
        <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#334155' }}>
          {/* Company Name */}
          {org?.name && (
            <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
              {org.name}
            </p>
          )}

          {/* Full Address */}
          {addressParts.length > 0 && (
            <>
              {addressParts.map((part, idx) => (
                <p key={idx} style={{ margin: '0 0 2px 0' }}>
                  {part}
                </p>
              ))}
            </>
          )}

          {/* Email */}
          {org?.email && (
            <p style={{ margin: '2px 0', color: '#475569' }}>
              {org.email}
            </p>
          )}

          {/* Website */}
          {org?.website && (
            <p style={{ margin: '2px 0', color: '#475569' }}>
              {org.website}
            </p>
          )}

          {/* GSTIN */}
          {org?.gstin && (
            <p style={{ margin: '2px 0', fontWeight: '500', color: '#0f172a' }}>
              GSTIN {org.gstin}
            </p>
          )}
        </div>
      </div>

      {/* Right Section: Document Info */}
      <div style={{ textAlign: 'right', minWidth: '250px' }}>
        {/* Document Title */}
        <h2
          style={{
            fontSize: '28px',
            color: '#991b1b',
            margin: '0 0 10px 0',
            fontWeight: 'normal',
            letterSpacing: '-0.5px',
          }}
        >
          {documentTitle}
        </h2>

        {/* Document Number */}
        <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: '#334155' }}>
          # {documentNumber}
        </p>

        {/* Date and Reference */}
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Date :</span>
            <span style={{ minWidth: '120px', textAlign: 'right', color: '#0f172a' }}>
              {formatDate(date)}
            </span>
          </div>
          {referenceNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ref# :</span>
              <span style={{ minWidth: '120px', textAlign: 'right', color: '#0f172a' }}>
                {referenceNumber}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
