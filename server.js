var express = require('express');
var log = require('log4js');
var mailsender = require('./config');
var http = require('http');
var bodyParser = require('body-parser');


var app = express();
app.use(function(req, res, next) {
    console.log('%s %s', req.method, req.url);
    next();
});
app.use(express.static(__dirname + '/app'));
app.use(bodyParser());
app.get('/', function(req, res) {
    res.sendfile('app/index.html');
});

app.post('/send', function(req, res) {
    //mailsender.sendMail(null,null);
    var data = req.body.data;
    delete data[1];
    mailsender.sendMail(data);
});

http.createServer(app).listen(8080);
