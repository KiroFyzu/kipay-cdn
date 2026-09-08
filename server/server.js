require('./src/db'); // ensure DB + schema initialized before server starts
const app = require('./src/app');
const config = require('./src/config');
const { purgeExpiredTrash } = require('./src/services/trash.service');

app.listen(config.port, () => {
  console.log(`Uploader server listening on http://localhost:${config.port}`);
  console.log(`API docs: http://localhost:${config.port}/api-docs`);
});

purgeExpiredTrash();
setInterval(purgeExpiredTrash, 6 * 60 * 60 * 1000); // sweep every 6 hours
