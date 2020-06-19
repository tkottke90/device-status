const fs = require('fs');
const path = require('path');
const express = require('express');
const { promisify } = require('util');
const logger = require('../services/logger.service');
const environment = require('../services/environment.service');

// File Functions
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const getPackageInfo = async () => {
  const packageJSON = await readFile(path.join(environment.CWD, 'package.json'), 'utf8');
  const { name, version, description, homepage } = JSON.parse(packageJSON);

  return { name, version, description, homepage };
}

module.exports = (app) => {
  app.get('/info', async (req, res) => {
    logger.log('http', 'Request made to "/"');
  
    res.status(200).json(await getPackageInfo());
  });

  app.socket_service.register('/info', async () => {
    return await getPackageInfo();
  })

  readDir(path.resolve(__dirname))
    .then( files => {
      files
        .filter( (item) => /.*\.route\.(js|ts)$/.test(item) )
        .forEach( file => 
          import(path.resolve(__dirname, file))
            .then( module => module.default(app) )
        )
    })


  app.get('/', express.static(path.resolve(__dirname, '..', 'public')))
  
}