$(function(){
    $.get({
        url: '/players',
        success: function (data, textStatus, jqXHR) {
            $.each(JSON.parse(data), function(index, item){
                $("select#player").append($("<option></option>")
                    .attr("value",item.name)
                    .text(item.name));
            });
        }
    });
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
    })
})
