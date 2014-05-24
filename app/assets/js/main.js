/** drop target **/
var _target;

/** Spinner **/
var spinner;

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
        var loader = new Spinner().spin(document.getElementById("hot"));
        $(".wtHolder").css("opacity", ".3");
        $.post('/send', {
            data: json
        }).success(function(res) {
            loader.stop();
            $(".wtHolder").css("opacity", "1");
            alertify.success("邮件已成功发送！");
        }).error(function() {
            loader.stop();
            $(".wtHolder").css("opacity", "1");
            alertify.error('亲，你提供的邮箱或者密码不正确，请重新输入：');
            $(".content").html('');
            $("#loginForm").show();
            $("#password").val('');
        })
    });
};


$("#submit").unbind("click");
$("#submit").click(function() {
    var username = $("#username").val();
    var password = $("#password").val();
    var auth = {
        pass: password,
        user: username
    };
    $.post("/auth", {
        data: auth
    }).success(function(res) {
        $("#loginForm").hide();
        $(".content").html(res);
        _target = document.getElementById('drop');
        init();
    }).error(function(err) {
        alertify.error('亲，不要再试了，你没有使用的权限');
    })

})
