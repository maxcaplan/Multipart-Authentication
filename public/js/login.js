
var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

var streaming = false;

var video = null;
var canvas = null;
var switchBtn = null;

var camIndex = 0;

function startup() {
    video = document.getElementById('loginVideo');
    switchBtn = document.getElementById('switch');

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
            streaming = true;
            $("#loginVideo").addClass("expand")
        }
    }, false);

    switchBtn.addEventListener('click', function (ev) {
        switchcamera();
        ev.preventDefault();
    }, false);

    function switchcamera() {
        var listDevices = [];
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            var arrayLength = devices.length;
            for (var i=0; i<arrayLength; i++) {
                var tempDevice = devices[i];
                if (tempDevice.kind === "videoinput") {
                    listDevices.push(tempDevice);
                }
            }
            var numCameras = listDevices.length;
            if (numCameras > 1) {
                if ({ video: { deviceId: { exact: listDevices[1].deviceId } } } && camIndex === 0) {
                    console.log("Camera index 1 is active");
                    constraints = { audio: false, video: { deviceId: { exact: listDevices[1].deviceId } } };
                    camIndex = 1;

                }
                else if ({ video: { deviceId: { exact: listDevices[0].deviceId } } } && camIndex === 1) {
                    console.log("Camera index 0 is active");
                    constraints = { audio: false, video: { deviceId: { extract: listDevices[0].deviceId } } };
                    camIndex = 0;
                }
            }
            else {
                console.log("Only one video device detected, could not switch cameras")
            }
            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                window.stream = stream;
                video.srcObject = stream;
                video.play();
            }).catch(function (error) {
                console.log('navigator.getUserMedia error: ', error);
            })
        });
    }
    // captureBtn.addEventListener('click', function (ev) {
    //     takepicture();
    //     ev.preventDefault();
    // }, false);

    // uploadBtn.addEventListener('click', function (ev) {
    //     upload();
    //     ev.preventDefault(), false;
    // })
}

// function takepicture() {
//     if (pictures.length < 10) {
//         var context = canvas.getContext('2d');
//         if (width && height) {
//             canvas.width = width;
//             canvas.height = height;
//             context.drawImage(video, 0, 0, width, height);
//         } else {
//             clearphoto();
//         }

//         pictures.push(canvas.toDataURL('image/jpg'))
//         progress.width(pictures.length / 10 * 100 + "%")
//         count.html(pictures.length + "/10 Image")

//         flash.removeClass('show');
//         flash.addClass('show')
//         flash.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
//             function (e) {
//                 flash.removeClass('show');
//             });
//     }
//     if (pictures.length >= 10) {
//         $("#capture").attr("disabled", true);
//     }
// }

window.addEventListener('load', startup, false);