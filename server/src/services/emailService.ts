/**
 * DigiVerse Email Notification Service
 *
 * Dispatches transactional notifications for:
 * - New Admin Access Request alert to the DigiVerse owner mailboxes
 *   (primary + secondary official addresses, see getPlatformEmails()).
 * - Admin Setup link dispatch to applicant.
 * - Password Reset link dispatch to Admin.
 * - Approval / Rejection alerts.
 *
 * Delivery is honest:
 * - SMTP not configured -> SIMULATED_NO_SMTP (the message is only logged).
 * - SMTP configured and the server accepted the message -> SENT.
 * - SMTP configured but sending failed -> FAILED (never thrown into callers).
 * "SENT" means the SMTP server accepted the message, not that it was read.
 *
 * Configuration (no secrets are stored in code): SMTP_HOST, SMTP_PORT,
 * SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_REPLY_TO. See server/.env.example.
 */

import nodemailer from 'nodemailer';
import { getMailConfig, getPlatformEmails, isVercelDeployment, type MailConfig } from '../config.js';

export interface EmailDispatchResult {
  dispatched: boolean;
  recipient: string;
  subject: string;
  status: 'SENT' | 'SIMULATED_NO_SMTP' | 'FAILED';
  error?: string;
}

interface OutgoingMessage {
  to: string;
  cc?: string;
  subject: string;
  text: string;
}

type MailTransport = { sendMail(message: Record<string, unknown>): Promise<unknown> };
type TransportFactory = (config: MailConfig) => MailTransport;

const defaultTransportFactory: TransportFactory = (config) =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass }
  });

let transportFactory: TransportFactory = defaultTransportFactory;

/** Test hook: replace the SMTP transport (pass null to restore the real one). */
export function setMailTransportFactoryForTests(factory: TransportFactory | null): void {
  transportFactory = factory ?? defaultTransportFactory;
}

async function dispatch(message: OutgoingMessage): Promise<EmailDispatchResult> {
  const config = getMailConfig();
  const base = { recipient: message.to, subject: message.subject };

  if (!config) {
    if (isVercelDeployment()) {
      // Deployment logs are retained and shared with the team: never write single-use setup/reset links there.
      console.log(`[Email Service] SMTP is not configured; "${message.subject}" to ${message.to} was NOT sent (body not logged).`);
    } else {
      // Local development without SMTP: the body (which may hold single-use links) is logged for the operator only.
      console.log(`[Email Service] Logging (No SMTP) message to ${message.to}:`);
      console.log(`Subject: ${message.subject}\n${message.text}`);
    }
    return { ...base, dispatched: false, status: 'SIMULATED_NO_SMTP' };
  }

  try {
    await transportFactory(config).sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: message.to,
      cc: message.cc,
      subject: message.subject,
      text: message.text
    });
    console.log(`[Email Service] Sent "${message.subject}" to ${message.to}.`);
    return { ...base, dispatched: true, status: 'SENT' };
  } catch (error) {
    // Never log the SMTP credentials, even if a transport error message happens to echo them.
    let reason = error instanceof Error ? error.message : String(error);
    for (const secret of [config.pass, config.user]) {
      if (secret) reason = reason.split(secret).join('[redacted]');
    }
    console.error(`[Email Service] Sending to ${message.to} failed: ${reason.slice(0, 200)}`);
    return { ...base, dispatched: false, status: 'FAILED', error: 'The mail server did not accept the message.' };
  }
}

export const emailService = {
  /** Primary official address: where owner notifications are addressed. */
  getSuperAdminEmail(): string {
    return getPlatformEmails().primary;
  },

  isSmtpConfigured(): boolean {
    return getMailConfig() !== null;
  },

  async notifySuperAdminNewAccessRequest(
    applicantName: string,
    applicantEmail: string,
    reason?: string
  ): Promise<EmailDispatchResult> {
    const { primary, secondary } = getPlatformEmails();
    return dispatch({
      to: primary,
      cc: secondary === primary ? undefined : secondary,
      subject: `[DigiVerse Platform Alert] New Admin Access Request: ${applicantName}`,
      text: [
        `New Admin Access Request received:`,
        `Applicant Name: ${applicantName}`,
        `Applicant Email: ${applicantEmail}`,
        `Reason: ${reason || 'None provided'}`,
        `Please review and approve or reject this request inside the DigiVerse Super Admin Dashboard.`
      ].join('\n')
    });
  },

  async sendAdminSetupLink(
    applicantEmail: string,
    applicantName: string,
    setupLink: string
  ): Promise<EmailDispatchResult> {
    return dispatch({
      to: applicantEmail,
      subject: `[DigiVerse Staff] Welcome to DigiVerse - Complete Your Admin Account Setup`,
      text: [
        `Hello ${applicantName},`,
        `Your Admin access request has been approved by the DigiVerse Super Admin.`,
        `Please open the following link to establish your username and create your own private password:`,
        `${setupLink}`,
        `Note: This setup link is single-use and will expire in 48 hours.`
      ].join('\n')
    });
  },

  async sendPasswordResetLink(
    adminEmail: string,
    adminUsername: string,
    resetLink: string
  ): Promise<EmailDispatchResult> {
    return dispatch({
      to: adminEmail,
      subject: `[DigiVerse Staff] Password Reset Request Approved`,
      text: [
        `Hello ${adminUsername},`,
        `Your password reset request has been approved by the DigiVerse Super Admin.`,
        `Please open the following link to choose your new password:`,
        `${resetLink}`,
        `Note: This reset link is single-use and will expire in 24 hours.`
      ].join('\n')
    });
  },

  async notifyRequestRejection(
    email: string,
    type: 'ACCESS_REQUEST' | 'PASSWORD_RESET',
    reason?: string
  ): Promise<EmailDispatchResult> {
    return dispatch({
      to: email,
      subject: type === 'ACCESS_REQUEST'
        ? `[DigiVerse Staff] Admin Access Request Update`
        : `[DigiVerse Staff] Password Reset Request Update`,
      text: [
        `Your ${type === 'ACCESS_REQUEST' ? 'Admin access request' : 'password reset request'} has been reviewed and was not approved at this time.`,
        reason ? `Reason: ${reason}` : ''
      ].filter(Boolean).join('\n')
    });
  }
};
