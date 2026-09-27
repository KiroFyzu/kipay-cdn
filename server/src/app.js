const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');

const authRoutes = require('./routes/auth.routes');
const filesRoutes = require('./routes/files.routes');
const foldersRoutes = require('./routes/folders.routes');
const adminRoutes = require('./routes/admin.routes');
const activityRoutes = require('./routes/activity.routes');
const cdnRoutes = require('./routes/cdn.routes');
const apiKeysRoutes = require('./routes/apiKeys.routes');

const app = express();

const allowedOrigins = [
  'https://cdn.kipay.id',
  'http://localhost:5173',
];

app.use(cors({
  origin(origin, callback) {
    // No Origin header = same-origin, curl, mobile app, server-to-server, etc.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api-docs.json', (req, res) => res.json(openapiSpec));

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/cdn', cdnRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/cdn') ||
    req.path.startsWith('/api-docs') ||
    req.path === '/health'
  ) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(413).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
