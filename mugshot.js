$(function(){
    $("#upload").click(function(){
        $.ajax({
            type: 'POST',
            url: 'https://httpbin.org/post',
            data: $("#photo").prop('files')[0],
            processData: false,
            contentType: false
        });
    })
})
