(function() {
    /** drop target **/
    var _target;
    var _handsontable;
    /** Spinner **/
    var spinner;
    var sending_spinner;

    var socket = io.connect("http://172.100.101.150:8180");

    var _workstart = function() {
        spinner = new Spinner().spin(_target);
    }
    var _workend = function() {
        spinner.stop();
    }

    alertify.set({
        labels: {    
            ok : "确定",
            cancel: "取消"
        }
    });

    /** Alerts **/
    var _badfile = function() {
        alertify.alert('亲，这看上去并不是一个Excel文件，你没搞错吧？', function() {});
    };

    var _pending = function() {
        alertify.alert('亲，我正忙着处理另一个任务。请您稍后再试一次吧？', function() {});
    };

    var _large = function(len, cb) {
        alertify.confirm('亲，这个文件看上去有点大(' + (len / 1024) + ' M)，如果你确定要处理的话，浏览器可能会在处理时无响应，这时请耐心等待。', cb);
    };

    var _failed = function(e) {
        console.log(e, e.stack);
        alertify.confirm('非常抱歉，程序出错了。将错误日志发邮件给 段宏(duanhong@qfpay.com) ？', function(e) {
            if (e) {
                $.post("/errlog", {
                    data: e
                }).success(function(res) {

                }).error(function(res) {

                })
            }
        });
    };

    /** Handsontable magic **/
    var boldRenderer = function(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.TextCell.renderer.apply(this, arguments);
        $(td).css({
            'font-weight': 'bold'
        });
    };

    var $container, $parent, $window, availableWidth, availableHeight;
    var calculateSize = function() {
        var offset = $container.offset();
        availableWidth = Math.max($window.width());
        availableHeight = Math.max($window.height() - 120);
    };

    function init() {
        $container = $("#hot");
        $parent = $container.parent();
        $window = $(window);
        $window.on('resize', calculateSize);

        DropSheet({
            drop: _target,
            on: {
                workstart: _workstart,
                workend: _workend,
                sheet: _onsheet
            },
            errors: {
                badfile: _badfile,
                pending: _pending,
                failed: _failed,
                large: _large
            }
        });

    }

    /* make the buttons for the sheets */
    var make_buttons = function(sheetnames, cb) {
        var $buttons = $("#buttons");
        if ($buttons.html()) {
            return;
        }
        sheetnames.forEach(function(s, idx) {
            var button = $('<button/>').attr({
                type: 'button',
                name: 'btn' + idx,
                id: 'btn' + idx,
                text: s
            });
            button.append('<b>' + s + '</b>');
            button.unbind('click');
            button.click(function() {
                $(".active").removeClass("active");
                $("#btn" + idx).addClass("active");
                cb(idx);
            });
            $buttons.append(button);
        });

        $buttons.append($('<button id="send">发送邮件</button>'));
        if (!$(".active").length) {
            $("#btn0").addClass("active");
        }
    };

    var _onsheet = function(json, cols, sheetnames, select_sheet_cb) {
        make_buttons(sheetnames, select_sheet_cb);
        calculateSize();

        /* add header row for table */
        if (!json) json = [];

        json.unshift(function(head) {
            var o = {};
            for (i = 0; i != head.length; ++i) o[head[i]] = head[i];
            return o;
        }(cols));

        calculateSize();
        /* showtime! */
        $("#hot").handsontable({
            data: json,
            fixedRowsTop: 1,
            stretchH: 'all',
            rowHeaders: true,
            contextMenu: true,
            columns: cols.map(function(x) {
                return {
                    data: x
                };
            }),
            colHeaders: cols.map(function(x, i) {
                var headers = XLS.utils.encode_col(i);
                return headers;
            }),
            isEmptyRow: function(row) {
                var data = json[row];
                return isEmptyRow(data);
            },
            cells: function(r, c, p) {
                if (r === 0) this.renderer = boldRenderer;
            },
            width: function() {
                return availableWidth;
            },
            height: function() {
                return availableHeight;
            },
        });

        $("#send").unbind('click');
        $("#send").click(function() {
            sending_spinner = new Spinner().spin(document.getElementById("hot"));
            $("#send").attr("disabled", true);
            $(".wtHolder").css("opacity", ".3");
            var data = _.reject(json, isEmptyRow);
            socket.emit('__send__all__mail__', data);
        });
    };

    function isEmptyRow(row) {
        if (!_.isEmpty(row)) {
            var values = _.values(row);
            return !_.reject(values, function(val) {
                return _.isNull(val) || _.isEmpty(val);
            }).length;
        }
        return true;
    }

    socket.on("__mail__sent__", function(index) {
        if (!_handsontable) {
            _handsontable = $('#hot').handsontable('getInstance')
        }
        _handsontable.alter("remove_row", index);
        $("")
    });

    socket.on("__all__sent__", function() {
        sending_spinner.stop();
        $("#send").attr("disabled", false);
        $(".wtHolder").css("opacity", "1");
        alertify.success("所有邮件已成功发送！");
    });

    socket.on("__error__", function(err) {
        if (err.status == 404) {
            alertify.error("亲，你的账号还没有注册，请联系系统管理员。");
        }
        if (err.status == 409) {
            alertify.error("邮箱密码更新失败。");
        }
        console.log(err);
    });

    socket.on("__emailpass__error__", function(err) {
        alertify.error("亲， 你的邮箱密码不正确。");
        sending_spinner.stop();
        changePass(true);
    });

    socket.on("__should__change__pass__", function(data) {
        alertify.success("请修改你的密码，并填写你的邮箱密码，系统将用该密码发送邮件。");
        changePass();
    });

    socket.on("__emailpass__updated__", function() {
        alertify.success("邮件密码更新成功！");
        $("#send").attr("disabled", false);
        $("#changePassForm").addClass("alertify-hidden");
    });

    socket.on("__should__relogin__", function(user) {
        alertify.success("密码修改成功，请重新登录");

        $("#changePassForm").addClass("alertify-hidden");
        $("#loginForm").removeClass("alertify-hidden");
        $("#username").val(user);
        $("#password").val("");
    })

    socket.on("__auth__failed__", function(err) {
        alertify.error("亲，你输的密码不正确，再试一次吧！");
    });

    socket.on("__auth__successed__", function(data) {
        $("#loginForm").addClass("alertify-hidden");

        $(".content").html(data);
        _target = document.getElementById('drop');
        init();
    })

    function changePass(mailpassonly) {
        if (mailpassonly) {
            $("#changeTitle").html("请重新填写邮箱密码");
            $("#newpass").hide();
            $("#mailpass").val("");
            $("#mailpass").focus();
        } else {
            $("#newpass").show();
            $("#newpass").val("");
            $("#changeTitle").html("修改你的密码，填写邮箱密码");
            $("#newpass").focus();
        }
        $("#changePassForm").removeClass("alertify-hidden");

        $("#changePassForm").unbind("keyup");
        $("#changePassForm").on("keyup", function(e) {
            if (e.keyCode == 13) {
                validateChangePass(mailpassonly);
            }
        });

        $("#comfirm").unbind("click");
        $("#confirm").click(function() {
            validateChangePass(mailpassonly);
        });
    }

    function validateChangePass(mailpassonly) {
        var mailpass = $("#mailpass").val();
        var newpass = $("#newpass").val() || mailpassonly;

        if (!newpass) {
            $("#newpass").focus();
            return;
        }
        if (!mailpass) {
            $("#mailpass").focus();
            return;
        }

        var data = {
            pass: !mailpassonly && newpass,
            mailpass: mailpass
        };

        socket.emit("__change__pass__", data);
    }

    function validateLogin() {
        var username = $("#username").val();
        var password = $("#password").val();
        if (password && username) {
            login(username, password);
        } else {
            if (!username) {
                $("#username").focus();
                return;
            }
            if (!password) {
                $("#password").focus();
                return;
            }
        }
    }

    function login(username, password) {

        if (!username || !password) {
            alertify.error('亲，请认真填写你的邮箱和密码。');
            return;
        }
        var auth = {
            pass: password,
            user: username
        };

        socket.emit("__auth__", auth);
    }

    $(document).ready(function() {
        $("#loginForm").unbind('keyup');
        $("#loginForm").on("keyup", function(e) {
            if (e.keyCode == 13) { //press enter
                validateLogin();
            }
        });

        $("#submit").unbind("click");
        $("#submit").click(validateLogin);

        $("#username").focus();
    })

})();
