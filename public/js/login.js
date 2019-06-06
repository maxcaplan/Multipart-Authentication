(function () {
    var width = 320;    // We will scale the photo width to this
    var height = 0;     // This will be computed based on the input stream

    var streaming = false;

    var video = null;
    var canvas = null;

    function startup() {
        video = document.getElementById('videoElement');
        canvas = document.getElementById('videoCanvas');

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function (err) {
                console.log("An error occurred: " + err);
            });

        video.addEventListener('canplay', function (ev) {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        // captureBtn.addEventListener('click', function (ev) {
        //     takepicture();
        //     ev.preventDefault();
        // }, false);

        // uploadBtn.addEventListener('click', function (ev) {
        //     upload();
        //     ev.preventDefault(), false;
        // })

        clearphoto();
    }

    function clearphoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function takepicture() {
        if (pictures.length < 10) {
            var context = canvas.getContext('2d');
            if (width && height) {
                canvas.width = width;
                canvas.height = height;
                context.drawImage(video, 0, 0, width, height);
            } else {
                clearphoto();
            }

            pictures.push(canvas.toDataURL('image/jpg'))
            progress.width(pictures.length / 10 * 100 + "%")
            count.html(pictures.length + "/10 Image")

            flash.removeClass('show');
            flash.addClass('show')
            flash.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                function (e) {
                    flash.removeClass('show');
                });
        }
        if (pictures.length >= 10) {
            $("#capture").attr("disabled", true);
        }
    }

    window.addEventListener('load', startup, false);
})();