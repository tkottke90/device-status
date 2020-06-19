const path = require('path');
const { createLogger, format, transports } = require('winston');
const env = require('./environment.service');
const environmentService = require('./environment.service');

// Configurable list of levels
const customList = [ 'fatal', 'error', 'warn', 'customer', 'info', 'socket', 'http', 'verbose', 'debug', 'silly' ];
// Convert the list to an object for winston.  See the level configuration in the documentation https://github.com/winstonjs/winston#logging-levels.
const customLogLevels = customList.reduce( (acc, cur, index) => Object.assign(acc, { [cur]: index }), {});

const logLevel = env.LOG_LEVEL;

class Logger {
  MEGABYTE = 1000000;
  logger;

  constructor() {
    this.logger = createLogger({
      level: logLevel,
      levels: customLogLevels,
      silent: environmentService.NODE_ENV === 'testing',
      format: format.combine(
        format.timestamp(),
        format.simple(),
        format.printf((info) => {
          const message = info.message;
          delete info.message;

          return `${info.timestamp} | ${info.level} | ${message} ${JSON.stringify(info)}`;
        })
      ),
      transports: [
        new transports.Console({ level: env.NODE_ENV === 'development' ? 'debug' : logLevel}),
        new transports.File({
          filename: path.join(env.CWD, 'logs', 'server.log'),
          level: env.NODE_ENV === 'development' ? 'debug' : 'info',
          maxsize: Logger.MEGABYTE
        })
      ]
    });
  }

  log(level, message, data = '') {
    const allowedLevels = ['debug' , 'info' , 'verbose' , 'http' , 'warn' , 'error']
    let _inputLevel = level;
    if (!allowedLevels.includes(level)){
      _inputLevel = 'debug';
    }

    this.logger.log(_inputLevel, message, data);
  }

  error(err, customMessageFn = (message) => message ) {
    this.logger.log(
      'error',
      customMessageFn(err.message),
      { ...err }
    );
  }

  logMethod = (level) => (message, data) => {
    this.log(level, message, data);
  }
}

module.exports = new Logger();