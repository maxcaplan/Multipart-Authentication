var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

var streaming = false;
var capturing = false;

// page elements
var collapse = null;
var video = null;
var flash = null
var captureBtn = null;
var uploadBtn = null;
var load = null

var pictures = []
var pNum = 20

function startup() {
    // get page elements
    collapse = $("#faceID")
    video = document.getElementById('videoElement');
    flash = $("#flash")
    captureBtn = $('#capture');
    uploadBtn = document.getElementById('upload');
    load = $('#modelLoad')

    let config = { video: true, audio: false }

    // let constraints = {
    //     width: 1280,
    //     height: 720,
    //     frameRate: 10, //mobile
    //     facingMode: {
    //         exact: "environment"
    //     } //mobile
    // }

    let m1 = navigator.getUserMedia
    let m2 = navigator.mozGetUserMedia
    let m3 = navigator.webkitGetUserMedia
    let m4 = navigator.msGetUserMedia

    navigator.getUserMedia = (m1 || m2 || m3 || m4)

    if (navigator.getUserMedia) {
        if (m1) {
            console.log("m1")
            navigator.mediaDevices.getUserMedia(config)
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                })
                .catch((err) => {
                    console.log(err)
                });
        } else if (m2) {
            console.log("m2")
            navigator.mozGetUserMedia(config, function (stream) {
                video.srcObject = stream;
                video.play();
            })
        } else if (m3) {
            navigator.webkitGetUserMedia(config).then((stream) => {
                video.srcObject = stream;
                video.play();
            })
        }
    } else {
        alert("your browser or device doesn't support media interface")
    }

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

            // Load Models and start checking for faces periodicly
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

                                        flash.removeClass('show');
                                        flash.addClass('show')
                                        flash.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                                            function (e) {
                                                flash.removeClass('show');
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
                }, 1000)
            })
        }
    }, false);

    captureBtn.click(function (ev) {
        capturing = !capturing
        if (capturing) {
            captureBtn.html(pictures.length + "/" + pNum + " Images <span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>")
        } else {
            captureBtn.html("Start Scanning Face")
        }

        ev.preventDefault();
    });



    uploadBtn.addEventListener('click', function (ev) {
        upload();
        ev.preventDefault(), false;
    })
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

function upload() {
    let name = $("#name")
    let errors = false

    if (name.val().length < 3) {
        name.tooltip('enable')
        name.tooltip('show')
        errors = true

        name.on('hidden.bs.tooltip', function () {
            name.tooltip('disable')
        })
    }

    if (pictures.length < pNum) {
        captureBtn.tooltip('enable')
        captureBtn.tooltip('show')
        errors = true

        captureBtn.on('hidden.bs.tooltip', function () {
            captureBtn.tooltip('disable')
        })
    }

    if (!errors) {
        console.log("uploading data")

        // send image to server
        $.ajax({
            url: '/api/data',    //api url
            type: 'POST',   //HTTP method
            data: {
                name: name.val(),
                data: pictures
            },
            success: function (response) {
                if (response) {
                    // on success send info to database
                    $.ajax({
                        url: '/api/info',
                        type: 'POST',
                        data: {
                            name: name.val()
                        },
                        success: function (response) {
                            console.log(response)
                            location.assign("/")
                        }
                    })
                }
            },
            error: function (exception) {
                console.log(exception)
                let msg = exception.responseJSON.error

                document.getElementById("errors").innerHTML = "<div class='alert alert-danger animated shake' role='alert'>" + msg + "</div>"
            }
        })
    }
}

window.addEventListener('load', startup, false);