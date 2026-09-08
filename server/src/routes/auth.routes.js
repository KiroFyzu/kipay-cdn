const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and start mandatory 2FA setup
 *     description: >
 *       Creates the user account and generates a TOTP secret, but does NOT log the user in yet.
 *       Returns a QR code to scan in an authenticator app (Google Authenticator, Authy, etc.)
 *       and a short-lived setupToken. Call /api/auth/2fa/setup/verify with a 6-digit code to finish.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201:
 *         description: Account created, 2FA setup required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 setupToken: { type: string }
 *                 qrCode: { type: string, description: "Data URL (PNG) of the QR code to scan" }
 *                 secret: { type: string, description: "Manual entry key if QR can't be scanned" }
 *                 email: { type: string }
 *       409:
 *         description: Email already registered
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /api/auth/2fa/setup/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm the 6-digit authenticator code to finish 2FA setup and log in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [setupToken, code]
 *             properties:
 *               setupToken: { type: string }
 *               code: { type: string, description: "6-digit code from the authenticator app" }
 *     responses:
 *       200:
 *         description: 2FA enabled, returns JWT
 *       401:
 *         description: Invalid code or expired setup session
 */
router.post('/2fa/setup/verify', authController.verifySetup);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: >
 *       If the account has 2FA enabled, this returns { requires2FA: true, loginToken } instead of a JWT.
 *       Call /api/auth/2fa/login/verify with that loginToken and a 6-digit code to finish.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, or 2FA challenge issued
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/2fa/login/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Complete login by submitting the authenticator 6-digit code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginToken, code]
 *             properties:
 *               loginToken: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       401:
 *         description: Invalid code or expired login session
 */
router.post('/2fa/login/verify', authController.verifyLogin);

/**
 * @openapi
 * /api/auth/2fa/enable/start:
 *   post:
 *     tags: [Auth]
 *     summary: Start enabling 2FA for the current (already logged in) account
 *     description: Generates a new TOTP secret and QR code. Call /api/auth/2fa/enable/verify with a code to finish.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: QR code and secret generated
 *       409:
 *         description: 2FA is already enabled
 */
router.post('/2fa/enable/start', requireAuth, authController.enable2FAStart);

/**
 * @openapi
 * /api/auth/2fa/enable/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm the 6-digit code to finish enabling 2FA
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: 2FA enabled
 *       401:
 *         description: Invalid code
 */
router.post('/2fa/enable/verify', requireAuth, authController.enable2FAVerify);

/**
 * @openapi
 * /api/auth/2fa/disable:
 *   post:
 *     tags: [Auth]
 *     summary: Disable 2FA for the current account
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword]
 *             properties:
 *               currentPassword: { type: string }
 *     responses:
 *       200:
 *         description: 2FA disabled
 *       401:
 *         description: Current password is incorrect
 */
router.post('/2fa/disable', requireAuth, authController.disable2FA);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Missing or invalid token
 */
router.get('/me', requireAuth, authController.me);

/**
 * @openapi
 * /api/auth/password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change the current user's password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password is incorrect
 */
router.patch('/password', requireAuth, authController.changePassword);

module.exports = router;
