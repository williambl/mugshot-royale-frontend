$(function(){
    $("#upload").click(function(){
        if ($("#photo").prop("files").length) {
            $.ajax({
                type: 'POST',
                url: 'http://127.0.0.1:5000/upload?player='+$("#player").val(),
                data: $("#photo").prop('files')[0],
                processData: false,
                contentType: $("#photo").prop('files')[0].type
            });
        }
    });
    updatePlayerList();
    var socket = io.connect('http://' + document.domain + ':' + location.port + "/websocket");
    socket.on("connect", function() {
        alert("connected");
    });
    socket.on("player-joined", function(data) {
        updatePlayerList();
        alert(data.name + " has joined!");
    });
    socket.on("player-eliminated", function(data) {
        updatePlayerList();
        alert(data.name + " has been eliminated!");
    });
    socket.on("player-left", function(data) {
        updatePlayerList();
        alert(data.name + " has left!");
    });
})

function updatePlayerList () {
    $.get({
        url: '/players',
        success: function (data, textStatus, jqXHR) {
            var select = $("select#player");
            select.empty();
            $.each(JSON.parse(data), function(index, item){
                if (item.isAlive) {
                    select.append($("<option></option>")
                        .attr("value",item.name)
                        .text(item.name));
                }
            });
        }
    });
}
