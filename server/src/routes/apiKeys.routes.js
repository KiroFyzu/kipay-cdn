const express = require('express');
const apiKeysController = require('../controllers/apiKeys.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/api-keys:
 *   get:
 *     tags: [API Keys]
 *     summary: List the current user's API keys
 *     description: >
 *       Returns metadata only (name, prefix, timestamps) - the raw key value is never
 *       returned again after creation.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/', requireAuth, apiKeysController.list);

/**
 * @openapi
 * /api/api-keys:
 *   post:
 *     tags: [API Keys]
 *     summary: Create a new API key
 *     description: >
 *       The raw key (prefixed `cdnk_`) is returned exactly once in this response - copy it
 *       immediately, it cannot be retrieved again. Use it as `Authorization: Bearer <key>`
 *       on any endpoint that normally accepts a JWT. If it leaks, revoke it and create a new one.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, description: "Label to identify this key, e.g. 'Upload script'" }
 *     responses:
 *       201:
 *         description: API key created - the `key` field is shown only in this response
 *       400:
 *         description: Missing or invalid name
 *       409:
 *         description: Maximum number of API keys reached
 */
router.post('/', requireAuth, apiKeysController.create);

/**
 * @openapi
 * /api/api-keys/{id}:
 *   delete:
 *     tags: [API Keys]
 *     summary: Revoke (delete) an API key
 *     description: Immediately invalidates the key - any client still using it gets 401 on the next request.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: API key revoked
 *       404:
 *         description: API key not found
 */
router.delete('/:id', requireAuth, apiKeysController.remove);

module.exports = router;
