require('dotenv').config();

const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const webPush = require('web-push');
const { PythonShell } = require("python-shell");
const fs = require('fs');
const rimraf = require("rimraf");
const ncp = require('ncp');
const readline = require('readline');

ncp.limit = 20;

const app = express();
const port = process.env.npm_package_config_port || 8080;
// app.get('/', (req, res) => res.send('Hello World!'))

// let test = new PythonShell('./python/predict.py')

// let img = fs.readFileSync('./users/Max Caplan/validation/user/Max Caplan19.png')
// test.send(JSON.stringify({ image: Buffer.from(img).toString('base64'), model: "./models/Max Caplan/1560449717.4126756.h5" }))

// test.on('message', (message) => {
//     console.log(message)
// })

webPush.setVapidDetails('mailto:maxacaplan@gmail.com', process.env.PUBLIC_KEY, process.env.PRIVATE_KEY);

var db;

MongoClient.connect(process.env.DB_URL, { useNewUrlParser: true }, (err, client) => {
    if (err) {
        fallback(err)
    } else {
        // Command line interface for deleting users
        var rl = readline.createInterface(process.stdin, process.stdout);

        rl.on('line', (line) => {
            if (line == "delUser") {
                rl.question("Input users name: ", (name) => {
                    if (name) {
                        rl.question("Are you sure? (Y/n)", (answer) => {
                            if (answer == "Y" || answer == "y") {
                                if (fs.existsSync("./users/" + name)) {
                                    console.log("deleting user: " + name);
                                    rimraf.sync("./users/" + name);
                                    console.log("Users images deleted");
                                    rimraf.sync("./models/" + name);
                                    console.log("Users models deleted");
                                    db.collection('users').deleteOne({ "name": name });
                                    console.log("User removed from database")
                                } else {
                                    console.log("User does not exist \naborted")
                                }
                            } else {
                                console.log("aborted")
                            }
                        })
                    } else {
                        console.log("aborted")
                    }
                })
            }
        });

        app.use(bodyParser.json());

        app.post('/subscribe', (req, res) => {
            const subscription = req.body;
            res.status(201).json({});
            const payload = JSON.stringify({ title: 'test', body: 'Test Body Text', url: '/' });

            console.log("Sending Notification");

            webPush.sendNotification(subscription, payload).catch(error => {
                console.error(error.stack);
            });
        });

        app.post('/register', (req, res) => {
            res.sendStatus(201);
        })

        app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
        app.use(express.static('public'));

        db = client.db('multipart-authentication');

        // Test write to database
        app.post('/api/test', function (req, res) {
            db.collection('test').insertOne(req.body, (err, result) => {
                if (err) return console.log(err);

                console.log('saved to database');
                res.redirect('/')
            })
        });

        // Test fetch from database 
        app.get('/api/test/get', function (req, res) {
            console.log("fetching from database");
            db.collection('test').find().toArray(function (err, results) {
                if (err) return console.log(err);

                res.send(results)
            })
        });

        app.post('/api/signup', function (req, res) {
            var subscription = false;
            var payload = false;
            var host;

            if(server.address().address === "::") {
                host = 'localhost'
            } else {
                host = server.address().address
            }

            if (req.body.subscription !== false) {
                subscription = JSON.parse(req.body.subscription);
                payload = JSON.stringify({
                    title: 'Your Account is Ready!',
                    body: 'The Account ' + req.body.name + ' is ready to be used',
                    url: host + ':' + port + "/login.html"
                });
            }


            if (req.body.data === false) {
                return res.status(400).send('No files were uploaded.');
            }

            db.collection('users').find({ "name": req.body.name }).toArray(function (err, results) {
                if (err) return console.log(err);
                if (results.length === 0) {
                    console.log("Creating new directory in Database for user");
                    let parentDir = "./users/" + req.body.name + "/";
                    let trainDir = parentDir + "training/";
                    let validationDir = parentDir + "validation/";
                    let audioDir = parentDir + "audio/";
                    let gmmDir = parentDir + "gmm-model/";

                    let data = {
                        name: req.body.name,
                        trainDir: trainDir,
                        validationDir: validationDir,
                        modelDir: "models/" + req.body.name + "/",
                        audioDir: audioDir,
                        gmmDir: gmmDir,
                        subscription: subscription,
                    };

                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir);
                        fs.mkdirSync(validationDir);
                        fs.mkdirSync(trainDir);
                        fs.mkdirSync(audioDir);
                        fs.mkdirSync(gmmDir);
                        fs.mkdirSync(validationDir + "user/");
                        fs.mkdirSync(trainDir + "user/");
                        fs.mkdirSync(validationDir + "not/");
                        fs.mkdirSync(trainDir + "not/");
                    }

                    for (let i = 0; i < req.body.audio.length; i++) {
                        fs.writeFileSync(audioDir + (i + 1).toString() + '.wav', Buffer.from(req.body.audio[i].toString().replace('data:audio/wav;base64,', ''), 'base64'));
                    }

                    for (let i = 0; i < req.body.data.length; i++) {
                        var string = req.body.data[i];
                        var regex = /^data:.+\/(.+);base64,(.*)$/;

                        var matches = string.match(regex);
                        var ext = matches[1];
                        var imgData = matches[2];
                        var buffer = Buffer.from(imgData, 'base64');
                        if (i > 14) {
                            fs.writeFileSync(validationDir + "user/" + req.body.name + i + '.' + ext, buffer);
                        } else {
                            fs.writeFileSync(trainDir + "user/" + req.body.name + i + '.' + ext, buffer);
                        }
                    }

                    let gmmShell = new PythonShell('./voice-identifier/train_gmm.py');
                    gmmShell.send(JSON.stringify({name: req.body.name}));
                    gmmShell.on('message', (message) => {
                        console.log(message);
                    });

                    // add none user images to training and validation
                    ncp("./randomImages", trainDir + "not/", (err) => {
                        if (err) {
                            res.send(err)
                        } else {
                            ncp("./randomImages", validationDir + "not/", (err) => {
                                if (err) {
                                    res.send(err)
                                } else {
                                    console.log("Beginning training");
                                    res.redirect("/");
                                    // begin training face identification model
                                    let trainShell = new PythonShell('./python/train.py');
                                    trainShell.send(JSON.stringify({ name: req.body.name, trainingDir: trainDir, validationDir: validationDir, epochs: 10, plot: false, model: null }));
                                    trainShell.on('message', (message) => {
                                        if (message === 'done') {
                                            console.log("Training complete");
                                            db.collection('users').insertOne(data, (err, result) => {
                                                if (err) return console.log(err);
                                                console.log('saved to database');
                                                if (subscription !== false) {
                                                    console.log("Sending Notification");
                                                    webPush.sendNotification(subscription, payload).catch(error => {
                                                        console.error(error.stack);
                                                    });
                                                }
                                            })
                                        } else {
                                            console.log(message)
                                        }
                                    });
                                }
                            })
                        }
                    });
                } else {
                    res.status(409).send("account already exists");
                }
            })
        });

        app.post('/api/deleteUser', (req, res) =>{
            let name = req.body.username;
            if (fs.existsSync("./users/" + name)) {
                console.log("Deleting user: " + name);
                res.write("Deleting user: " + name + '\n');
                rimraf.sync("./users/" + name);
                console.log("Users images deleted");
                res.write("User images deleted\n");
                rimraf.sync("./models/" + name);
                console.log("Users models deleted");
                res.write("User models deleted\n");
                db.collection('users').deleteOne({ "name": name });
                console.log("User removed from database");
                res.write("User removed from database\n");
            } else {
                console.log("User does not exist \naborted");
                res.write("User does not exist \naborted");
            }
            res.end()
        });

        app.post('/api/checkUser', (req, res) => {
            db.collection('users').find({ "name": req.body.name }).toArray(function (err, results) {
                if (err) return console.log(err);
                if (results.length > 0) {
                    res.status(409).send("account already exists")
                } else {
                    res.status(200).send("done")
                }
            })
        });

        app.get('*', function (req, res) {
            res.redirect('/')
        });

        let server = app.listen(port, () => console.log(`Listening on port ${port}`));

        app.post('/api/faceLogin', (req, res) => {
            db.collection('users').find({"name": req.body.name}).toArray(function(err, results) {
                if (err) console.log(err);
                if (results.length === 0) {
                    console.log("Account does not exist, could not sign into specified name");
                    res.status(404).send("Account does not exist, could not sign into specified name")
                }
                else{
                    // check for existing directory and/or face comparison files and replace if need be
                    let parentDir = "./users/" + req.body.name + "/";
                    if(!fs.existsSync(parentDir + "faceComparison/")) {
                        fs.mkdirSync(parentDir + "faceComparison/");
                        console.log("'faceComparison' directory successfully created");
                        writeFaceComparisonFile(req);
                        console.log("'loginAttempt.png' has been successfully uploaded to the database")
                    }
                    else if(fs.existsSync(parentDir + 'faceComparison/') && !fs.existsSync(parentDir + 'faceComparison/loginAttempt.png')) {
                        console.log("'faceComparison' directory already exists");
                        writeFaceComparisonFile(req);
                        console.log("'loginAttempt.png' has been successfully added to the database");
                    }
                    else if(fs.existsSync(parentDir + 'faceComparison/loginAttempt.png')) {
                        console.log("'loginAttempt.png' already exists");
                        fs.unlinkSync(parentDir + 'faceComparison/loginAttempt.png');
                        console.log("Existing 'loginAttempt.png' has successfully been removed from the directory");
                        writeFaceComparisonFile(req);
                        console.log("New 'loginAttempt.png' has been successfully added to the database")
                    }
                }

                let model = req.body.model + "/" + fs.readdirSync(req.body.model);
                let img = fs.readFileSync("./users/" + req.body.name + "/faceComparison/loginAttempt.png");
                let faceShell = new PythonShell('./python/predict.py');
                faceShell.send(JSON.stringify({name: req.body.name,
                    image: Buffer.from(img).toString('base64'), model: model}));
                faceShell.on('message', (message) => {
                    console.log(message);
                    res.send(message)
                });
            });
        });

        app.post('/api/voiceLogin', (req, res) => {
            db.collection('users').find({"name": req.body.name}).toArray(function(err, results) {
                if (err) console.log(err);
                if (results.length === 0) {
                    console.log("Account does not exist, could not sign into specified name");
                    res.status(404).send("Account does not exist, could not sign into specified name")
                }
                else{
                    // check for existing directory and/or audio comparison files and replace if need be
                    let parentDir = "./users/" + req.body.name + "/";
                    if(!fs.existsSync(parentDir + 'audioComparison/')){
                        fs.mkdirSync(parentDir + 'audioComparison/');
                        console.log("'audioComparison' directory successfully created");
                        fs.writeFileSync(parentDir + 'audioComparison/loginAttempt.wav', Buffer.from(req.body.audio.toString().replace('data:audio/wav;base64,', ''), 'base64'));
                        console.log("'loginAttempt.wav' has been successfully uploaded to the database")
                    }
                    else if(fs.existsSync(parentDir + 'audioComparison/') && !fs.existsSync(parentDir + 'audioComparison/loginAttempt.wav')) {
                        fs.writeFileSync(parentDir + 'audioComparison/loginAttempt.wav', Buffer.from(req.body.audio.toString().replace('data:audio/wav;base64,', ''), 'base64'));
                        console.log("'audioComparison' directory already exists");
                        console.log("'loginAttempt.wav' has successfully been uploaded to the database")
                    }
                    else if(fs.existsSync(parentDir + 'audioComparison/loginAttempt.wav')) {
                        console.log("'loginAttempt.wav' already exists");
                        fs.unlinkSync(parentDir + 'audioComparison/loginAttempt.wav');
                        console.log("Existing 'loginAttempt.wav' has successfully been removed from directory");
                        fs.writeFileSync(parentDir + 'audioComparison/loginAttempt.wav', Buffer.from(req.body.audio.toString().replace('data:audio/wav;base64,', ''), 'base64'));
                        console.log("New 'loginAttempt.wav' has been successfully uploaded to the database")
                    }
                }
                let voiceShell = new PythonShell('./voice-identifier/recognize_voice.py');
                voiceShell.send(JSON.stringify( {name: req.body.name}));
                voiceShell.on('message', (message) => {
                    console.log(message);
                    res.send(message);
                });
            });
        });
    }
});

function writeFaceComparisonFile(req) {
    var string = req.body.image[0];
    var regex = /^data:.+\/(.+);base64,(.*)$/;

    var matches = string.match(regex);
    var ext = matches[1];
    var imgData = matches[2];
    var buffer = Buffer.from(imgData, 'base64');
    fs.writeFileSync( './users/' + req.body.name + '/faceComparison/loginAttempt.' + ext, buffer);
}

function fallback(error) {
    console.log(error);
    console.log("error connecting to server using fallback");

    app.use(express.static('fallback'));

    app.listen(port, () => console.log(`Listening on port ${port}`))
}