var nodemailer = require('nodemailer');
var _ = require('underscore');
var fs = require('fs');
var async = require('async');

var header_tpl = fs.readFileSync('app/assets/tpl/header.html');
var footer_tpl = fs.readFileSync('app/assets/tpl/footer.html');


function initMsg(from, to, cc, html) {
    var date = new Date();
    var subject = (date.getMonth() + 1) + "月份工资单";
    var message = {
        from: from,
        to: to,
        cc: cc,
        subject: subject,
        headers: {
            'X-Laziness-level': 1000
        },
        text: subject,
        html: html
    };
    return message;
}

function generateHeader(header) {
    if (!header) {
        return "";
    }
    var html = "<table><thead><tr>";
    for (var th in header) {
        html += "<th>" + th + "</th>";
    }
    html += "</tr></thead>";
    return html;
}

function generateBody(header, item) {
    var body = "<tbody><tr>";
    for (var h in header) {
        body += "<td>" + (item[h] || '') + "</td>";
    }
    body += "</tr></tbody></table>";
    console.log(body);
    return body;
}

function sendMail(data) {
    var thdata = data[0];
    var hkeys = _.keys(thdata);
    delete thdata[hkeys[hkeys.length - 1]];
    delete thdata[hkeys[hkeys.length - 2]];
    var head = generateHeader(thdata);

    var transport = nodemailer.createTransport("SMTP", {
        service: "QQex",
        auth: {
            user: "duanhong@qfpay.com",
            pass: "100emacs861"
        }
    });

    data.splice(0, 1); //remove header data

    async.each(data, function(item, callback) {
        var tbody = header_tpl + head + generateBody(thdata, item) + footer_tpl;

        var from = "duanhong@qfpay.com";
        var keys = _.keys(item);
        var to = item[keys[keys.length - 3]];
        console.log(to);
        var cc = item[keys[keys.length - 2]];
        console.log(cc);

        var msg = initMsg(from, to, cc, tbody);
        transport.sendMail(msg, function(error) {
            if (error) {
                console.log(error);
                return;
            }
            console.log('Message sent successfully!');
        });

    })
}

exports.sendMail = sendMail;
