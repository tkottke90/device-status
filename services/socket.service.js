const logger = require('./logger.service');
const io = require('socket.io');

class SocketService {
  constructor(server) {
    this.events = [];
    this.clients = [];
    this.socketServer = io(server);
    
    this.socketServer.on('connection', this.newSocket);
  }

  newSocket = (socket) => {
    logger.log('verbose', `Socket connected with id: ${socket.id}`)
    this.clients.push(socket);
    this.events.forEach( event => socket.on(event.name, event.action(socket) ) );

    socket.on('disconnect', () => {
      const socketIndex = this.clients.findIndex( item => item.id === socket.id);
      this.clients.splice(socketIndex, 1);
    });
  }

  register = (name, action, options) => {
    const eventConfigs = Object.assign({beforeHooks: [], afterHooks: [], errorHooks: []}, options);

    this.events.push(this.generateSocketEventHandler({ name, action, ...eventConfigs}));
  }

  unregister = (name) => {
    this.events = this.events.filter( item => item.name !== name );
  }

  close = () => {
    logger.log('info', `Closing socket server - Kicking ${this.clients.length} connected clients`)
    this.socketServer.close();
    this.clients.forEach( client => client.destroy() );
  }

  processHooks = async function*(context, hooks) {
    let index = 0;
    let _context = context;

    while (index < hooks.length) {
      _context = await hooks[index](_context);
      yield { _context, _hookIndex: index };
      index++;
    }

    return _context;
  };

  handleError = (errorHooks) => async (location, context, socket) => {
    logger.log('debug', 'Error handler called ', { error: context.error, method: context.method, step: location });

    for await (const hook of this.processHooks(context, errorHooks)) {
      const { _context, _hookIndex } = hook;
      context = _context;
    }

    const code = context.error._code || 500;
    socket.emit(`${context.method} failed`, context.error, { code });
  }
  
  generateSocketEventHandler(socketEvent) {
    logger.log('debug', `Configuring Socket Event:  ${socketEvent.name}`);

    const outputAction = (socket) => async ($data) => {
      logger.log('debug', `Socket Request: ${socketEvent.name}`, {data: $data});

      const _beforeHooks = socketEvent.beforeHooks || [];
      const _afterHooks = socketEvent.afterHooks || [];
      const _errorHooks = socketEvent.errorHooks || [];

      let data;
      switch(typeof $data[1]) {
        case 'string':
          data = { params: {}, query: {}, data: $data, user: undefined };
          break;
        case 'object':
          data = Object.assign({ params: {}, query: {}, data: $data[1].data, user: undefined }, $data[1]);
          break;
        default :
          data = data = { params: {}, query: {}, data: $data, user: undefined };
      }

      let context = {
        request: null,
        response: null,
        app: this.app,
        method: socketEvent.name,
        params: data.params,
        query: data.query,
        data,
        user: data.user,
      };

      const errorHandler = this.handleError(_errorHooks);

      // Before Hooks
      for await (const hook of this.processHooks(context, _beforeHooks )) {
        const { _context, _hookIndex } = hook;
        context = _context;

        // If there is an error or the result is returned, then
        if (context.error) {
          errorHandler('before', context, socket);
          return;
        }

        // If result is set, skip the remaining hooks
        if (context.result) { break; }
      }

      if (!context.result) {
        try {
          context.result = await socketEvent.action(context);
        } catch (err) {
          context.error = err;
          errorHandler('action', context, socket);
          return;
        }
      }

      // After Hooks
      for await (const hook of this.processHooks(context, _afterHooks )) {
        const { _context, _hookIndex } = hook;
        context = _context;

        // If there is an error or the result is returned, then
        if (context.error) {
          errorHandler('after', context, socket);
          return;
        }
      }

      const status = context.result._code || 200;
      const result = context.result._code ? context.result.data : context.result;
      socket.emit(context.method, result, { status });
    }

    return { name: socketEvent.name, action: outputAction };
  }
}

module.exports = (app, server) => {
  app.socket_service = new SocketService(server);
}