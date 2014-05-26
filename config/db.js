var Pouchdb = require("pouchdb");
var db = new Pouchdb("qfpay");

function initdb() {
    db.allDocs(function(err, res) {
        if ( !! res.total_rows) {
            return;
        } else {
            db.put({
                user: 'duanhong@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'duanhong@qfpay.com', function(err, resp) {});

            db.put({
                user: 'tian@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'tian@qfpay.com', function(err, resp) {});

            db.put({
                user: 'qisi@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'qisi@qfpay.com', function(err, resp) {});

            db.put({
                user: 'fenzhenmao@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'fenzhenmao@qfpay.com', function(err, resp) {});

            db.put({
                user: 'lijie@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'lijie@qfpay.com', function(err, resp) {});

            db.put({
                user: 'molly@qfpay.com',
                pass: 'qfpay',
                mailpass: '123456',
                changepass: true
            }, 'molly@qfpay.com', function(err, resp) {});

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
        if (auth.mailpass == doc.mailpass && !doc.changepass) {
            return;
        }
        db.put({
            mailpass: auth.mailpass,
            pass: auth.pass,
            changepass: false,
            _id: doc._id,
            _rev: doc._rev
        }, function(error, newdoc) {
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
