var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

var log = require('log4js');
var mailsender = require('./config/mail.js');
var db = require('./config/db.js');
var bodyParser = require('body-parser');


app.use(express.static(__dirname + '/app'));
app.use(bodyParser());
app.get('/', function(req, res) {
    res.sendfile('app/index.html');
});

db.init();
server.listen(8080);

io.sockets.on('connection', function(socket) {
    app.set('socket', socket);

    socket.on("__send__all__mail__", function(data) {
        var auth = app.get('auth');
        if (auth) {
            console.log(auth);
            mailsender.sendMail(auth, data, socket);
        }
    });

    socket.on("__change__pass__", function(data) {
        var auth = app.get('auth');
        if (auth) {
            auth.pass = data.pass || auth.pass;
            auth.mailpass = data.mailpass;
            console.log("update auth", auth);
            db.update(auth, function(result) {
                if (result.error) {
                    socket.emit("__error__", result);
                } else {
                    if (data.pass) {
                        socket.emit("__should__relogin__", auth.user);
                    } else {
                        socket.emit("__emailpass__updated__");
                    }
                }
            });
        } else {
            console.log("access auth cache failed!");
        }
    });

    socket.on("__auth__", function(auth) {
        db.get(auth.user, function(doc) {
            if (doc.error) {
                console.log(doc);
                socket.emit("__error__", doc);
            } else {
                if (doc.pass == auth.pass) {
                    app.set('auth', auth);
                    if (doc.changepass) {
                        socket.emit("__should__change__pass__", "please change your password and enter your email password.");
                    } else {
                        var data = '<div id="drop">请将文件拖到此处</div><div id="buttons"></div><div id="hot" class="handsontable"></div>';

                        socket.emit("__auth__successed__", data)
                        db.update(doc);
                    }
                } else {
                    socket.emit("__auth__failed__", "incorrect password. please contact your adminstrastor .");
                }
            }

        });
    })
});
