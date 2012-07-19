/* get id and name of a specific user. */
var selectID = null;
var UserName = null;

/* Private chat staff */
var firstFreeChat = 1;
var room_id = [];
var max_room = 1;
var chat_room = "null=null";
var log_number = [];
var text_context = [];
var users_name = [];
var max_boxes = 2;
var timer = [];
var ti = [];
room_id[0] = 'global';

function put_box_name(id) {
    $("#UserName" + id).attr('value', users_name[id]);
    $("#UserNameMinimize" + id).attr('value', users_name[id]);
}

function get_selected_value() {
    var value = $("#selectbar_id option:last").val();
    if (firstFreeChat == (max_boxes + 1))
        $("#selectbar_id").hide();
    return value;
}

function remove_last() {
    $("#selectbar_id option:last").remove();
}

function switch_chat_box(id, with_id) {
    var aux = log_number[id];
    log_number[id] = log_number[with_id];
    log_number[with_id] = aux;

    $("#OldLog" + with_id).remove();

    aux = text_context[id];
    text_context[id] = $("#PrivateboxTextArea" + with_id).html();
    $("#PrivateboxTextArea" + with_id).html(aux);

    aux = users_name[id];
    users_name[id] = users_name[with_id];
    users_name[with_id] = aux;

    aux = room_id[id];
    room_id[id] = room_id[with_id];
    room_id[with_id] = aux;

    put_box_name(with_id);
}

function on_userlist_select(id, Name) {
    selectID = id;
    UserName = Name;

    $('.cl_item').attr('style', 'font-weight: normal');
    $('#cl_' + id).attr('style', 'font-weight: bold; background-color:#ffffff;');
    $('.caction').attr('disabled', false);
}

function on_selectbar_change() {
    var id = $("#selectbar_id option:selected").val();
    switch_chat_box(id, 1);
    $("#selectbar_id").append('<option value="' + id + '" >' + users_name[id] + '  </option>');

    $("#selectbar_id option:selected").remove();
    $("#selectbar_id option:first").attr('selected', 'selected');
}

/* Blink box header, when receive a new message */
function switch_color(room) {
    if (timer[room]++ % 2 == 0) {
        $('#Privatebar' + room).attr('style', "background: blue");
        $('#PrivatebarMinimize' + room).attr('style', "background: blue");
    }
    else {
        $('#Privatebar' + room).attr('style', "background: red");
        $('#PrivatebarMinimize' + room).attr('style', "background: red");
    }
}

/* blinking staff. */
function stop_timer_for_swiching(id) {
    clearTimeout(ti[id]);
    $('#Privatebar' + id).attr('style', "background: blue");
    $('#PrivatebarMinimize' + id).attr('style', "background: blue");
    timer[id] = null;
}


$(document).ready(function () {

    /* csrf crap */
    $.ajaxSetup({
        beforeSend:function (xhr, settings) {
            function getCookie(name) {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });

    /* create an emtpy array sized for 10 elements */
    var hist = [];
    var i = hist.length % 10; // iter pentru inserare
    var j = (i + 9) % 10; // iter pentru de unde incepe cautarea
    var k = 0; // iter pentru pasi de history
    var nr_max_steps; // limita pt k
    var change_dir; // anti inertie la schimbare de directie
    var was_writing;
    var initial = 1;

    function change_values(from, to){
        $("#PrivateboxTextArea" + to).html(text_context[from]);
        users_name[to] = users_name[from];
        log_number[to] = log_number[from];
        room_id[to] = room_id[from];
    }

    /* Switching on close */
    function switch_windows(from) {
        var i;
        if (firstFreeChat <= max_boxes + 1) {
            for (i = from; i < firstFreeChat; i++)
                $("#OldLog" + i).remove();
            for (i = from; i < firstFreeChat; i++) {
                text_context[i+1]  = $("#PrivateboxTextArea" + (i + 1)).html();
                change_values(i + 1, i);
                insert_log_button(i);
                put_box_name(i);

                /* Put the same status as before. */
                if ($("#Privatebox" + (i + 1)).is(":visible")) {
                    $("#Privatebox" + i).show();
                    $("#PrivateboxMinimize" + i).hide();
                } else {
                    $("#Privatebox" + i).hide();
                    $("#PrivateboxMinimize" + i).show();
                }
            }
            firstFreeChat--;
            /* Hide and remove old info. */
            $("#OldLog" + firstFreeChat).remove();
            $("#PrivateboxTextArea" + firstFreeChat).text("");
            $("#Privatebox" + firstFreeChat).hide();
            $("#PrivateboxMinimize" + firstFreeChat).hide();
        } else {
            firstFreeChat--;

            var last = get_selected_value();
            change_values(last, from);
            insert_log_button(from);
            put_box_name(from);
            remove_last();
        }
    }

    /* Sending private messages */
    var SendMessage = function (id) {
        var name;
        if(id == 0) name = '#ShoutboxTextBox';
        else name = '#PrivateboxTextBox' + id;
        var input = $(name).val();

        if (input) {
            AddToHist(input);
            var msgdata = {'opcode':'message', 'msg':input, 'room':room_id[id]};
            var args = {type:"POST", url:"m/", data:msgdata, complete:ReceiveMessage};
            $.ajax(args);
            $(name).val("");
        }
        return false;
    };

    /* Give old log to the players when they ask. */
    function give_me_old_log(id) {
        var msgdata = {'room':room_id[id], 'number':log_number[id]};
        var args = {type:"POST", url:"privateLog/", data:msgdata, complete:PrintOnTextArea};
        $.ajax(args);
        return false;
    }

    var PrintOnTextArea = function (res) {
        var obj = jQuery.parseJSON(res.responseText);
        if (!obj) {
            return false;
        }

        var i, room = GetRoom(obj.msgs[1].room);
        log_number[room] += obj.count;
        for (i = obj.count - 1; i >= 0; --i) {
            $('#OldLog' + room).after(obj.msgs[i].user + " : " + replace_emoticons(obj.msgs[i].text) + "<br />")
        }
    };

    function insert_log_button(id) {
        $("#PrivateboxTextArea" + id).prepend('<a href="#"  id="OldLog' + id + '"> show older log...</br> </a>');
        $("#OldLog" + id).click(function () {
            give_me_old_log(id);
            stop_timer_for_swiching(id);
        });
    }

    /* Generate private boxes when you need.*/
    function init_chat(id) {
        //Position in page
        var position = 175 * id;
        var html = '<div class="Privatebox" id="Privatebox' + id + '" style="right: ' + position + 'px">' +
            '    <div id="Privatebar' + id + '" style="background: blue">' +
            '        <input type="button" id="UserName' + id + '" class="PrivateboxUserName"/>' +
            '        <input type="button" id="ExitButton' + id + '" class="PrivateboxExitButton" value="x"/>' +
            '    </div>' +
            '    <div id="PrivateboxTextArea' + id + '" class="PrivateboxTextArea" ></div>' +
            '    <input type="text" id="PrivateboxTextBox' + id + '" class="PrivateboxTextBox"/>' +
            '</div>' +

            '<div class="Privatebox" id="PrivateboxMinimize' + id + '" style="right: ' + position + 'px">' +
            '    <div id="PrivatebarMinimize' + id + '" style="background: blue">' +
            '      <input type="button" id="UserNameMinimize' + id + '"   class="PrivateboxUserName"/>' +
            '      <input type="button" id="ExitButtonMinimize' + id + '" class="PrivateboxExitButton" value="x"/>' +
            '    </div>' +

            '</div>';

        $("#PrivateChatBoxes").append(html);

        $("#ExitButton" + id).click(function () {
            switch_windows(id);
            stop_timer_for_swiching(id);
        });

        $("#ExitButtonMinimize" + id).click(function () {
            switch_windows(id);
            stop_timer_for_swiching(id);
        });

        $("#UserName" + id).click(function () {
            stop_timer_for_swiching(id);
            $("#Privatebox" + id).hide();
            $("#PrivateboxMinimize" + id).show();
        });

        $("#UserNameMinimize" + id).click(function () {
            stop_timer_for_swiching(id);
            $("#Privatebox" + id).show();
            $("#PrivateboxMinimize" + id).hide();
        });

        $("#PrivateboxTextBox" + id).click(function () {
            stop_timer_for_swiching(id);
        });

        $("#PrivateboxTextArea" + id).click(function () {
            stop_timer_for_swiching(id);
        });

        $("#PrivateboxTextBox" + id).keyup(function (event) {
            stop_timer_for_swiching(id);
            if (event.keyCode == 13) {
                SendMessage(id);
            }
        });

        $("#PrivateboxMinimize" + id).hide();
        log_number[id] = 0;
        max_room++;

    }

    /* clear on refresh */
    $('#ShoutboxTextBox').val('');

    /* profile button */
    $("#ShoutboxProfileButton").click(function () {
        if (selectID != null) {
            window.location = "/player/" + selectID + "/";
        }
    });

    /* write a messaje button */
    $("#ShoutboxMesajeButton").click(function () {
        if (selectID != null) {
            window.location = "/m/create/to=" + selectID;
        }
    });

    var sw = 0;
    function select_bar(id, name) {
        if (sw == 0) {
            var position = 175 * (max_boxes + 1);
            html = '<select onchange="on_selectbar_change()" class= "Privatebox" id="selectbar_id" style="right: ' + position + 'px; background: green;">' +
                '<option ></option>' +
                '</select>';
            $("#PrivatebarUsers").append(html);
            sw = 1;
            $("#selectbar_id").show();
        }
        if ($("#selectbar_id").is(":hidden"))
            $("#selectbar_id").show();
        $("#selectbar_id").append('<option value="' + id + '" >' + name + '  </option>');
    }


    $("#ShoutboxChatButton").click(function () {
        if (selectID != null) {
            if (selectID == myID)
                alert("Nu ai cum sa faci chat cu tine");
            else {
                // Cream camera pe server
                var msgdata = {'opcode':'getRoom', 'from':myID, 'to':selectID};
                var args = {type:"POST", url:"m/", data:msgdata, complete:create_chat_box};
                $.ajax(args);
            }
        }
    });

    /* Create chat box and place it on screen */
    function create_chat_box(res) {
        var obj = jQuery.parseJSON(res.responseText);
        chat_room = obj.name;

        /* Put the name on the list, if windows number is passed.*/
        if (room_not_exist(chat_room)){
            if(firstFreeChat > max_boxes) {
                /* Create and put in the select_bar */
                select_bar(firstFreeChat, UserName);
            }
            /* Create or show next box.*/
            else{
                users_name[firstFreeChat] = UserName;
                if (max_room > firstFreeChat)
                    $('#Privatebox' + firstFreeChat).show();
                else
                    init_chat(firstFreeChat);
                insert_log_button(firstFreeChat);
                put_box_name(firstFreeChat);
            }
            /*Initialize values.*/
            room_id[firstFreeChat] = chat_room;
            users_name[firstFreeChat] = UserName;
            text_context[firstFreeChat] = "";
            log_number[firstFreeChat] = 0;
            firstFreeChat++;
        }
    }

    /* Scrolling down function */
    function AutoScroll() {
        $('#ShoutboxTextArea').scrollTop($('#ShoutboxTextArea')[0].scrollHeight);
    }

    /* Update users list */
    function NewUsers() {
        $.get('/chat/last/', function (data) {
            $('#ShoutboxUserList').html(data);
            if (selectID) {
                $('#cl_' + selectID).attr('style', 'font-weight: bold;background-color:#ffffff;');
                $('.caction').attr('disabled', false);
            }
            else
                $('.caction').attr('disabled', true);
        });
    }

    /* Last 50 messages that was write in global chat.*/
    function NewLog() {
        $.get('/chat/log/', function (data) {
            $('#ShoutboxTextArea').html(replace_emoticons(data));
            $(document).ready(AutoScroll);
        });
    }

    /* See if I got new message */
    function SendPing() {
        var mdata = {'opcode':'keepAlive'};
        var args = {type:'POST', url:'m/', data:mdata, complete:ReceiveMessage};
        $.ajax(args);
        initial = 0;
    }


    $(document).ready(AutoScroll);
    $(document).ready(NewUsers);
    $(document).ready(NewLog);
    $(document).ready(SendPing);
    $(document).everyTime(6000, NewUsers);
    $(document).everyTime(1000, SendPing);


    function AddToHist(input) {
        /* adds input to history array */
        hist[i] = input;
        i = (i + 1) % 10;
        j = (i + 9) % 10;
        nr_max_steps = hist.length;
        k = 0;
        was_writing = 0;
    }

    /* Tell me if the room exist.*/
    function room_not_exist(room) {
        var i;
        for (i = 1; i < firstFreeChat; i++)
            if (room_id[i] == room)
                return false;
        return true;
    }

    /* Give room id or next free chat.*/
    function GetRoom(room) {
        var i;
        for (i = 1; i < firstFreeChat; i++)
            if (room_id[i] == room)
                return i;
        firstFreeChat++;
        return firstFreeChat - 1
    }

    /* Receive function for every kind of messages.*/
    var ReceiveMessage = function (res, status) {
        if (status == "success") {
            var obj = jQuery.parseJSON(res.responseText);

            if (!obj) {
                return false;
            }
            var i;
            for (i = 0; i < obj.count; ++i) {
                if (obj.msgs[i].room == 'global' && initial == 0) {
                    $('#ShoutboxTextArea').append(obj.msgs[i].user + " : " + replace_emoticons(obj.msgs[i].text) + "<br />");
                    AutoScroll();
                }
                else {
                    var room = GetRoom(obj.msgs[i].room);
                    if (room_not_exist(obj.msgs[i].room)) {
                        if (room > max_boxes) {
                            select_bar(room, obj.msgs[i].user);
                        }
                        else {
                            if (max_room > room)
                                $('#Privatebox' + room).show();
                            else
                                init_chat(room);
                            insert_log_button(room);

                            users_name[room] = obj.msgs[i].user;
                            put_box_name(room);
                        }
                        room_id[room] = obj.msgs[i].room;
                        users_name[room] = obj.msgs[i].user;
                        text_context[room] = '';
                        log_number[room] = 0;
                    }
                    log_number[room]++;
                    text_context[room] += obj.msgs[i].user + " : " + replace_emoticons(obj.msgs[i].text) + " <br />";

                    if (room <= max_boxes){
                        if (obj.msgs[i].user != myName && timer[room] == null) {
                            timer[room] = 1;
                            ti[room] = setInterval('switch_color('+room+')', 500);
                        }
                        $('#PrivateboxTextArea' + room).append(obj.msgs[i].user + " : " + replace_emoticons(obj.msgs[i].text) + "<br />");
                        $('#PrivateboxTextArea' + room).scrollTop($('#PrivateboxTextArea' + room)[0].scrollHeight);
                    }
                }
            }
        }
        /*For not spaming*/
        else if (res.status == 400) {
            $('#ShoutboxTextArea').append('<p id="warn_spam"> Stop spamming! </p>');
        }
        else if (res.status == 500) {
            alert(res.textContent);
        }
    };

    /* History for keys.*/
    function HistUp() {
        if (was_writing) {
            /* bagat in hist */
            var input = $('#ShoutboxTextBox').val();
            if (input) {
                hist[i] = input;
                i = (i + 1) % 10;
                j = (i + 8) % 10;
                nr_max_steps = hist.length;
                k++;
                was_writing = 0;
            }
        }

        if (k < nr_max_steps) {
            $('#ShoutboxTextBox').val(hist[j]);
            j = (j + 9) % 10;
            k++;
            change_dir = 1;
        }
    }

    function HistDown() {
        if (k == 0 && !was_writing) {
            $('#ShoutboxTextBox').val("");
        }
        else if (change_dir) {
            change_dir = 0;
            //j = (j + 1) % 10;
            /*k--;*/
        }
        if (k) {
            j = (j + 1) % 10;
            $('#ShoutboxTextBox').val(hist[j]);
            k--;
        }
    }

    $('#ShoutboxSendButton').click(function(){
        SendMessage(0);
    });

    /* Global chat key events. */
    $("#ShoutboxTextBox").keyup(function (event) {
        if (event.keyCode == 13) {
            /* enter */
            $("#ShoutboxSendButton").click();
        }
        else if (event.keyCode == 38) {
            /* up_arrow */
            HistUp();
        }
        else if (event.keyCode == 40) {
            /* down_arrow */
            HistDown();
        }
        else {
            /* other key */
            was_writing = 1;
        }
    });

    /* Emoticons and the replace function. */
    /* TODO: More emoticons.*/
    var emoticons = {
        '>:D':'emoticon_evilgrin.png',
        ':D':'emoticon_grin.png',
        '=D':'emoticon_happy.png',
        ':\\)':'emoticon_smile.png',
        ':O':'emoticon_surprised.png',
        ':P':'emoticon_tongue.png',
        ':\\(':'emoticon_unhappy.png',
        ':3':'emoticon_waii.png',
        ';\\)':'emoticon_wink.png',
        '\\(ball\\)':'sport_soccer.png'
    };

    var img_dir = "/static/img/";
    function replace_emoticons(text) {
        $.each(emoticons, function (character, img) {
            var re = new RegExp(character, 'g');
            text = text.replace(re, '<img src="' + img_dir + img + '" />');
        });
        return text;
    }
});
