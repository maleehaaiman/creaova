const crypto = require('crypto');

const algorithm = 'aes-256-gcm';

function getKey() {
  const value = process.env.PAYOUT_ENCRYPTION_KEY;
  if (!value) throw new Error('PAYOUT_ENCRYPTION_KEY is not configured.');
  return crypto.createHash('sha256').update(value).digest();
}

function encrypt(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

function lastFour(value) {
  const normalized = String(value || '').replace(/\s+/g, '');
  return normalized ? normalized.slice(-4) : null;
}

module.exports = { encrypt, lastFour };