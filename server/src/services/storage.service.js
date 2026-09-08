const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const config = require('../config');

function userDir(userId) {
  const dir = path.join(config.storageDir, userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      cb(null, userDir(req.user.id));
    } catch (err) {
      cb(err);
    }
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[/\\]/g, '_');
    cb(null, `${uuidv4()}-${safeName}`);
  },
});

// A hard ceiling as a second line of defense on top of the quota middleware
// (which only checks the declared Content-Length header).
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

function deletePhysicalFile(storedPath) {
  if (fs.existsSync(storedPath)) {
    fs.unlinkSync(storedPath);
  }
}

module.exports = { upload, userDir, deletePhysicalFile, MAX_FILE_SIZE_BYTES };
