import { Router, Response } from 'express';
import { authenticateToken, requireRole, recordAudit, AuthenticatedRequest } from '../middleware/auth.js';
import { repository } from '../db/repository.js';
import { loadAccessibleProject } from '../middleware/projectAccess.js';
import { commercialService } from '../services/commercialService.js';

const router = Router();

// Protect all commercial routes with internal authentication
router.use(authenticateToken);

// GET /api/commercial/overview - Platform-wide commercial analytics (SUPER_ADMIN only)
router.get('/overview', requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const overview = await commercialService.getPlatformOverview();
    await recordAudit(req, 'VIEW_COMMERCIAL_OVERVIEW', 'commercial_records', 'platform', {
      totalPipeline: overview.totalQuotedPipeline,
      totalCollected: overview.totalRevenueCollected
    });
    res.json({ overview });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to retrieve commercial telemetry.' });
  }
});

// GET /api/commercial/project/:projectId - Get project commercial record and delivery clearance
router.get('/project/:projectId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const recordWithClearance = await commercialService.getCommercialRecord(projectId);
  if (!recordWithClearance) {
    // If not found, create a baseline default record
    const created = await commercialService.saveQuotation(projectId, {
      quotationAmount: 0,
      currency: 'INR',
      quotationStatus: 'draft'
    });
    const clearance = await commercialService.getCommercialClearance(created);
    res.json({ commercialRecord: created, clearance });
    return;
  }

  res.json(recordWithClearance);
});

// POST /api/commercial/project/:projectId/quotation - Create or update project quotation
router.post('/project/:projectId/quotation', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const {
    quotationNumber,
    quotationAmount,
    currency,
    quotationStatus,
    scopeItems,
    paymentTerms,
    validUntil,
    notes
  } = req.body;

  try {
    const updated = await commercialService.saveQuotation(projectId, {
      quotationNumber,
      quotationAmount,
      currency,
      quotationStatus,
      scopeItems,
      paymentTerms,
      validUntil,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'UPDATE_QUOTATION', 'commercial_records', updated.id, {
      projectId,
      quotationNumber: updated.quotationNumber,
      quotationAmount: updated.quotationAmount,
      quotationStatus: updated.quotationStatus
    });

    res.json({
      success: true,
      message: `Quotation ${updated.quotationNumber} saved with status '${updated.quotationStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update quotation.' });
  }
});

// POST /api/commercial/project/:projectId/invoice - Issue or update official invoice
router.post('/project/:projectId/invoice', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    invoiceStatus,
    notes
  } = req.body;

  try {
    const updated = await commercialService.issueInvoice(projectId, {
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceStatus,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'ISSUE_INVOICE', 'commercial_records', updated.id, {
      projectId,
      invoiceNumber: updated.invoiceNumber,
      invoiceStatus: updated.invoiceStatus
    });

    res.json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} recorded with status '${updated.invoiceStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to issue invoice.' });
  }
});

// POST /api/commercial/project/:projectId/payments - Record client payment received
router.post('/project/:projectId/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const {
    amount,
    currency,
    paymentMethod,
    transactionReference,
    notes
  } = req.body;

  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid payment amount greater than zero is required.' });
    return;
  }

  if (!paymentMethod) {
    res.status(400).json({ error: 'Payment method is required (e.g. bank_transfer, upi, cheque, card, cash).' });
    return;
  }

  try {
    const adminId = req.user?.id || 'usr_admin_01';
    const updated = await commercialService.recordPayment(projectId, adminId, {
      amount: Number(amount),
      currency,
      paymentMethod,
      transactionReference,
      notes
    });

    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'RECORD_PAYMENT', 'commercial_transactions', projectId, {
      amount: Number(amount),
      paymentMethod,
      transactionReference,
      totalPaidSoFar: updated.amountPaid,
      paymentStatus: updated.paymentStatus
    });

    res.json({
      success: true,
      message: `Payment of ${updated.currency} ${amount} logged successfully. Total paid: ${updated.currency} ${updated.amountPaid}. Status: ${updated.paymentStatus}.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to record payment.' });
  }
});

// PATCH /api/commercial/project/:projectId/status - Update overall commercial lifecycle status
router.patch('/project/:projectId/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId);
  const project = await loadAccessibleProject(req, res, projectId, 'Client project not found.');
  if (!project) return;

  const { commercialStatus, notes } = req.body;
  if (!commercialStatus) {
    res.status(400).json({ error: 'commercialStatus is required (proposal_stage, negotiation, contract_signed, completed, on_hold).' });
    return;
  }

  try {
    const updated = await commercialService.updateCommercialStatus(projectId, commercialStatus, notes);
    const clearance = await commercialService.getCommercialClearance(updated);

    await recordAudit(req, 'UPDATE_COMMERCIAL_STATUS', 'commercial_records', updated.id, {
      projectId,
      commercialStatus: updated.commercialStatus,
      notes
    });

    res.json({
      success: true,
      message: `Commercial status updated to '${updated.commercialStatus}'.`,
      commercialRecord: updated,
      clearance
    });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update commercial status.' });
  }
});

export default router;
