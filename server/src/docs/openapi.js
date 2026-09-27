const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Uploader CDN API',
      version: '1.2.+2',
      description:
        'REST API for a personal CDN-style file uploader. Users can register, upload files ' +
        'up to a 2GB total storage quota, organize files into folders, and share files ' +
        'publicly via a direct /cdn/{token} link. Admins can manage all users and quotas.',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/*.js').split(path.sep).join('/')],
};

module.exports = swaggerJsdoc(options);
