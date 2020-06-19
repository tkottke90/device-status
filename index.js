// Imports
const { createHttpTerminator } = require('http-terminator');

// Express
const express = require('express');
const app = express();
const http = require('http').Server(app);
require('./services/socket.service')(app, http);

const environment = require('./services/environment.service');
const logger = require('./services/logger.service');

app.use((req, res, next) => {
  logger.log('http', `${req.method.toUpperCase()} ${req.path}`);
  next();
});

// Routes
  require('./routes')(app);

// Init Server
const server = http.listen(environment.PORT, environment.HOST, () => {
  logger.log('info', `Server started at ${environment.HOST}:${environment.PORT}`);
})

const httpTerminator = createHttpTerminator({ server });

process.on('SIGTERM', () => {
  logger.log('info', 'SIGTERM Received - Shutting Down')
  httpTerminator.terminate();
  app.socket_service.close();
});

process.on('SIGINT', () => {
  logger.log('info', 'SIGINT Received - Shutting Down')
  httpTerminator.terminate();
});

// Export for testing
module.exports = {
  server,
  app
};