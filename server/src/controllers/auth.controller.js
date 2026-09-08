const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateSecret, generateURI, verify: verifyTotp } = require('otplib');
const qrcode = require('qrcode');
const config = require('../config');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const ISSUER = 'Uploader CDN';
const SETUP_TOKEN_TTL = '10m';
const LOGIN_TOKEN_TTL = '5m';

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

function issueTempToken(user, purpose, ttl) {
  return jwt.sign({ sub: user.id, purpose }, config.jwtSecret, { expiresIn: ttl });
}

function verifyTempToken(token, purpose) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.purpose !== purpose) return null;
    return payload;
  } catch {
    return null;
  }
}

async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  const existing = User.findByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = User.create({ email: email.toLowerCase(), passwordHash });

  const secret = generateSecret();
  User.setTotpSecret(user.id, secret);
  const otpauth = generateURI({ issuer: ISSUER, label: user.email, secret });
  const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

  const setupToken = issueTempToken(user, '2fa_setup', SETUP_TOKEN_TTL);
  res.status(201).json({
    setupToken,
    qrCode: qrCodeDataUrl,
    secret,
    email: user.email,
  });
}

async function verifySetup(req, res) {
  const { setupToken, code } = req.body;
  if (!setupToken || !code) {
    return res.status(400).json({ error: 'setupToken and code are required' });
  }
  const payload = verifyTempToken(setupToken, '2fa_setup');
  if (!payload) {
    return res.status(401).json({ error: 'setup session expired, please register again' });
  }
  const user = User.findById(payload.sub);
  if (!user || !user.totp_secret) {
    return res.status(404).json({ error: 'user not found' });
  }
  const result = await verifyTotp({ token: String(code), secret: user.totp_secret });
  if (!result.valid) {
    return res.status(401).json({ error: 'invalid authenticator code' });
  }
  const updated = User.enableTotp(user.id);
  ActivityLog.record({ userId: updated.id, action: 'register' });
  const token = issueToken(updated);
  res.json({ token, user: User.toPublic(updated) });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = User.findByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  if (user.totp_enabled) {
    const loginToken = issueTempToken(user, '2fa_login', LOGIN_TOKEN_TTL);
    return res.json({ requires2FA: true, loginToken });
  }

  ActivityLog.record({ userId: user.id, action: 'login' });
  const token = issueToken(user);
  res.json({ token, user: User.toPublic(user) });
}

async function verifyLogin(req, res) {
  const { loginToken, code } = req.body;
  if (!loginToken || !code) {
    return res.status(400).json({ error: 'loginToken and code are required' });
  }
  const payload = verifyTempToken(loginToken, '2fa_login');
  if (!payload) {
    return res.status(401).json({ error: 'login session expired, please log in again' });
  }
  const user = User.findById(payload.sub);
  if (!user || !user.totp_enabled || !user.totp_secret) {
    return res.status(404).json({ error: 'user not found' });
  }
  const result = await verifyTotp({ token: String(code), secret: user.totp_secret });
  if (!result.valid) {
    return res.status(401).json({ error: 'invalid authenticator code' });
  }
  ActivityLog.record({ userId: user.id, action: 'login' });
  const token = issueToken(user);
  res.json({ token, user: User.toPublic(user) });
}

async function enable2FAStart(req, res) {
  if (req.user.totp_enabled) {
    return res.status(409).json({ error: '2FA is already enabled' });
  }
  const secret = generateSecret();
  User.setTotpSecret(req.user.id, secret);
  const otpauth = generateURI({ issuer: ISSUER, label: req.user.email, secret });
  const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
  res.json({ qrCode: qrCodeDataUrl, secret });
}

async function enable2FAVerify(req, res) {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }
  const user = User.findById(req.user.id);
  if (!user.totp_secret) {
    return res.status(400).json({ error: 'no 2FA setup in progress, call enable/start first' });
  }
  const result = await verifyTotp({ token: String(code), secret: user.totp_secret });
  if (!result.valid) {
    return res.status(401).json({ error: 'invalid authenticator code' });
  }
  const updated = User.enableTotp(user.id);
  ActivityLog.record({ userId: user.id, action: '2fa_enable' });
  res.json({ user: User.toPublic(updated) });
}

async function disable2FA(req, res) {
  const { currentPassword } = req.body;
  if (!currentPassword) {
    return res.status(400).json({ error: 'currentPassword is required' });
  }
  const valid = await bcrypt.compare(currentPassword, req.user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'current password is incorrect' });
  }
  User.disableTotp(req.user.id);
  ActivityLog.record({ userId: req.user.id, action: '2fa_disable' });
  const updated = User.findById(req.user.id);
  res.json({ user: User.toPublic(updated) });
}

async function me(req, res) {
  res.json({ user: User.toPublic(req.user) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
  }
  const valid = await bcrypt.compare(currentPassword, req.user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'current password is incorrect' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  User.setPasswordHash(req.user.id, passwordHash);
  ActivityLog.record({ userId: req.user.id, action: 'password_change' });
  res.json({ ok: true });
}

module.exports = {
  register,
  verifySetup,
  login,
  verifyLogin,
  enable2FAStart,
  enable2FAVerify,
  disable2FA,
  me,
  changePassword,
};
