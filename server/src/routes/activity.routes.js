const express = require('express');
const activityController = require('../controllers/activity.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /api/activity:
 *   get:
 *     tags: [Activity]
 *     summary: List the current user's own activity log (uploads, deletes, shares, logins, etc.)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: List of activity entries }
 */
router.get('/', activityController.listMine);

module.exports = router;
