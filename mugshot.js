var current_position, current_accuracy;

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
    $.get({
        url: '/players',
        success: function (data, textStatus, jqXHR) {
            var name = $("#name");
            $.each(JSON.parse(data), function(index, item){
                if (index == Cookies.get("id")) {
                    name.html(item.name);
                }
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


    var map = L.map("map").fitWorld();
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


    var safeZone = L.circle([51.508, -0.11], {
        color: 'green',
        fillColor: '#0f3',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);
})

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

function updatePlayerList () {
    $.get({
        url: '/players',
        success: function (data, textStatus, jqXHR) {
            var select = $("select#player");
            select.empty();
            $.each(JSON.parse(data), function(index, item){
                console.log(index)
                if (item.isAlive && index != Cookies.get("id")) {
                    select.append($("<option></option>")
                        .attr("value",item.name)
                        .text(item.name));
                }
            });
        }
    });
}
