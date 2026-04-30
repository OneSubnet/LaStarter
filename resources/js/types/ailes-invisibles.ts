// =============================================================================
// Ailes Invisibles - Shared Types
// =============================================================================
// Centralized type definitions for the ailes-invisibles module.
// Merged from all admin/ and portal/ page files to eliminate duplication.
// =============================================================================

// -----------------------------------------------------------------------------
// Entity Types
// -----------------------------------------------------------------------------

export type Client = {
    id: number;
    type: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    vat_number: string | null;
    vat_country: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
    status: string;
    slug: string;
    has_portal: boolean;
    quotes_count: number;
    invoices_count: number;
    created_at: string;
};

export type ClientSummary = {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string | null;
};

export type QuoteClient = {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string | null;
    email: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string;
};

export type Product = {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    type: string;
    price: number;
    unit: string;
    category: string | null;
    tax_rate: number;
    sku: string | null;
    reference: string | null;
    stock: number | null;
    stock_alert: number | null;
    is_active: boolean;
};

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    products_count: number;
};

export type Invoice = {
    id: number;
    invoice_number: string;
    client_id: number;
    client_name: string;
    status: string;
    subtotal: number;
    tax_total: number;
    total: number;
    paid_amount: number;
    issue_date: string;
    due_date: string;
    notes: string | null;
};

export type InvoiceLine = {
    id: number;
    product_id: number | null;
    product: { id: number; name: string } | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
    sort_order: number;
};

export type Payment = {
    id: number;
    amount: number;
    method: string;
    paid_at: string;
    reference: string | null;
    notes: string | null;
};

export type Quote = {
    id: number;
    quote_number: string;
    status: string;
    subject: string | null;
    notes: string | null;
    valid_until: string | null;
    subtotal: number;
    tax_amount: number;
    total: number;
    client: QuoteClient | null;
    event: EventSummary | null;
    lines: QuoteLine[];
    has_invoice: boolean;
    created_at: string;
    updated_at: string;
};

export type QuoteLine = {
    id: number;
    product_id: number | null;
    product: { id: number; name: string } | null;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
    sort_order: number;
};

export type Event = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    type: string;
    status: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    client: ClientSummary | null;
    quotes: QuoteSummary[];
    invoices: InvoiceSummary[];
    created_at: string;
    updated_at: string;
};

export type EventSummary = {
    id: number;
    title: string;
};

export type Document = {
    id: number;
    title: string;
    client_name: string;
    file_type: string | null;
    file_size: number;
    category: string | null;
    status: string;
    requires_signature: boolean;
    instructions: string | null;
    has_signed_file: boolean;
    signed_uploaded_at: string | null;
    created_at: string;
};

export type Conversation = {
    id: number;
    title: string | null;
    type: string;
    participants: Participant[];
    archived_at: string | null;
    last_message_at: string | null;
    created_at: string;
};

export type Message = {
    id: number;
    sender_name: string;
    content: string;
    created_at: string;
    is_mine: boolean;
};

export type Participant = {
    type: string;
    id: number;
    name: string;
};

export type JournalEntry = {
    id: number;
    date: string;
    description: string;
    reference: string;
    debit: number;
    credit: number;
};

export type JournalEntryLine = {
    date: string;
    description: string | null;
    account_name: string;
    debit: number;
    credit: number;
    reference_type: string | null;
    reference_id: number | null;
};

export type MonthlyRevenue = {
    month: string;
    revenue: number;
};

// -----------------------------------------------------------------------------
// Summary / Minimal Types (used in lists and relations)
// -----------------------------------------------------------------------------

export type QuoteSummary = {
    id: number;
    quote_number: string;
    status: string;
    total: number;
};

export type InvoiceSummary = {
    id: number;
    invoice_number: string;
    status: string;
    total: number;
};

// Portal-specific conversation types
export type PortalConversation = {
    id: number;
    title: string | null;
    type: string;
    last_message_at: string | null;
    created_at: string;
};

export type PortalConversationParticipant = {
    id: number;
    participant_type: string;
    participant_id: number;
    role: string;
};

export type PortalConversationDetail = {
    id: number;
    title: string | null;
    type: string;
    last_message_at: string | null;
    participants: PortalConversationParticipant[];
};

export type PortalMessageEncryptedKey = {
    id: number;
    participant_type: string;
    participant_id: number;
    encrypted_key: string;
};

export type PortalMessage = {
    id: number;
    sender_type: string;
    sender_id: number;
    encrypted_content: string;
    iv: string;
    type: string;
    encrypted_keys: PortalMessageEncryptedKey[];
    created_at: string;
};

// Portal-specific invoice type
export type PortalInvoice = {
    id: number;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    total: number;
    paid_amount: number;
    status: string;
    has_file: boolean;
};

// Portal-specific quote type
export type PortalQuote = {
    id: number;
    quote_number: string;
    subject: string | null;
    total: number;
    status: string;
    valid_until: string | null;
    has_file: boolean;
    created_at: string;
};

// Portal-specific document type
export type PortalDocument = {
    id: number;
    title: string;
    file_type: string | null;
    file_size: number;
    category: string | null;
    status: string;
    requires_signature: boolean;
    instructions: string | null;
    has_signed_file: boolean;
    signed_uploaded_at: string | null;
    expires_at: string | null;
    created_at: string;
};

// Portal client info (from dashboard/profile)
export type PortalClient = {
    first_name: string;
    last_name: string;
    company_name: string | null;
    email: string;
    phone: string | null;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
};

// -----------------------------------------------------------------------------
// Status Badge Configs (Types)
// -----------------------------------------------------------------------------

export type StatusConfig = Record<string, { label: string; className: string }>;

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------

export { formatCurrency } from '@/lib/format';

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
return '0 B';
}

    const mb = bytes / 1024 / 1024;

    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }

    const kb = bytes / 1024;

    return `${kb.toFixed(1)} KB`;
};

// -----------------------------------------------------------------------------
// Inbox Overhaul Types
// -----------------------------------------------------------------------------

export type ConversationInboxItem = {
    id: number;
    title: string | null;
    type: string;
    archived_at: string | null;
    last_message_at: string | null;
    created_at: string;
    unread_count: number;
    last_message: {
        sender_type: string;
        type: string;
        created_at: string;
    } | null;
    participants: {
        id: number;
        participant_type: string;
        participant_id: number;
        role: string;
        name: string;
        company_name: string | null;
    }[];
};

export type ConversationDetail = {
    id: number;
    title: string | null;
    type: string;
    archived_at: string | null;
    last_message_at: string | null;
    participants: {
        id: number;
        participant_type: string;
        participant_id: number;
        role: string;
        joined_at: string;
        name: string;
        company_name: string | null;
    }[];
    messages: MessageDetail[];
    audit_logs: AuditLogEntry[];
};

export type MessageDetail = {
    id: number;
    sender_type: string;
    sender_id: number;
    sender_name: string;
    encrypted_content: string;
    content?: string;
    iv: string;
    type: string;
    file_name: string | null;
    file_size: number | null;
    is_mine: boolean;
    encrypted_keys: { participant_type: string; participant_id: number; encrypted_key: string }[];
    read_receipts: { reader_type: string; reader_id: number; read_at: string }[];
    created_at: string;
};

export type AuditLogEntry = {
    id: number;
    event: string;
    actor_name: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
};

export type InboxCounts = {
    active: number;
    archived: number;
    unassigned: number;
};
