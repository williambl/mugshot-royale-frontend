$(function(){
    $("#upload").click(function(){
        if ($("#photo").prop("files").length) {
            $.ajax({
                type: 'POST',
                url: 'https://httpbin.org/post',
                data: $("#photo").prop('files')[0],
                processData: false,
                contentType: $("#photo").prop('files')[0].type
            });
        }
    })
})
