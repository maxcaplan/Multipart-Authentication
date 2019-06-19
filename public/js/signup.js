const publicVapidKey = 'BNs4y954y27kjvbj5tg4CuJYO-cGC4tnyjPST2bwuUKLfuHuDOdyJqGh1HHhowVw9DL0rvWaEr0j80jcF4KQlmc'

var width = 320;
var height = 0;

// State Variables
var streaming = false;
var recording = false;
var capturing = false;

// Page Elements
var collapse = null;
var video = null;
var flash = null
var captureBtn = null;
var switchBtn = null;
var uploadBtn = null;
var audioBtn = null;
var load = null
var notificationBtn = null
var noThanksBtn = null

// Data Variables
var pictures = []
var voice = [];
var constraints = null;
var camIndex = 0;
var pNum = 20;
var aNum = 3;

let audioblob = null;


/*~~~~~~~~~~~~~~~*/
/*    StartUp    */
/*~~~~~~~~~~~~~~~*/


function startup() {
    // Get page elements
    collapse = $("#faceID")
    video = document.getElementById('videoElement');
    flash = $("#flash")
    captureBtn = $('#capture');
    switchBtn = document.getElementById('switch');
    uploadBtn = document.getElementById('upload');
    audioBtn = document.getElementById("audio");
    load = $('#modelLoad')
    notificationBtn = document.getElementById('notificationBtn')
    noThanksBtn = document.getElementById('noThanksBtn')

    // Request to use users webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function (stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function (err) {
            console.log("An error occurred: " + err);
        });

    // Begin Streaming video
    video.addEventListener('canplay', function (ev) {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);

            if (isNaN(height)) {
                height = width / (4 / 3);
            }

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            streaming = true;

            // Load Models and start checking for faces periodically
            loadModel().then(() => {
                $("#loadWrapper").addClass("collapse-anim")
                $("#loadLabel").hide()
                collapse.collapse('show')
            }).then(() => {
                setInterval(() => {
                    if (capturing && pictures.length < pNum) {

                        // Capture frame of video
                        let frame = document.createElement("canvas")
                        var context = frame.getContext('2d');
                        if (width && height) {
                            frame.width = width;
                            frame.height = height;
                            context.drawImage(video, 0, 0, width, height);
                        }

                        // pass frmae into face detector
                        detectFaces(frame).then((result) => {
                            // check if face is detected
                            if (result.data.length > 0) {
                                $("#status").addClass("text-success")
                                $("#status").removeClass("text-danger")
                                $("#status").html("Face Detected")
                                crop(result.image.toDataURL('image/jpg'), result.data[0])
                                    .then((image) => {
                                        pictures.push(image)

                                        captureBtn.html(pictures.length + "/" + pNum + " Images <span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>")

                                        flash.removeClass('display');
                                        flash.addClass('display')
                                        flash.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                                            function (e) {
                                                flash.removeClass('display');
                                            });
                                    })
                            } else {
                                $("#status").removeClass("text-success")
                                $("#status").addClass("text-danger")
                                $("#status").html("Face Not Detected")
                            }
                        })
                    }

                    if (pictures.length >= pNum) {
                        capturing = false
                        captureBtn.html("Done!")
                        captureBtn.attr("disabled", true);
                    }
                }, 500)
            })
        }
    }, false);


    // Attach event listeners to functional buttons
    captureBtn.click(function (ev) {
        capturing = !capturing
        if (capturing) {
            captureBtn.html(pictures.length + "/" + pNum + " Images <span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>")
        } else {
            captureBtn.html("Start Scanning Face")
        }

        ev.preventDefault();
    });

    switchBtn.addEventListener('click', function (ev) {
        switchcamera();
        ev.preventDefault();
    }, false);

    uploadBtn.addEventListener('click', function (ev) {
        let name = $("#name")
        let errors = false

        // Check if user already exists
        $.ajax({
            url: '/api/checkUser',    //api url
            type: 'POST',   //HTTP method
            data: {
                name: name.val()
            },
            success: function (response) {
                // if no user exists check that data is correct
                if (response) {
                    // if the username is too short throw error
                    if (name.val().length < 3) {
                        name.tooltip('enable')
                        name.tooltip('show')
                        errors = true

                        name.on('hidden.bs.tooltip', function () {
                            name.tooltip('disable')
                        })
                    }

                    // if there is less than the min number of pictures throw errot
                    if (pictures.length < pNum) {
                        captureBtn.tooltip('enable')
                        captureBtn.tooltip('show')
                        errors = true

                        captureBtn.on('hidden.bs.tooltip', function () {
                            captureBtn.tooltip('disable')
                        })
                    }

                    // if there are no errors display modal
                    if (!errors) {
                        $('#uploadModal').modal({ backdrop: 'static', keyboard: false })
                    }

                    ev.preventDefault(), false;
                }
            },
            error: function (exception) {
                console.log(exception)
                if (exception.responseText) {
                    let msg = exception.responseText

                    document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                }
            }
        })
    })

    audioBtn.addEventListener('click', function (ev) {
        recordVoice();
        ev.preventDefault();
    })

    notificationBtn.addEventListener('click', function (ev) {
        if ('serviceWorker' in navigator) {
            register()
                .then(result => {
                    subscribe(result)
                        .then(subscription => {
                            $.ajax({
                                url: '/api/data',    //api url
                                type: 'POST',   //HTTP method
                                data: {
                                    name: $("#name").val(),
                                    data: pictures,
                                    audio: voice,
                                    subscription: JSON.stringify(subscription)
                                },
                                success: function (response) {
                                    if (response) {
                                        location.assign("/")
                                    }
                                },
                                error: function (exception) {
                                    console.log(exception)
                                    if (exception.responseJSON) {
                                        let msg = exception.responseJSON.error

                                        document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                                    }
                                }
                            })
                        })
                })
        }
    })

    noThanksBtn.addEventListener('click', function (ev) {
        $.ajax({
            url: '/api/data',    //api url
            type: 'POST',   //HTTP method
            data: {
                name: $("#name").val(),
                data: pictures,
                audio: voice,
                subscription: false
            },
            success: function (response) {
                if (response) {
                    location.assign("/")
                }
            },
            error: function (exception) {
                console.log(exception)
                if (exception.responseJSON) {
                    let msg = exception.responseJSON.error

                    document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
                }
            }
        })
    })
}


/*~~~~~~~~~~~~~~~*/
/*   Functions   */
/*~~~~~~~~~~~~~~~*/


function recordVoice() {
    recording = !recording;
    if (recording && voice.length < aNum) {
        const audioChunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start(0.25);
                $("#audio").html("Recording... (Please say your name)");
                console.log("Recording...");

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", event => {
                    audioblob = new Blob(audioChunks, { 'type': 'audio/wav' });
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL(audioblob);
                    fileReader.onload = function (ev) {
                        voice.push(fileReader.result);
                        //console.log(ev)
                    };
                });

                setTimeout(() => {
                    mediaRecorder.stop();
                    console.log("Recording Finished");
                    $("#audio").html("Recording Finished (" + (voice.length + 1) + "/3)");
                    recording = !recording;
                }, 3000);
            });
    }
    else if (voice.length > 2) {
        console.log("Have already collected the correct number of recordings");
        $("#audio").html("Total recordings hava already been collected")
    }
    else {
        console.log("Recording already in progress, cannot record multiple files at once");
        recording = !recording
    }
}

function switchcamera() {
    var listDevices = [];
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        var arrayLength = devices.length;
        for (var i = 0; i < arrayLength; i++) {
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

function crop(img, box) {
    return new Promise((resolved, rejected) => {
        let cc = document.createElement('canvas')
        let ctx = cc.getContext('2d')
        let resize = faceapi.resizeResults(box, { width: width, height: height })
        let image = new Image;

        let bW = resize.box.width
        let bH = resize.box.height

        if (bW > bH) {
            cc.width = bW;
            cc.height = bW;
        } else {
            cc.height = bH
            cc.height = bH
        }

        image.onload = () => {
            ctx.drawImage(image, -resize.box.x, -resize.box.y, width, height)
            resolved(cc.toDataURL('image/jpg'))
        }

        image.src = img
    })
}

// Load models from folder
async function loadModel() {
    console.log("loading models")
    await faceapi.loadSsdMobilenetv1Model("/models")
    console.log("mobile net loaded")
    load.width("50%")
    await faceapi.loadTinyFaceDetectorModel("/models")
    console.log("tiny face loaded")
    load.width("100%")
    return
}

// Detect faces in video stream
async function detectFaces(img) {
    let detect = await faceapi.tinyFaceDetector(img)
    return { data: detect, image: img }
}

// Register a service worker to check for incoming notifications
async function register() {
    console.log('Registering service worker...');
    return await navigator.serviceWorker.
        register('http://localhost:8080/js/worker.js', { scope: '/js/' });
}

// Create a subscription to send to the server
async function subscribe(worker) {
    console.log("Creating subscription...")
    return await worker.pushManager.
        subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
}

// Helper function to parse vapid key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Run startup on window load
window.addEventListener('load', startup, false);