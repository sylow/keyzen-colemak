var data = {};
data.chars = " ntesiroahdjglpufywqbkvmcxz1234567890'\",.!?:;/@$%&#*()_ABCDEFGHIJKLMNOPQRSTUVWXYZ~+-={}|^<>`[]\\";
data.consecutive = 10;
data.word_length = 7;

var colemak_rows = [
    "`1234567890-=",
    "qwfpgjluy;[]\\",
    "arstdhneio'",
    "zxcvbkm,./"
];
var colemak_home = "arstneio";
var shifted_keys = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6',
    '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
    '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'",
    '<': ',', '>': '.', '?': '/'
};


$(document).ready(function() {
    build_keyboard();
    if (localStorage.data != undefined) {
        load();
        render();
    }
    else {
        set_level(1);
    }
    $(document).keypress(keyHandler);
    $('#kb-toggle').click(toggle_keyboard);
    $(document).keydown(function(e) {
        if (e.which == 27) {
            toggle_keyboard();
        }
    });
});


function set_level(l) {
    data.in_a_row = {};
    for(var i = 0; i < data.chars.length; i++) {
        data.in_a_row[data.chars[i]] = data.consecutive;
    }
    data.in_a_row[data.chars[l]] = 0;
    data.level = l;
    data.word_index = 0;
    data.word_errors = {};
    data.word = generate_word();
    data.keys_hit = "";
    save();
    render();
}


function keyHandler(e) {
    var key = String.fromCharCode(e.which);
    if (data.chars.indexOf(key) > -1){
        e.preventDefault();
    }
    data.keys_hit += key;
    if(key == data.word[data.word_index]) {
        data.in_a_row[key] += 1;
        (new Audio("click.wav")).play();
    }
    else {
        data.in_a_row[data.word[data.word_index]] = 0;
        data.in_a_row[key] = 0;
        (new Audio("clack.wav")).play();
        data.word_errors[data.word_index] = true;
    }
    data.word_index += 1;
    if (data.word_index >= data.word.length) {
        if(get_training_chars().length == 0) {
            level_up();
        }
        data.word = generate_word();
        data.word_index = 0;
        data.keys_hit = "";
        data.word_errors = {};
    }
    render();
    save();
}


function level_up() {
    if (data.level + 1 <= data.chars.length - 1) {
        (new Audio('ding.wav')).play();
    }
    l = Math.min(data.level + 1, data.chars.length);
    set_level(l);
}


function save() {
    localStorage.data = JSON.stringify(data);
}


function load() {
    data = JSON.parse(localStorage.data);
}


function render() {
    render_level();
    render_word();
    render_level_bar();
    render_keyboard();
}


function build_keyboard() {
    var indents = [0, 12, 18, 0];
    var html = "";
    for (var r = 0; r < colemak_rows.length; r++) {
        html += "<div class='kb-row' style='padding-left: " + indents[r] + "px'>";
        if (r == 3) {
            html += "<span class='kb-key' data-key='shift' style='width: 40px'>&#8679;</span>";
        }
        for (var i = 0; i < colemak_rows[r].length; i++) {
            var k = colemak_rows[r][i];
            var cls = "kb-key";
            if (colemak_home.indexOf(k) > -1) {
                cls += " home";
            }
            if (k == "t" || k == "n") {
                cls += " bump";
            }
            html += "<span class='" + cls + "' data-key='" + (k == "'" ? "&#39;" : k) + "'>" + $('<span>').text(k).html() + "</span>";
        }
        if (r == 3) {
            html += "<span class='kb-key' data-key='shift' style='width: 40px'>&#8679;</span>";
        }
        html += "</div>";
    }
    html += "<div class='kb-row' style='justify-content: center'><span class='kb-key' data-key=' ' style='width: 150px'>&nbsp;</span></div>";
    $('#keyboard').html(html);
    try {
        if (localStorage.keyboard_open == "true") {
            $('#keyboard').addClass('open');
        }
    } catch (e) {}
}


function toggle_keyboard() {
    $('#keyboard').toggleClass('open');
    try {
        localStorage.keyboard_open = $('#keyboard').hasClass('open');
    } catch (e) {}
}


function render_keyboard() {
    $('#keyboard .kb-key').removeClass('next');
    var c = data.word[data.word_index];
    if (c == undefined) {
        return;
    }
    var base = c;
    var shift = false;
    if (shifted_keys[c] != undefined) {
        base = shifted_keys[c];
        shift = true;
    }
    else if (c != c.toLowerCase()) {
        base = c.toLowerCase();
        shift = true;
    }
    $('#keyboard .kb-key').filter(function() {
        return $(this).attr('data-key') == base || (shift && $(this).attr('data-key') == 'shift');
    }).addClass('next');
}


function render_level() {
    var chars = "<span id='level-chars-wrap'>";
    var level_chars = get_level_chars();
    var training_chars = get_training_chars();
    for (var c in data.chars) {
        if(training_chars.indexOf(data.chars[c]) != -1) {
            chars += "<span style='color: #F00' onclick='set_level(" + c + ");'>"
        }
        else if (level_chars.indexOf(data.chars[c]) != -1) {
            chars += "<span style='color: #000' onclick='set_level(" + c + ");'>"
        }
        else {
            chars += "<span style='color: #AAA' onclick='set_level(" + c + ");'>"
        }
        if (data.chars[c] == ' ') {
            chars += "&#9141;";
        }
        else {
            chars += data.chars[c];
        }
        chars += "</span>";
    }
    chars += "</span>";
    $("#level-chars").html(chars);
}


function render_level_bar() {
    training_chars = get_training_chars();
    if(training_chars.length == 0) {
        m = data.consecutive;
    }
    else {
        m = 1e100;
        for(c in training_chars) {
            m = Math.min(data.in_a_row[training_chars[c]], m);
        }
    }
    m = Math.floor($('#level-chars-wrap').innerWidth() * Math.min(1.0, m / data.consecutive));
    $('#next-level').css({'width': '' + m + 'px'});
    
}   

function render_word() {
    var word = "";
    for (var i = 0; i < data.word.length; i++) {
        sclass = "normalChar";
        if (i > data.word_index) {
            sclass = "normalChar";
        }
        else if (i == data.word_index) {
            sclass = "currentChar";
        }
        else if(data.word_errors[i]) {
            sclass = "errorChar";
        }
        else {
            sclass = "goodChar";
        }
        word += "<span class='" + sclass + "'>";
        if(data.word[i] == " ") {
            word += "&#9141;"
        }
        else {
            word += data.word[i];
        }
        word += "</span>";
    }
    var keys_hit = "<span class='keys-hit'>";
    for(var d in data.keys_hit) {
        if (data.keys_hit[d] == ' ') {
            keys_hit += "&#9141";
        }
        else {
            keys_hit += data.keys_hit[d];
        }
    }
    for(var i = data.word_index; i < data.word_length; i++) {
        keys_hit += "&nbsp;";
    }
    keys_hit += "</span>";
    $("#word").html(word + "<br>" + keys_hit);
}


function generate_word() {
    word = '';
    for(var i = 0; i < data.word_length; i++) {
        c = choose(get_training_chars());
        if(c != undefined && c != word[word.length-1]) {
            word += c;
        }
        else {
            word += choose(get_level_chars());
        }
    }
    return word;
}


function get_level_chars() {
    return data.chars.slice(0, data.level + 1).split('');
}

function get_training_chars() {
    var training_chars = [];
    var level_chars = get_level_chars();
    for(var x in level_chars) {
        if (data.in_a_row[level_chars[x]] < data.consecutive) {
            training_chars.push(level_chars[x]);
        }
    }
    return training_chars;
}

function choose(a) {
    return a[Math.floor(Math.random() * a.length)];
}









































