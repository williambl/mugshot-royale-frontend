var current_position, current_accuracy, safeZone, nextSafeZone, map, socket;

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
    socket = io.connect('http://' + document.domain + ':' + location.port + "/websocket");
    socket.on("connect", function() {
        toast("connected", "toast-success");
    });
    socket.on("player-joined", function(data) {
        updatePlayerList();
        toast(data.name + " has joined!", "toast-primary");
    });
    socket.on("player-eliminated", function(data) {
        updatePlayerList();
        toast(data.name + " has been eliminated!", "toast-error");
    });
    socket.on("player-left", function(data) {
        updatePlayerList();
        toast(data.name + " has left!", "toast-error");
    });
    socket.on("start-game", function(data) {
        safeZone = addSafeZone(data.rad, data.lat, data.long);
        toast("Game Starting!", "toast-success")
    })
    socket.on("safe-zone-will-shrink", function(data) {
        updateSafeZone(data.rad, data.lat, data.long, data.time);
        toast("Safe zone shrinking to " + data.rad + "m in " + data.time + " seconds!", "toast-warning")
    });
    socket.on("send-position", function(data) {
        socket.emit("position", {"lat": current_position.getLatLng().lat, "long": current_position.getLatLng().lng})
        toast("sending position!", "")
    })

    $("#start-game").click(function() {
        socket.emit ('start-game-request', {"rad": $("#rad").val(), "lat": $("#lat").val(), "long": $("#long").val(), "time": $("#time").val()});
        toast("sending start game request!", "toast-success");
    })

    map = L.map("map").fitWorld();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 20,
    }).addTo(map);

    map.locate({setView: true, maxZoom: 16});

    setInterval (function() {
        map.locate({setView: false, maxZoom: 16});
    }, 5000);

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
});

function updateSafeZone (radius, lat, long, time) {
    nextSafeZone = L.circle([lat, long], {
        color: 'green',
        fillColor: '#0f3',
        fillOpacity: 0.5,
        radius: radius
    }).addTo(map);

    setTimeout(function() {
        map.removeLayer(safeZone);
        map.removeLayer(nextSafeZone);
        safeZone = addSafeZone(radius, lat, long);
    }, time);

}

function addSafeZone (radius, lat, long) {
    return L.circle([lat, long], {
        color: 'green',
        fillColor: '#0f3',
        fillOpacity: 0.5,
        radius: radius
    }).addTo(map);
}

function onLocationFound(e) {
    if (current_position) {
        map.removeLayer(current_position);
        map.removeLayer(current_accuracy);
    }
    var radius = e.accuracy / 2;

    current_position = L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    current_accuracy = L.circle(e.latlng, radius).addTo(map);
}

function onLocationError(e) {
    toast(e.message, "toast-error");
}

function toast(msg, type) {
    $("#toaster").append($("<div></div>")
        .html(msg)
        .addClass("toast "+type)
        .append($("<button></button>")
            .addClass("btn btn-clear float-right")
            .click(function() {
                $(this).parent().remove()
            })
        ));
    window.navigator.vibrate(500);
}

function updatePlayerList () {
    $.get({
        url: '/players',
        success: function (data, textStatus, jqXHR) {
            checkAdminPanel(data);
            var select = $("select#player");
            var list = $("ul#player-list");
            select.empty();
            list.empty();
            $.each(JSON.parse(data), function(index, item){
                if (item.isAlive && isMe(item)) {
                    select.append($("<option></option>")
                        .attr("value",item.name)
                        .text(item.name));
                    var player = list.append($("<li></li>")
                        .addClass("player alive")
                        .text(item.name))
                } else if (isMe(item)) {
                    var player = list.prepend($("<li></li>")
                        .addClass("player me")
                        .text(item.name))
                } else if (!item.isAlive) {
                    var player = list.append($("<li></li>")
                        .addClass("player dead")
                        .text(item.name))
                }
            });


        }
    });
}

function checkAdminPanel (data) {
    var adminPanel = $(".grid-admin");
    var keepAdminPanel = false;
    $.each(JSON.parse(data), function(index, item){
        if (item.isAdmin && isMe(item)) {
            keepAdminPanel = true;
        }
    })

    if (!keepAdminPanel) {
        adminPanel.remove();
        return;
    }
}

function isMe (player) {
    return player.id === Cookies.get("id");
}
