const express = require('express');
const foldersController = require('../controllers/folders.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /api/folders:
 *   post:
 *     tags: [Folders]
 *     summary: Create a folder
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               parentId: { type: string, nullable: true }
 *     responses:
 *       201: { description: Folder created }
 *   get:
 *     tags: [Folders]
 *     summary: List folders (optionally by parent)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of folders }
 */
router.post('/', foldersController.create);
router.get('/', foldersController.list);

/**
 * @openapi
 * /api/folders/{id}:
 *   patch:
 *     tags: [Folders]
 *     summary: Rename a folder
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
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Folder renamed }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Folders]
 *     summary: Delete a folder
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       404: { description: Not found }
 */
router.patch('/:id', foldersController.rename);
router.delete('/:id', foldersController.remove);

module.exports = router;
