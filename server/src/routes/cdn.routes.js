const express = require('express');
const filesController = require('../controllers/files.controller');

const router = express.Router();

/**
 * @openapi
 * /cdn/{token}:
 *   get:
 *     tags: [CDN]
 *     summary: Publicly stream a file by its public token (no auth required)
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File stream }
 *       404: { description: Not found }
 */
router.get('/:token', filesController.servePublic);

module.exports = router;
