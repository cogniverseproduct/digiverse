import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, normalizeEmail } from '../../src/utils/email.js';
import { getPlatformEmails, getMailConfig } from '../../src/config.js';
import { emailService, setMailTransportFactoryForTests } from '../../src/services/emailService.js';

const ACCEPT = [
  'contact@cogniverse.co.in',
  'mrk@cogniverse.co.in',
  'user@gmail.com',
  'user@outlook.com',
  'user@company.co.in',
  'user@company.com',
  'team@charity.org',
  'ops@carrier.net',
  'first.last+tag@sub.domain.example.io',
  'USER@Gmail.COM',
  '  padded@company.com  ',
  'a@b.co',
  "o'brien@company.ie"
];

const REJECT: Array<[string, unknown]> = [
  ['empty', ''],
  ['whitespace only', '   '],
  ['no at sign', 'plainaddress'],
  ['no local part', '@company.com'],
  ['no domain', 'user@'],
  ['no TLD', 'user@company'],
  ['single-letter TLD', 'user@company.c'],
  ['numeric TLD', 'user@company.123'],
  ['two at signs', 'a@b@company.com'],
  ['space inside', 'us er@company.com'],
  ['consecutive dots in local', 'a..b@company.com'],
  ['leading dot in local', '.a@company.com'],
  ['trailing dot in local', 'a.@company.com'],
  ['consecutive dots in domain', 'a@company..com'],
  ['leading hyphen label', 'a@-company.com'],
  ['trailing hyphen label', 'a@company-.com'],
  ['trailing dot domain', 'a@company.com.'],
  ['angle brackets', '<script>@company.com'],
  ['injection attempt', 'a@company.com\r\nBcc: x@y.com'],
  ['display name form', 'Name <a@company.com>'],
  ['over 254 characters', `${'a'.repeat(250)}@x.com`],
  ['local part over 64', `${'a'.repeat(65)}@company.com`],
  ['null', null],
  ['number', 42],
  ['object', {}]
];

describe('email validation (syntax only, any provider)', () => {
  for (const address of ACCEPT) {
    test(`accepts ${address.trim()}`, () => {
      assert.equal(isValidEmail(address), true);
    });
  }

  for (const [label, address] of REJECT) {
    test(`rejects ${label}`, () => {
      assert.equal(isValidEmail(address), false);
    });
  }

  test('normalizeEmail trims and lower-cases, and returns empty for non-strings', () => {
    assert.equal(normalizeEmail('  Contact@CogniVerse.CO.in '), 'contact@cogniverse.co.in');
    assert.equal(normalizeEmail(undefined), '');
    assert.equal(normalizeEmail(7), '');
  });

  test('there is no provider allow-list: only syntax decides', () => {
    for (const domain of ['gmail.com', 'yahoo.com', 'proton.me', 'cogniverse.co.in', 'xn--bcher-kva.example']) {
      assert.equal(isValidEmail(`someone@${domain}`), true, domain);
    }
  });
});

describe('official addresses and mail configuration', () => {
  const saved = { ...process.env };
  afterEach(() => {
    for (const key of ['PLATFORM_PRIMARY_EMAIL', 'PLATFORM_SECONDARY_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_REPLY_TO']) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
    setMailTransportFactoryForTests(null);
  });

  function clearMailEnv() {
    for (const key of ['PLATFORM_PRIMARY_EMAIL', 'PLATFORM_SECONDARY_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_REPLY_TO']) delete process.env[key];
  }

  test('defaults are the two official addresses', () => {
    clearMailEnv();
    assert.deepEqual(getPlatformEmails(), { primary: 'contact@cogniverse.co.in', secondary: 'mrk@cogniverse.co.in' });
  });

  test('overrides are honoured but an invalid override falls back to the default', () => {
    clearMailEnv();
    process.env.PLATFORM_PRIMARY_EMAIL = 'Hello@Example.org';
    process.env.PLATFORM_SECONDARY_EMAIL = 'not-an-email';
    assert.deepEqual(getPlatformEmails(), { primary: 'hello@example.org', secondary: 'mrk@cogniverse.co.in' });
  });

  test('SMTP is only "configured" when host, user and password are all present', () => {
    clearMailEnv();
    assert.equal(getMailConfig(), null);
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_USER = 'u';
    assert.equal(getMailConfig(), null);
    process.env.SMTP_PASS = 'p';
    const config = getMailConfig()!;
    assert.equal(config.port, 587);
    assert.equal(config.secure, false);
    assert.equal(config.from, 'contact@cogniverse.co.in');
    assert.equal(config.replyTo, 'contact@cogniverse.co.in');
    process.env.SMTP_PORT = '465';
    assert.equal(getMailConfig()!.secure, true);
  });

  test('without SMTP nothing is sent and the status says so', async () => {
    clearMailEnv();
    let calls = 0;
    setMailTransportFactoryForTests(() => ({ async sendMail() { calls += 1; return {}; } }));
    const result = await emailService.notifySuperAdminNewAccessRequest('Ann', 'ann@company.co.in', 'hi');
    assert.equal(result.status, 'SIMULATED_NO_SMTP');
    assert.equal(result.dispatched, false);
    assert.equal(calls, 0);
  });

  test('with SMTP the owner alert goes to the primary, copies the secondary and replies to the primary', async () => {
    clearMailEnv();
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    const sent: Record<string, unknown>[] = [];
    setMailTransportFactoryForTests(() => ({ async sendMail(message) { sent.push(message); return {}; } }));

    const result = await emailService.notifySuperAdminNewAccessRequest('Ann', 'ann@company.co.in');
    assert.equal(result.status, 'SENT');
    assert.equal(result.dispatched, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'contact@cogniverse.co.in');
    assert.equal(sent[0].cc, 'mrk@cogniverse.co.in');
    assert.equal(sent[0].from, 'contact@cogniverse.co.in');
    assert.equal(sent[0].replyTo, 'contact@cogniverse.co.in');
    assert.match(String(sent[0].text), /ann@company\.co\.in/);
  });

  test('a failing mail server gives FAILED, never throws, and does not leak the password', async () => {
    clearMailEnv();
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'SECRET-PASSWORD-123';
    setMailTransportFactoryForTests(() => ({ async sendMail() { throw new Error('connect ECONNREFUSED auth SECRET-PASSWORD-123'); } }));

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...parts: unknown[]) => { logged.push(parts.join(' ')); };
    try {
      const result = await emailService.sendAdminSetupLink('new@company.co.in', 'New', '/staff-portal?setupToken=abc');
      assert.equal(result.status, 'FAILED');
      assert.equal(result.dispatched, false);
      assert.ok(!JSON.stringify(result).includes('SECRET-PASSWORD-123'));
    } finally {
      console.error = originalError;
    }
    assert.ok(logged.length > 0, 'the failure is logged for the operator');
    assert.ok(!logged.join(' | ').includes('SECRET-PASSWORD-123'), 'the SMTP password must never reach the logs');
  });
});
