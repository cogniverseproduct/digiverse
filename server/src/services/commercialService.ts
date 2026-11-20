
import { randomUUID } from 'node:crypto';
import { repository } from '../db/repository.js';
import {
  CommercialRecord,
  CommercialScopeItem,
  CommercialTransaction,
  PlatformCommercialOverview
} from '../types/index.js';

export interface CommercialClearanceResult {
  isClearedForDelivery: boolean;
  clearanceStatus: 'cleared' | 'advance_cleared' | 'payment_pending' | 'on_hold';
  clearanceMessage: string;
}

const VALID_QUOTATION_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'declined'
] as const;

const VALID_PAYMENT_METHODS = [
  'bank_transfer',
  'upi',
  'cheque',
  'card',
  'cash',
  'other'
] as const;

const VALID_COMMERCIAL_STATUSES = [
  'proposal_stage',
  'negotiation',
  'contract_signed',
  'completed',
  'on_hold'
] as const;

const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

async function validateProjectId(projectId: string): Promise<void> {
  if (
    typeof projectId !== 'string' ||
    !projectId.trim() ||
    projectId.length > 128
  ) {
    throw new Error('A valid project ID is required.');
  }

  if (!await repository.getProjectById(projectId)) {
    throw new Error('Project not found.');
  }
}

function validateText(
  value: unknown,
  field: string,
  maxLength: number,
  optional = false
): string | undefined {
  if (value === undefined || value === null) {
    if (optional) return undefined;
    throw new Error(`${field} is required.`);
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string.`);
  }

  const result = value.trim();

  if (!result && !optional) {
    throw new Error(`${field} is required.`);
  }

  if (result.length > maxLength) {
    throw new Error(`${field} must not exceed ${maxLength} characters.`);
  }

  return result || undefined;
}

function validateAmount(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1_000_000_000_000
  ) {
    throw new Error(`${field} must be a valid non-negative amount.`);
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateCurrency(value?: string): string {
  const currency = (value || 'INR').trim().toUpperCase();

  if (!(VALID_CURRENCIES as readonly string[]).includes(currency)) {
    throw new Error('Unsupported currency.');
  }

  return currency;
}

function validateDate(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a valid date.`);
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error(`${field} must be a valid date.`);
  }

  return new Date(timestamp).toISOString();
}

function calculatePaymentStatus(
  amountPaid: number,
  quotationAmount: number
): CommercialRecord['paymentStatus'] {
  if (quotationAmount > 0 && amountPaid >= quotationAmount) {
    return 'fully_paid';
  }

  if (amountPaid > 0) {
    return 'advance_paid';
  }

  return quotationAmount > 0 ? 'quotation_sent' : 'unquoted';
}

export const commercialService = {
  async getCommercialClearance(
    record: CommercialRecord | null
  ): Promise<CommercialClearanceResult> {
    if (!record) {
      return {
        isClearedForDelivery: false,
        clearanceStatus: 'payment_pending',
        clearanceMessage: 'No commercial record established for this project.'
      };
    }

    if (record.commercialStatus === 'on_hold') {
      return {
        isClearedForDelivery: false,
        clearanceStatus: 'on_hold',
        clearanceMessage: 'Commercial clearance suspended: Project is currently on hold.'
      };
    }

    if (
      record.paymentStatus === 'fully_paid' &&
      record.quotationAmount > 0 &&
      record.amountPaid >= record.quotationAmount
    ) {
      return {
        isClearedForDelivery: true,
        clearanceStatus: 'cleared',
        clearanceMessage: 'Commercially cleared: Full payment has been recorded.'
      };
    }

    if (record.paymentStatus === 'advance_paid') {
      return {
        isClearedForDelivery: true,
        clearanceStatus: 'advance_cleared',
        clearanceMessage: 'Advance payment received. Delivery clearance granted.'
      };
    }

    return {
      isClearedForDelivery: false,
      clearanceStatus: 'payment_pending',
      clearanceMessage: 'Commercial clearance pending: Full payment is required prior to live deployment.'
    };
  },

  async generateQuotationNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const shortHash = projectId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-4)
      .toUpperCase();

    return `QUO-${year}-${shortHash || '001'}`;
  },

  async generateInvoiceNumber(projectId: string): Promise<string> {
    const year = new Date().getFullYear();
    const shortHash = projectId
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-4)
      .toUpperCase();

    return `INV-${year}-${shortHash || '001'}`;
  },

  async getCommercialRecord(projectId: string): Promise<{
    commercialRecord: CommercialRecord;
    clearance: CommercialClearanceResult;
  } | null> {
    await validateProjectId(projectId);

    const record = await repository.getCommercialRecord(projectId);

    if (!record) return null;

    return {
      commercialRecord: record,
      clearance: await this.getCommercialClearance(record)
    };
  },

  async saveQuotation(
    projectId: string,
    payload: {
      quotationNumber?: string;
      quotationAmount?: number;
      currency?: string;
      quotationStatus?: 'draft' | 'sent' | 'accepted' | 'declined';
      scopeItems?: CommercialScopeItem[];
      paymentTerms?: string;
      validUntil?: string;
      notes?: string;
    }
  ): Promise<CommercialRecord> {
    await validateProjectId(projectId);

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid quotation payload.');
    }

    const existing = await repository.getCommercialRecord(projectId);
    const now = new Date().toISOString();

    let computedAmount = payload.quotationAmount;

    if (payload.scopeItems !== undefined) {
      if (!Array.isArray(payload.scopeItems) || payload.scopeItems.length > 100) {
        throw new Error('Quotation scope must contain no more than 100 items.');
      }

      computedAmount = payload.scopeItems.reduce((total, item) => {
        if (
          !item ||
          typeof item.quantity !== 'number' ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          typeof item.unitPrice !== 'number' ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0
        ) {
          throw new Error('Invalid quotation scope item.');
        }

        return total + item.quantity * item.unitPrice;
      }, 0);
    }

    const quotationAmount = validateAmount(
      computedAmount ?? existing?.quotationAmount ?? 0,
      'Quotation amount'
    );

    const currency = validateCurrency(
      payload.currency || existing?.currency
    );

    const quotationStatus = payload.quotationStatus ||
      existing?.quotationStatus ||
      'draft';

    if (
      !(VALID_QUOTATION_STATUSES as readonly string[]).includes(quotationStatus)
    ) {
      throw new Error('Invalid quotation status.');
    }

    // Prevent changing an accepted quotation without a separate revision/approval flow.
    if (
      existing?.quotationStatus === 'accepted' &&
      (
        quotationAmount !== existing.quotationAmount ||
        currency !== existing.currency ||
        (payload.quotationStatus && payload.quotationStatus !== 'accepted')
      )
    ) {
      throw new Error('An accepted quotation cannot be modified directly. Create a revised quotation and obtain approval.');
    }

    const quotationNumber = validateText(
      payload.quotationNumber || existing?.quotationNumber ||
        await this.generateQuotationNumber(projectId),
      'Quotation number',
      80
    )!;

    const paymentTerms = payload.paymentTerms !== undefined
      ? validateText(payload.paymentTerms, 'Payment terms', 2000, true)
      : existing?.paymentTerms ||
        '50% advance on signoff, 50% upon final client approval prior to publishing';

    const notes = payload.notes !== undefined
      ? validateText(payload.notes, 'Notes', 4000, true)
      : existing?.notes;

    const validUntil = validateDate(
      payload.validUntil || existing?.validUntil,
      'Quotation validity date'
    ) || new Date(Date.now() + 30 * 86400000).toISOString();

    const amountPaid = existing?.amountPaid || 0;

    if (amountPaid > quotationAmount && quotationAmount > 0) {
      throw new Error('Quotation amount cannot be lower than payments already recorded.');
    }

    const commercialStatus =
      quotationStatus === 'accepted' &&
      (!existing || existing.commercialStatus === 'proposal_stage')
        ? 'contract_signed'
        : existing?.commercialStatus || 'proposal_stage';

    const updatedRecord: CommercialRecord = {
      id: existing?.id || `comm_${randomUUID()}`,
      projectId,
      quotationNumber,
      quotationAmount,
      currency,
      quotationStatus,
      scopeItems: payload.scopeItems || existing?.scopeItems || [],
      paymentTerms,
      validUntil,
      paymentStatus: calculatePaymentStatus(amountPaid, quotationAmount),
      invoiceNumber: existing?.invoiceNumber,
      invoiceDate: existing?.invoiceDate,
      dueDate: existing?.dueDate,
      invoiceStatus: existing?.invoiceStatus || 'unissued',
      amountPaid,
      paymentMethod: existing?.paymentMethod,
      paymentReference: existing?.paymentReference,
      paymentDate: existing?.paymentDate,
      commercialStatus,
      notes,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      transactions: existing?.transactions || []
    };

    await repository.saveCommercialRecord(updatedRecord);

    return await repository.getCommercialRecord(projectId) || updatedRecord;
  },

  async issueInvoice(
    projectId: string,
    payload: {
      invoiceNumber?: string;
      invoiceDate?: string;
      dueDate?: string;
      invoiceStatus?: 'unissued' | 'issued' | 'paid' | 'overdue' | 'cancelled';
      notes?: string;
    }
  ): Promise<CommercialRecord> {
    await validateProjectId(projectId);

    const existing = await repository.getCommercialRecord(projectId);

    if (!existing) {
      throw new Error('Cannot issue invoice: Commercial record not found.');
    }

    if (existing.quotationStatus !== 'accepted') {
      throw new Error('An invoice can only be issued against an accepted quotation.');
    }

    if (existing.quotationAmount <= 0) {
      throw new Error('A valid quotation amount is required before invoicing.');
    }

    if (existing.invoiceStatus === 'cancelled') {
      throw new Error('A cancelled invoice cannot be modified. Issue a new invoice through a separate process.');
    }

    if (
      payload.invoiceStatus &&
      !['issued', 'overdue'].includes(payload.invoiceStatus)
    ) {
      throw new Error('Invoice status can only be set to issued or overdue through this operation.');
    }

    const now = new Date().toISOString();

    const invoiceNumber = validateText(
      payload.invoiceNumber || existing.invoiceNumber ||
        await this.generateInvoiceNumber(projectId),
      'Invoice number',
      80
    )!;

    const invoiceDate = validateDate(
      payload.invoiceDate || existing.invoiceDate || now,
      'Invoice date'
    )!;

    const dueDate = validateDate(
      payload.dueDate || existing.dueDate ||
        new Date(Date.now() + 14 * 86400000).toISOString(),
      'Due date'
    )!;

    if (Date.parse(dueDate) < Date.parse(invoiceDate)) {
      throw new Error('Invoice due date cannot be earlier than invoice date.');
    }

    const invoiceStatus =
      existing.amountPaid >= existing.quotationAmount
        ? 'paid'
        : payload.invoiceStatus || 'issued';

    const updatedRecord: CommercialRecord = {
      ...existing,
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceStatus,
      notes: payload.notes !== undefined
        ? validateText(payload.notes, 'Notes', 4000, true)
        : existing.notes,
      updatedAt: now
    };

    await repository.saveCommercialRecord(updatedRecord);

    return await repository.getCommercialRecord(projectId) || updatedRecord;
  },

  async recordPayment(
    projectId: string,
    adminId: string,
    payload: {
      amount: number;
      currency?: string;
      paymentMethod: 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'cash' | 'other';
      transactionReference?: string;
      notes?: string;
    }
  ): Promise<CommercialRecord> {
    await validateProjectId(projectId);

    if (!adminId || !adminId.trim()) {
      throw new Error('Authenticated Admin ID is required.');
    }

    const existing = await repository.getCommercialRecord(projectId);

    if (!existing) {
      throw new Error('Cannot record payment: Commercial record not found.');
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payment payload.');
    }

    const amount = validateAmount(payload.amount, 'Payment amount');

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const currency = validateCurrency(payload.currency || existing.currency);

    if (currency !== existing.currency) {
      throw new Error('Payment currency must match the quotation currency.');
    }

    if (
      !(VALID_PAYMENT_METHODS as readonly string[]).includes(payload.paymentMethod)
    ) {
      throw new Error('Invalid payment method.');
    }

    if (existing.quotationAmount <= 0) {
      throw new Error('A valid quotation must exist before recording a payment.');
    }

    const transactionReference = validateText(
      payload.transactionReference,
      'Transaction reference',
      150,
      true
    );

    const notes = validateText(payload.notes, 'Payment notes', 2000, true);

    const now = new Date().toISOString();

    const newTx: CommercialTransaction = {
      id: `tx_${randomUUID()}`,
      commercialRecordId: existing.id,
      projectId,
      amount,
      currency,
      paymentMethod: payload.paymentMethod,
      transactionReference,
      recordedByAdminId: adminId,
      notes,
      createdAt: now
    };

    // NOTE: Transaction insert + commercial record update must be wrapped
    // in one SQLite transaction in the repository/database layer.
    await repository.createCommercialTransaction(newTx);

    const allTransactions = await repository.getCommercialTransactions(projectId);

    const newTotalPaid = allTransactions.reduce((total, tx) => {
      if (tx.currency !== existing.currency) {
        throw new Error('Mixed currencies detected in payment history.');
      }
      return total + tx.amount;
    }, 0);

    if (newTotalPaid > existing.quotationAmount) {
      throw new Error('Recorded payments exceed the accepted quotation amount.');
    }

    const paymentStatus = calculatePaymentStatus(
      newTotalPaid,
      existing.quotationAmount
    );

    const invoiceStatus =
      paymentStatus === 'fully_paid' && existing.invoiceStatus === 'issued'
        ? 'paid'
        : existing.invoiceStatus;

    const updatedRecord: CommercialRecord = {
      ...existing,
      amountPaid: newTotalPaid,
      paymentStatus,
      invoiceStatus,
      paymentMethod: payload.paymentMethod,
      paymentReference: transactionReference || existing.paymentReference,
      paymentDate: now,
      updatedAt: now
    };

    await repository.saveCommercialRecord(updatedRecord);

    return await repository.getCommercialRecord(projectId) || updatedRecord;
  },

  async updateCommercialStatus(
    projectId: string,
    status: 'proposal_stage' | 'negotiation' | 'contract_signed' | 'completed' | 'on_hold',
    notes?: string
  ): Promise<CommercialRecord> {
    await validateProjectId(projectId);

    const existing = await repository.getCommercialRecord(projectId);

    if (!existing) {
      throw new Error('Commercial record not found.');
    }

    if (
      !(VALID_COMMERCIAL_STATUSES as readonly string[]).includes(status)
    ) {
      throw new Error('Invalid commercial status.');
    }

    const safeNotes = notes !== undefined
      ? validateText(notes, 'Notes', 4000, true)
      : existing.notes;

    if (
      status === 'contract_signed' &&
      existing.quotationStatus !== 'accepted'
    ) {
      throw new Error('A quotation must be accepted before marking the contract as signed.');
    }

    const now = new Date().toISOString();

    const updatedRecord: CommercialRecord = {
      ...existing,
      commercialStatus: status,
      notes: safeNotes,
      updatedAt: now
    };

    await repository.saveCommercialRecord(updatedRecord);

    return await repository.getCommercialRecord(projectId) || updatedRecord;
  },

  async getPlatformOverview(): Promise<PlatformCommercialOverview> {
    return await repository.getPlatformCommercialOverview();
  }
};
