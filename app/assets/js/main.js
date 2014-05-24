/** drop target **/
var _target = document.getElementById('drop');

/** Spinner **/
var spinner;

var _workstart = function() {
    spinner = new Spinner().spin(_target);
}
var _workend = function() {
    spinner.stop();
}

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
    alertify.alert('非常抱歉，亲，今天是我的休息日。', function() {});
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
    availableHeight = Math.max($window.height());;
};

$(document).ready(function() {
    $container = $("#hot");
    $parent = $container.parent();
    $window = $(window);
    $window.on('resize', calculateSize);
});

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

    $buttons.append($('<button id="send">发送邮件</button>'))
};

var init = true;

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
        $.post('/send', {
            data: json
        }).success(function() {
            console.log('email sent!');
        })
    });
};

/** Drop it like it's hot **/
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
