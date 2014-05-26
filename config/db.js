var Pouchdb = require("pouchdb");
var db = new Pouchdb("qfpay");

function initdb() {
    db.allDocs(function(err, res) {
        console.log(res);
        if ( !! res.total_rows) {
            return;
        } else {
            db.put({
                user: 'duanhong@qfpay.com',
                pass: 'payqf',
                mailpass: '100emacs861',
                changepass: true
            }, 'duanhong@qfpay.com', function(err, resp) {});

            db.put({
                user: 'tian@qfpay.com',
                pass: 'renmin@qfpay',
                mailpass: '123456',
                changepass: true
            }, 'tian@qfpay.com', function(err, resp) {});
        }
    });
}

function getAccount(id, cb) {
    db.get(id, function(err, doc) {
        if (err) {
            cb(err);
            console.log(err);
        } else {
            cb(doc);
        }
    });
}

function updateAccount(auth, cb) {
    db.get(auth.user, function(err, doc) {
        if (err) {
            return;
            console.log(err);
            if (cb) {
                cb(err);
            }
        }
        db.put({
            mailpass: auth.mailpass,
            pass: auth.pass,
            changepass: false
        }, doc._id, doc._rev, function(error, newdoc) {
            if (error) {
                if (cb) {
                    cb(error);
                }
                console.log(error);
            } else {
                if (cb) {
                    cb('updation completed successfully!');
                }
            }
        });
    });
}

function getAll(cb) {
    db.allDocs({
        include_docs: true
    }, function(err, req) {
        if (err) {
            cb(err);
            console.log(err);
        } else {
            cb(req.rows);
        }
    })
}

exports.init = initdb;
exports.get = getAccount;
exports.update = updateAccount;
exports.all = getAll;
