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
    var data = req.body.data;
    var auth = app.get('auth');
    console.log(auth);
    if (auth) {
        mailsender.sendMail(auth, data, function(result) {
            if (result.error) {
                res.send(401, result.error);
            } else {
                res.send(200, result);
            }
        });
    } else {
        res.send(401);
    }
});

app.post('/errlog', function(req, res) {
    mailsender.mailError(req.data,function(result){
        if(result.error){
            res.send(401, result.error);
        }else{
            res.send(200, result);
        }
    });
});

app.post('/auth', function(req, res) {
    var auth = req.body.data;
    if (auth) {
        app.set('auth', auth);
        if (auth.pass == '123' && auth.user == '123@qfpay.com') {
            res.send(200, '<div id="drop">请将文件拖到此处</div><div id="buttons"></div><div id="hot" class="handsontable"></div>');
        } else {
            res.send(401);
        }
    } else {
        res.send(401);
    }
});

http.createServer(app).listen(8080);
