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

function generateHeader(header, subheader) {
    if (!header) {
        return "";
    }
    var content = "<table><thead>";
    var thead = "<tr>";

    if (!subheader || !_.keys(subheader).length) {
        content += "<tr>";
        for (var th in header) {
            content += "<th>" + th + "</th>";
        }
        content += "</tr></thead>";
        return content;
    }

    var subthead = "";
    var previous = "";
    var colspan = 0;
    var mergeheader = "";
    for (var th in header) {
        if (_.has(subheader, th)) {
            if (!subthead) {
                subthead = "<tr>";
            }
            if (subheader[th] != th) { //merge cell
                if (colspan) {
                    thead += "<th class=\"merged-header\" colspan=" + colspan + ">" + mergeheader + "</th>";
                }
                colspan = 0;
                mergeheader = th;
            }

            colspan++;
            subthead += "<th>" + subheader[th] + "</th>";
        } else {
            if (colspan) {
                thead += "<th class=\"merged-header\" colspan=" + colspan + ">" + mergeheader + "</th>";
                mergeheader = "";
            }
            thead += "<th class=\"merged-header\" rowspan=2>" + th + "</th>";

            colspan = 0;
        }
    }

    content += thead + "</tr>";
    if (subheader) {
        content += subthead + "</tr>";
    }

    content += "</thead>";
    return content;
}

function generateBody(header, item) {
    var body = "<tbody><tr>";
    for (var h in header) {
        body += "<td>" + (item[h] || '') + "</td>";
    }
    body += "</tr></tbody></table>";
    return body;
}


/**
 *  @jsdoc validate merge header by check sencond row's first cell is null or not
 */

function isMergedHeader(data) {
    var header = data[0];
    var sencondRow = data[1];

    var firstKey = _.keys(header)[0];
    if (!sencondRow[firstKey]) {
        return true;
    }
    return false;
}

function sendMail(auth, data, socket) {
    if (data.length < 2) {
        return {
            error: "Empty collection."
        };
    }

    var transport = nodemailer.createTransport("SMTP", {
        service: "QQex",
        auth: {
            user: auth.user,
            pass: auth.pass
        }
    });

    // remove sender and copy mail fields (used when send mails only)
    var tableHeader = "";
    var thdata = data[0];
    var hkeys = _.keys(thdata);

    if (isMergedHeader(data)) {
        var subthdata = data[1];
        delete thdata[hkeys[hkeys.length - 1]];
        delete thdata[hkeys[hkeys.length - 2]];
        tableHeader = generateHeader(thdata, subthdata);
        data.splice(0, 2); //remove header data
    } else {
        delete thdata[hkeys[hkeys.length - 1]];
        tableHeader = generateHeader(thdata, false);
        data.splice(0, 1); //remove header data
    }

    var error;
    async.each(data, function(item) {
        var tbody = header_tpl + tableHeader + generateBody(thdata, item) + footer_tpl;
        var from = auth.user;
        var keys = _.keys(item);
        var to = item[keys[keys.length - 3]];
        var cc = item[keys[keys.length - 2]];

        var msg = initMsg(from, to, cc, tbody);
        if (!error) {
            transport.sendMail(msg, function(err) {
                if (err) {
                    //mailError(err, function() {});
                    if (!error) {
                        socket.emit("__emailpass__error__", err.Error);
                        error = true;
                    }
                } else {
                    socket.emit("__mail__sent__", item);
                }
            });

        }

    }, function(err) {
        if (err) {
            socket.emit("__error__", err);
        } else {
            socket.emit("__all_sent__", true);
        }
    });
}

function mailError(err, cb) {
    var transport = nodemailer.createTransport("SMTP", {
        service: "QQex",
        auth: {
            user: "duanhong@qfpay.com",
            pass: "100emacs861"
        }
    });

    transport.sendMail({
        from: "duanhong@qfpay.com",
        to: "duanhong@live.com",
        subject: "Mail sender system error log",
        text: err,
        headers: {
            'X-Laziness-level': 1000
        }
    }, function(error) {
        if (error) {
            cb({
                error: error.Error
            });
        } else {
            cb("Error log has been sent successfully!");
        }
    })
}

exports.mailError = mailError;
exports.sendMail = sendMail;
