// Video Element parameters
var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

// State Variables
var streaming = false;
var recording = false;

// Page Elements
var video = null;
var canvas = null;
var switchBtn = null;
var audioBtn = null;
var loginBtn = null;
// var name = null;

// Data Variables
var camIndex = 0;
var voice = [];


/*~~~~~~~~~~~~~~~*/
/*    StartUp    */
/*~~~~~~~~~~~~~~~*/


function startup() {
    video = document.getElementById('loginVideo');
    switchBtn = document.getElementById('switch');
    audioBtn = $("#audio");
    //name = $("#name");
    loginBtn = document.getElementById('upload');

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

    audioBtn.click(function(ev) {
        record_voice();
        ev.preventDefault()
    });

    // todo add tooltip functionality to indicate if name does not exist in users
    loginBtn.addEventListener('click', function(ev) {
        // Check for errors in form data
        let name = $("#name");
        let errors = false;

        // if the username is too short or contains spaces throw error
        if (name.val().length < 3 || hasWhiteSpace(name.val())) {
            if (hasWhiteSpace(name.val())) {
                console.log("contains spaces");
                name.attr('title', 'Username contains spaces');
                name.attr('data-original-title', 'Username contains spaces')
            } else {
                console.log("too short");
                name.attr('title', 'Username too short');
                name.attr('data-original-title', 'Username too short')
            }

            name.tooltip('enable');
            name.tooltip('show');
            errors = true;

            name.on('hidden.bs.tooltip', function () {
                name.tooltip('disable')
            })
        }

        // send post request to app.js through jQuery
        $.ajax({
            url: '/api/login',
            type: 'POST',
            data: {
                name: $("#name").val(),
                audio: voice,
            },
            success: function (response) {
                console.log(response);
                window.alert(response);
                if(response.startsWith("[ACCESS GRANTED]")) {
                    // todo grant access to page signing into
                    console.print("Move to next page")
                }
                else {
                    location.assign("/")
                }
            },
            error: function (exception) {
                console.log(exception);
                if (exception.responseJSON) {
                    let msg = exception.responseJSON.error;
                    document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                }
            }
        })
    });


    /*~~~~~~~~~~~~~~~*/
    /*   Functions   */
    /*~~~~~~~~~~~~~~~*/


    function record_voice() {
        recording = !recording;
        // if not yet recording and no recordings already exist, begin streaming audio
        if(recording && voice.length === 0){
            const audioChunks = [];
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start(0.25);
                    $("#audio").html("Recording... (Please say your name)");
                    console.log("Recording...");

                    // once there are audio chunks available, push then to the audioChunks array
                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                    });

                    // when recording is done, convert audio chunks into Blob and push blob to voice array
                    mediaRecorder.addEventListener("stop", event => {
                        audioblob = new Blob(audioChunks, { 'type': 'audio/wav' });
                        var fileReader = new FileReader();
                        fileReader.readAsDataURL(audioblob);
                        fileReader.onload = function (ev) {
                            voice.push(fileReader.result);
                            console.log(ev)
                        };
                    });

                    setTimeout(() => {
                        mediaRecorder.stop();
                        console.log("Recording Finished");
                        $("#audio").html("Recording Finished");
                        recording = !recording;
                    }, 3000);
                });
        }
        // if there is already one recording indicate that file has already been collected
        else if (voice.length > 0) {
            console.log("Audio file has already been recorded");
            $("#audio").html("Audio file has already been recorded");
        }
        // if already recording, indicate to user that recording is already taking place
        else {
            console.log("Recording already in progress");
            recording = !recording
        }
    }

    function switchcamera() {
        var listDevices = [];
        //list all available input devices (both audio and video)
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            var arrayLength = devices.length;
            for (var i=0; i<arrayLength; i++) {
                var tempDevice = devices[i];
                if (tempDevice.kind === "videoinput") {
                    listDevices.push(tempDevice);
                }
            }

            // check the number of video devices within the device list
            var numCameras = listDevices.length;
            // if more than one video device allow to switch constraints upon click
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

            // start new stream from updated constraints
            navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                window.stream = stream;
                video.srcObject = stream;
                video.play();
            }).catch(function (error) {
                console.log('navigator.getUserMedia error: ', error);
            })
        });
    }

    // checks for white space in input string and returns boolean
    function hasWhiteSpace(string) {
        return /\s/g.test(string);
    }

    $("input#name").on({
        keydown: function (e) {
            if (e.which === 32)
                return false;
        },
        change: function () {
            this.value = this.value.replace(/\s/g, "");
        }
    });


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