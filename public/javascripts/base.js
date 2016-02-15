(function() {
    $("#upload").hide();
    var takePicture = document.querySelector("#take-picture"),
        showPicture = document.querySelector("#show-picture");

    if (takePicture && showPicture) {

        takePicture.onchange = function(event) {

            var file = event.target.files[0];
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function() {

                var img = document.createElement("img");
                img.src = reader.result;

                img.onload = function() {

                    /* Update request to server. */
                    $.ajax({
                        url: '/user/picture/' + document.querySelector("#user").innerHTML.trim(),
                        method: 'POST',
                        data: {image: scaleDown(img)},
                        success: function() {
                            $("#upload").show();
                        },
                        error: function(xhr, textStatus, errorThrown) {}
                    });
                };
            };

            /* Preview image from local storage */
            var URL = window.URL || window.webkitURL;
            var imgURL = URL.createObjectURL(file);
            showPicture.src = imgURL;
            showPicture.onload = function() {
                URL.revokeObjectURL(imgURL);
            };
        };
    }
})();

/* Scale down heavy images */
function scaleDown(largeImage) {

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");
    ctx.drawImage(largeImage, 0, 0);

    var MAX_WIDTH = 100;
    var MAX_HEIGHT = 100;
    var width = largeImage.width;
    var height = largeImage.height;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(largeImage, 0, 0, width, height);

    return canvas.toDataURL("image/png");
}
