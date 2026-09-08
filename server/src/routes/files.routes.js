const express = require('express');
const filesController = require('../controllers/files.controller');
const { requireAuth, requireAuthFlexible } = require('../middleware/auth.middleware');
const { checkQuota } = require('../middleware/quota.middleware');
const { upload } = require('../services/storage.service');

const router = express.Router();

/**
 * @openapi
 * /api/files/{id}/content:
 *   get:
 *     tags: [Files]
 *     summary: Stream a file's raw content for in-browser preview (image/video/pdf)
 *     description: >
 *       Accepts the JWT either as a normal Authorization header or as a ?token= query
 *       parameter, so it can be used directly as an <img>/<video>/<embed> src.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: token
 *         schema: { type: string }
 *     responses:
 *       200: { description: File stream }
 *       404: { description: Not found }
 */
router.get('/:id/content', requireAuthFlexible, filesController.content);

router.use(requireAuth);

/**
 * @openapi
 * /api/files:
 *   post:
 *     tags: [Files]
 *     summary: Upload a file (max 2GB, subject to remaining user quota)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               folderId: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: File uploaded
 *       413:
 *         description: Storage quota exceeded
 *   get:
 *     tags: [Files]
 *     summary: List files owned by the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of files
 *   parameters:
 *     - in: query
 *       name: search
 *       schema: { type: string }
 *       description: Case-insensitive substring match on file name
 *     - in: query
 *       name: type
 *       schema: { type: string, enum: [image, video, document, other] }
 *     - in: query
 *       name: sortBy
 *       schema: { type: string, enum: [name, size, date] }
 *     - in: query
 *       name: sortOrder
 *       schema: { type: string, enum: [asc, desc] }
 */
router.post('/', checkQuota, upload.single('file'), filesController.upload);
router.get('/', filesController.list);

/**
 * @openapi
 * /api/files/public:
 *   get:
 *     tags: [Files]
 *     summary: List the current user's publicly-shared files
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of public files
 */
router.get('/public', filesController.listPublic);

/**
 * @openapi
 * /api/files/starred:
 *   get:
 *     tags: [Files]
 *     summary: List the current user's starred (favorite) files
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of starred files }
 */
router.get('/starred', filesController.listStarred);

/**
 * @openapi
 * /api/files/recent:
 *   get:
 *     tags: [Files]
 *     summary: List the current user's most recently uploaded/accessed files (across all folders)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of recent files }
 */
router.get('/recent', filesController.listRecent);

/**
 * @openapi
 * /api/files/trash:
 *   get:
 *     tags: [Files]
 *     summary: List the current user's files in Trash
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of trashed files }
 */
router.get('/trash', filesController.listTrash);

/**
 * @openapi
 * /api/files/{id}:
 *   get:
 *     tags: [Files]
 *     summary: Get file details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File details }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Files]
 *     summary: Move a file to Trash (soft delete)
 *     description: >
 *       The file still counts against the user's storage quota while in Trash.
 *       Use /api/files/{id}/permanent to free the space, or /api/files/{id}/restore to undo.
 *       Trashed files are automatically purged after the server's retention period.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File moved to trash }
 *       404: { description: Not found }
 *       409: { description: File is already in trash }
 */
router.get('/:id', filesController.getOne);
router.delete('/:id', filesController.remove);

/**
 * @openapi
 * /api/files/{id}/restore:
 *   post:
 *     tags: [Files]
 *     summary: Restore a file from Trash
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File restored }
 *       404: { description: Not found }
 *       409: { description: File is not in trash }
 */
router.post('/:id/restore', filesController.restore);

/**
 * @openapi
 * /api/files/{id}/permanent:
 *   delete:
 *     tags: [Files]
 *     summary: Permanently delete a file (frees its storage quota)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Permanently deleted }
 *       404: { description: Not found }
 */
router.delete('/:id/permanent', filesController.permanentDelete);

/**
 * @openapi
 * /api/files/{id}/star:
 *   patch:
 *     tags: [Files]
 *     summary: Star or unstar a file (favorites)
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
 *             required: [starred]
 *             properties:
 *               starred: { type: boolean }
 *     responses:
 *       200: { description: Updated file }
 *       404: { description: Not found }
 */
router.patch('/:id/star', filesController.setStarred);

/**
 * @openapi
 * /api/files/{id}/rename:
 *   patch:
 *     tags: [Files]
 *     summary: Rename a file
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
 *       200: { description: File renamed }
 *       404: { description: Not found }
 */
router.patch('/:id/rename', filesController.rename);

/**
 * @openapi
 * /api/files/{id}/visibility:
 *   patch:
 *     tags: [Files]
 *     summary: Toggle a file's public/private visibility (generates a CDN public link)
 *     description: >
 *       Optionally set expiresAt (ISO 8601 datetime) to make the public link automatically
 *       stop working after that time. Omit or pass null for a link that never expires.
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
 *             required: [isPublic]
 *             properties:
 *               isPublic: { type: boolean }
 *               expiresAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200: { description: Updated file }
 *       400: { description: expiresAt must be in the future }
 *       404: { description: Not found }
 */
router.patch('/:id/visibility', filesController.setVisibility);

module.exports = router;
