var current_position, current_accuracy, safeZone, nextSafeZone, map;

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
    socket.on("start-game", function(data) {
        addSafeZone(data.radius, data.lat, data.long);
        alerT("Game Starting!")
    })
    socket.on("safe-zone-will-shrink", function(data) {
        updateSafeZone(data.radius, data.lat, data.long, data.time);
        alert("Safe zone shrinking to " + data.radius + "m in " + data.time + " seconds!")
    });


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
        addSafeZone(radius, lat, long);
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
    alert(e.message);
}

function toast(msg, type) {
    $("#toaster").append($("<div></div>")
        .html(msg)
        .addClass("toast "+type)
        .append($("<button></button>")
        .addClass("btn btn-clear float-right")));
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
                if (item.isAlive && index != Cookies.get("id")) {
                    select.append($("<option></option>")
                        .attr("value",item.name)
                        .text(item.name));
                    var player = list.append($("<li></li>")
                        .addClass("player alive")
                        .text(item.name))
                } else if (index == Cookies.get("id")) {
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
        if (item.isAdmin && index == Cookies.get("id")) {
            keepAdminPanel = true;
        }
    })

    if (!keepAdminPanel)
        adminPanel.remove();
}
