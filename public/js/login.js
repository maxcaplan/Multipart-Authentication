// Video Element parameters
var width = 320;    // This will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

// State Variables
var streaming = false;
var capturing = false;
var recording = false;

// Page Elements
var collapse = null;
var video = null;
var flash = null;
var canvas = null;
var captureBtn = null;
var switchBtn = null;
var loginBtn = null;
var audioBtn = null;
var load = null;

// Data Variables
var camIndex = 0;
var voice = [];
var face = [];


/*~~~~~~~~~~~~~~~*/
/*    StartUp    */
/*~~~~~~~~~~~~~~~*/


function startup() {
    // initialize page elements
    collapse = $("#faceID");
    video = document.getElementById('videoElement');
    flash = $("#flash");
    captureBtn = $("#capture");
    switchBtn = document.getElementById('switch');
    loginBtn = $("#upload");
    audioBtn = $("#audio");
    load = $("#modelLoad");

    loginBtn.disabled = true;
    captureBtn.disabled = true;
    audioBtn.disabled = true;


    navigator.mediaDevices.getUserMedia({video: true, audio: false})
        .then(function (stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function (err) {
            console.log("An error occurred: " + err);
        });

    video.addEventListener('canplay', function (ev) {
        captureBtn.disabled = false;
        audioBtn.attr("disabled", false);

        if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);

            if (isNaN(height)) {
                height = width / (4 / 3);
            }

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            streaming = true;

            // Load the model and begin checking for faces in video stream
            loadModel().then(() => {
                $("#loadWrapper").addClass("collapse-anim");
                $("#loadLabel").hide();
                collapse.collapse('show');
                loginBtn.disabled = false;
            }).then(() => {
                setInterval(() => {
                    if (capturing && face.length < 1) {
                        // capture frames from video stream
                        let frame = document.createElement("canvas");
                        var context = frame.getContext('2d');
                        if (width && height) {
                            frame.width = width;
                            frame.height = height;
                            context.drawImage(video, 0, 0, width, height);
                        }

                        // pass captured frame into face detection
                        detectFaces(frame).then((result) => {
                            if (capturing) {
                                // check if a face is detected
                                if (result.data.length > 0) {
                                    $("#status").addClass("text-success");
                                    $("#status").removeClass("text-danger");
                                    $("#status").html("Face Detected");
                                    crop(result.image.toDataURL('image/jpg'), result.data[0])
                                        .then((image) => {
                                            face.push(image);
                                            captureBtn.html("Image of face collected");
                                            flash.removeClass('display');
                                            flash.addClass('display');
                                            flash.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                                                function (e) {
                                                    flash.removeClass('display')
                                                });
                                        })
                                } else {
                                    $("#status").removeClass("test-success");
                                    $("#status").addClass("text-danger");
                                    $("#status").html("Face Not Detected");
                                }
                            }
                        })
                    } else {
                        if (!recording) {
                            capturing = false;
                            switchBtn.disable = false;
                            audioBtn.attr("disable", false);
                            loginBtn.disable = false;
                        }
                    }
                    if (face.length >= 1) {
                        if (!recording) {
                            capturing = false;
                            switchBtn.disabled = false;
                            audioBtn.attr("disabled", false);
                            loginBtn.disabled = false;
                        }
                        captureBtn.html("Image captured");
                        captureBtn.attr("disable", false);
                    }
                }, 500)
            });
        }
    }, false);

    switchBtn.addEventListener('click', function (ev) {
        switchcamera();
        ev.preventDefault();
    }, false);

    audioBtn.click(function (ev) {
        captureBtn.attr("disabled", true);
        loginBtn.disabled = true;
        record_voice();
        ev.preventDefault()
    });

    captureBtn.click(function (ev) {
        capturing = !capturing;
        if (capturing) {
            switchBtn.disable = true;
            audioBtn.attr("disabled", true);
            loginBtn.disabled = true;
            captureBtn.html("Capturing...")
        } else {
            switchBtn.disable = false;
            audioBtn.attr("disable", false);
            loginBtn.disabled = true;
            captureBtn.html("Recognize Face")
        }
        ev.preventDefault();
    });

    loginBtn.click(function (ev) {
        // Check for errors in form data
        let name = $("#name");
        let errors = false;
        var faceMatch = false;
        var voiceMatch = false;

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
            });
        }

        if(voice.length === 0) {
            audioBtn.tooltip('enable');
            audioBtn.tooltip('show');
            errors = true;

            audioBtn.on('hidden.bs.tooltip', function() {
                audioBtn.tooltip('disable');
            });
        }

        if(face.length === 0) {
            captureBtn.tooltip('enable');
            captureBtn.tooltip('show');
            errors = true;

            captureBtn.on('hidden.bs.tooltip', function() {
                captureBtn.tooltip('disable');
            });
        }

        if(!errors) {
            loginBtn.attr("disabled", true);

            // send post request to app.js through jQuery
            $.ajax({
                url: '/api/faceLogin',
                type: 'POST',
                data: {
                    name: $("#name").val(),
                    image: face,
                    model: './models/' + $("#name").val(),
                },
                success: function (response) {
                    console.log(response);
                    if (response.startsWith('[FACE MATCH]')) {
                        faceMatch = true;
                    } else {
                        faceMatch = false;
                    }
                    // since face comparison takes longer than voice, check matches upon completion of face recognition
                    if(faceMatch === true && voiceMatch === true) {
                        window.alert("[ACCESS GRANTED] Both face and voice of login request match");

                        // use window.localStorage to pass the username through to access granted page
                        window.localStorage.setItem("username", $("#name").val());

                        location.assign("/accessGranted.html");
                    }
                    else {
                        window.alert("[ACCESS DENIED] Did not have a match for both face and voice");
                        location.assign("/");
                    }
                },
                error: function (exception) {
                    console.log(exception);
                    if (exception.responseText.startsWith("Account does not exist, ")){
                        let msg = "Account name does not exist";
                        document.getElementById("errors").innerHTML = "<div class='alert alert-danger alert-dismissible fade show animated shake' role='alert'>" + msg + "<button type='button' class='close' data-dismiss='alert' aria-label='Close'><i class='fas fa-times fa-sm'></i></button></div>";
                        loginBtn.attr("disabled", false);
                    }
                    if (exception.responseJSON) {
                        let msg = exception.responseJSON.error;
                        document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                    }
                }
            });

            // send post request to app.js through jQuery
            $.ajax({
                url: '/api/voiceLogin',
                type: 'POST',
                data: {
                    name: $("#name").val(),
                    audio: voice,
                },
                success: function (response) {
                    console.log(response);
                    if (response.startsWith('[VOICE MATCH]')) {
                        voiceMatch = true;
                    } else {
                        voiceMatch = false;
                    }
                },
                error: function (exception) {
                    console.log(exception);
                    if (exception.responseJSON) {
                        let msg = exception.responseJSON.error;
                        document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                    }
                }
            });
            window.alert("Verifying user... this may take a moment");
        }
    });


    /*~~~~~~~~~~~~~~~*/
    /*   Functions   */
    /*~~~~~~~~~~~~~~~*/


    function record_voice() {
        recording = !recording;
        // if not yet recording and no recordings already exist, begin streaming audio
        if (recording && voice.length === 0) {
            const audioChunks = [];
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(stream => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start(0.25);
                    setTimeout(function() {
                        $("#audio").html("Recording... (Please say your name)");
                        console.log("Recording...");
                    }, 500);

                    // once there are audio chunks available, push then to the audioChunks array
                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                    });

                    // when recording is done, convert audio chunks into Blob and push blob to voice array
                    mediaRecorder.addEventListener("stop", event => {
                        audioblob = new Blob(audioChunks, {'type': 'audio/wav'});
                        var fileReader = new FileReader();
                        fileReader.readAsDataURL(audioblob);
                        fileReader.onload = function (ev) {
                            voice.push(fileReader.result);
                            console.log(ev)
                        };
                    });

                    setTimeout(() => {
                        mediaRecorder.stop();
                        if (face.length < 1) {
                            captureBtn.attr("disabled", false);
                        }
                        loginBtn.disabled = false;
                        console.log("Recording Finished");
                        $("#audio").html("Recording Finished");
                        recording = !recording;
                    }, 3500);
                });
        }
        // if there is already one recording indicate that file has already been collected
        else if (voice.length > 0) {
            console.log("Audio file has already been recorded");
            $("#audio").html("Audio file has already been recorded");
            loginBtn.disabled = false;
            if (face.length < 1) {
                captureBtn.attr("disabled", false);
            }
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
            for (var i = 0; i < arrayLength; i++) {
                var tempDevice = devices[i];
                if (tempDevice.kind === "videoinput") {
                    listDevices.push(tempDevice);
                }
            }

            // check the number of video devices within the device list
            var numCameras = listDevices.length;
            // if more than one video device allow to switch constraints upon click
            if (numCameras > 1) {
                if ({video: {deviceId: {exact: listDevices[1].deviceId}}} && camIndex === 0) {
                    console.log("Camera index 1 is active");
                    constraints = {audio: false, video: { width: 1280, height: 720, deviceId: {exact: listDevices[1].deviceId}}};
                    camIndex = 1;
                } else if ({video: {deviceId: {exact: listDevices[0].deviceId}}} && camIndex === 1) {
                    console.log("Camera index 0 is active");
                    constraints = {audio: false, video: { deviceId: {extract: listDevices[0].deviceId}}};
                    camIndex = 0;
                }
            } else {
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

    function crop(img, box) {
        return new Promise((resolved, rejected) => {
            let cc = document.createElement('canvas');
            let ctx = cc.getContext('2d');
            let resize = faceapi.resizeResults(box, {width: width, height: height});
            let image = new Image;

            let bW = resize.box.width;
            let bH = resize.box.height;

            if (bW > bH) {
                cc.width = bW;
                cc.height = bW;
            } else {
                cc.height = bH;
                cc.height = bH;
            }

            image.onload = () => {
                ctx.drawImage(image, -resize.box.x, -resize.box.y, width, height);
                resolved(cc.toDataURL('image/jpg'));
            };
            image.src = img
        })
    }

    // Load models from folder
    async function loadModel() {
        console.log("loading models");
        await faceapi.loadSsdMobilenetv1Model("/models");
        console.log("mobile net loaded");
        load.width("50%");
        await faceapi.loadTinyFaceDetectorModel("/models");
        console.log("tiny face loaded");
        load.width("100%");
        return
    }

    // Detect faces in video stream
    async function detectFaces(img) {
        let detect = await faceapi.tinyFaceDetector(img);
        return {data: detect, image: img}
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
}

window.addEventListener('load', startup, false);