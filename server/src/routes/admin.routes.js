const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireAdmin);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with storage usage
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 */
router.get('/users', adminController.listUsers);

/**
 * @openapi
 * /api/admin/users/{id}/quota:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a user's storage quota
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quotaBytes]
 *             properties:
 *               quotaBytes: { type: integer }
 *     responses:
 *       200: { description: Updated user }
 */
router.patch('/users/:id/quota', adminController.setQuota);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user and all their files
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @openapi
 * /api/admin/files:
 *   get:
 *     tags: [Admin]
 *     summary: List all files across all users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of files }
 */
router.get('/files', adminController.listAllFiles);

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Storage & file statistics across all users, for the admin dashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Aggregate statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers: { type: integer }
 *                 totalStorageUsed: { type: integer }
 *                 totalStorageQuota: { type: integer }
 *                 totalFiles: { type: integer }
 *                 usersByUsage:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       email: { type: string }
 *                       usedBytes: { type: integer }
 *                       quotaBytes: { type: integer }
 *                 filesByType:
 *                   type: object
 *                   additionalProperties: { type: integer }
 */
router.get('/stats', adminController.stats);

/**
 * @openapi
 * /api/admin/activity:
 *   get:
 *     tags: [Admin]
 *     summary: List activity log entries across all users
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100, maximum: 500 }
 *       - in: query
 *         name: cursor
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: List of activity entries }
 */
router.get('/activity', adminController.listActivity);

module.exports = router;
