$(function () {
    let $elmInputMessage 	= $('input#message');
    let $elmInputUsername	= $('input[name="username"]');
    let prefixSocket        = $('input[name="prefixSocket"]').val();
    let $elmFormChat 		= $('form#form-chat');
    let $elmListMessage 	= $('div#area-list-message');
    let $tmplMessageChat    = $('#template-chat-message');

    
    let socket              = io.connect('http://localhost:6969');
    let emojioneAreas = $elmInputMessage.emojioneArea({
        search: false
    });

    $(document).on("click", ".bot-keyword", function (event) {
        let keyword = $(this).data("keyword");
        socket.emit(`${prefixSocket}CLIENT_SEND_BOT_KEYWORD`, {keyword});
    });

    $elmFormChat.submit(function(){
        socket.emit(`${prefixSocket}CLIENT_SEND_BOT_KEYWORD`, paramsUserTypingToBot($elmInputMessage));
        $elmInputMessage.val('');
        emojioneAreas.data("emojioneArea").setText('');
        $("div#area-notify").remove();
        return false;
    });

    socket.on(`${prefixSocket}RETURN_BOT_KEYWORD`, (data) => {
        showListMessage(data, $elmInputUsername, $tmplMessageChat, $elmListMessage);
    });

});