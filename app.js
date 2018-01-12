'use strict';
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({'extended': true}));
app.use(bodyParser.json());

const server = app.listen(process.env.PORT, () => {
  console.log('Server running on port', process.env.PORT);
});


module.exports = server;

(app => {
  let exec = require('child_process').exec;
  
  app.get('/', (req, res) => {
    res.status(200).json(`Application up and responding on port ${process.env.PORT}`);
  });
  app.get('/throw', (req, res) => {
    res.status(200).json('DONE');
    process.exit(1);
  });
  app.get('/set-engine', (req, res) => {
    exec('npm install -g pm2', (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.status(200).json({'std': {'out': stdout, 'err': stderr}});
    });
  });
  app.post('/new', (req, res) => {
    if (req.body.app) {
      let app = req.body.app;
      let cmd = `pm2 start ${app.entry} --name ${app.name}`;
      exec(cmd, {
        'cwd': app.cwd
      },(err, stdout, stderr) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        res.status(200).json({'std': {'out': stdout, 'err': stderr}});
      });
    }
  });
})(app);

process.on('exit', code => {
  let exec = require('child_process').exec;
  let cmd = `node ${__dirname}/app.js`;

  console.log('Exiting with code', code);
  console.log('Restarting server and application...');

  try {
    console.log('Closing server...');
    server.close();
  } catch(e) {
    console.log('Could not close the server.');
  }

  exec(cmd, () => {
    process.kill();
  });

});