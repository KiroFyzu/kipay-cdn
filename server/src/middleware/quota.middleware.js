// Rejects an upload before multer starts writing to disk if the declared
// Content-Length would push the user over their remaining storage quota.
function checkQuota(req, res, next) {
  const user = req.user;
  const contentLength = Number(req.headers['content-length'] || 0);
  const remaining = user.storage_quota_bytes - user.storage_used_bytes;

  // Content-Length includes multipart boundaries/headers, so this is a
  // conservative (slightly over-estimated) check — safe direction to err in.
  if (contentLength > 0 && contentLength > remaining) {
    return res.status(413).json({
      error: 'Storage quota exceeded',
      remainingBytes: Math.max(0, remaining),
      quotaBytes: user.storage_quota_bytes,
      usedBytes: user.storage_used_bytes,
    });
  }
  next();
}

module.exports = { checkQuota };
