// Environmental
const chai = require('chai');
const expect = chai.expect;
const express = require('express');
const http = require('http')
const app = express();
const server = http.createServer(app);

const io_client = require('socket.io-client');
const testPort = 10000;

require('../../services/socket.service')(app, server);

server.listen(testPort);

// Test Vars
const url = `http://localhost:${testPort}`;
const options = { 
  transports: ['websocket'],
  forceNew: true,
  reconnection: false
};

const testEventName = 'test event';
const unusedEventName = 'unused test';

describe('Unit Test - Socket Service', function() {
  let socket;

  beforeEach( done => {
    socket = io_client(url, options);

    socket.on('connect', () => done);
    socket.on('connect_error', (error) => done(error))

    done();
  });

  it('should allow for events to be registered', function(done) {
    app.socket_service.register(testEventName, context => { return { status: 'OK' } })

    const event = app.socket_service.events.find( item => item.name === testEventName);
    expect(event).to.exist;
    done();
  });

  it('should allow for events to be removed', function(done) {
    app.socket_service.unregister(testEventName)

    const event = app.socket_service.events.find( item => item.name === testEventName);
    expect(event).to.be.undefined;
    done();
  });

  describe('Client Connection', function() {
    before( done => {
      socket.disconnect();
      socket = null;

      app.socket_service.register(testEventName, context => { return { status: 'OK' } })

      socket = io_client(url, options);
      socket.on('connect', () => done);
      socket.on('connect_error', (error) => done(error))

      done();
    });

    it('should allow connections from clients', function(done) {
      /* Wait for client to connect */
      socket.on('connect', () => {
        const socket_server = app.socket_service.socketServer;
        // Once connected, verify that the client id is listed in the servers client list
        expect(socket_server.engine.clients[socket.id]).to.exist;
        done();
      });
      // On connection error, fail test
      socket.on('connect_error', (error) => done(error))
    });

    it('should respond when a message is sent to a configured listener', function(done) {
      this.timeout(5000);
      
      socket.on(testEventName, data => {
        expect(data.status).to.be.equal('OK');
        done();
      });
  
      socket.emit(testEventName, 'test');
    });

    it('should not respond to unregistered events', function(done) {
      this.timeout(10000);

      socket.emit(unusedEventName, 'test', (data) => {
        done(new Error(`Message received for ${unusedEventName} ${data}`));
      });
      setTimeout( () => done(), 5000 )
    });

    after( done => {
      app.socket_service.unregister(testEventName);
      done();
    });
  });

  describe('Event configuration', function() {
    const reflectEvent = context => {
      return context.data;
    }

    const errorEvent = context => { throw new Error('Event Error') }

    before( done => {
      const beforeHook = context => {
        context.data = 'before'
        return context;
      };

      const afterHook = context => {
        context.data = 'before'
        return context;
      };

      const errorHook = context => {
        context.data = 'before'
        return context;
      };

      app.socket_service.register('test before', reflectEvent, { beforeHooks: [ beforeHook ] });
      app.socket_service.register('test after', reflectEvent, { afterHooks: [ afterHook ] });
      app.socket_service.register('test error', errorEvent, { errorHooks: [ errorHook ] });
      done();
    });
    
    beforeEach( done => {
      socket.disconnect();
      socket = null;

      socket = io_client(url, options);
      socket.on('connect', () => done);
      socket.on('connect_error', (error) => done(error))
    });

    

    it('should allow before hooks to be added to a event', function(done) {
      socket.emit('test before', '', data => {
        console.dir('ack');
        expect(data).to.equal('before');
        done();
      });
    });

    it('should allow after hooks to be added to a event');

    it('should allow error hooks to be added to a event');

  });
});

after( done => {
  server.close();
  done();
}) 