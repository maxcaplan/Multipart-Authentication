const express = require('express')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const fs = require('fs')
const ncp = require('ncp')

ncp.limit = 20

const app = express()
const port = process.env.npm_package_config_port || 8080

// app.get('/', (req, res) => res.send('Hello World!'))

var db

MongoClient.connect('mongodb+srv://admin:henryschien2019@multipart-authentication-m7xcq.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }, (err, client) => {
    if (err) {
        fallback(err)
    } else {
        app.use(express.static('public'))
        app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

        db = client.db('multipart-authentication')


        // Test write to database
        app.post('/api/test', function (req, res) {
            db.collection('test').insertOne(req.body, (err, result) => {
                if (err) return console.log(err)

                console.log('saved to database')
                res.redirect('/')
            })
        })

        // Test fetch from database 
        app.get('/api/test/get', function (req, res) {
            console.log("fetching from database")
            db.collection('test').find().toArray(function (err, results) {
                if (err) return console.log(err)

                res.send(results)
            })
        })


        app.post('/api/photo', function (req, res) {
            if (req.body.data == false) {
                return res.status(400).send('No files were uploaded.');
            }

            db.collection('users').find({ "name": req.body.name }).toArray(function (err, results) {
                if (err) return console.log(err)

                if (results == false) {
                    let parentDir = "./users/" + req.body.name + "/"
                    let trainDir = parentDir + "training/"
                    let validationDir = parentDir + "validation/"

                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir)
                        fs.mkdirSync(validationDir)
                        fs.mkdirSync(trainDir)
                        fs.mkdirSync(validationDir + "user/")
                        fs.mkdirSync(trainDir + "user/")
                        fs.mkdirSync(validationDir + "not/")
                        fs.mkdirSync(trainDir + "not/")
                    }

                    for (let i = 0; i < req.body.data.length; i++) {
                        var string = req.body.data[i]
                        var regex = /^data:.+\/(.+);base64,(.*)$/;

                        var matches = string.match(regex);
                        var ext = matches[1];
                        var data = matches[2];
                        var buffer = Buffer.from(data, 'base64');
                        if (i > 6) {
                            fs.writeFileSync(validationDir + "user/" + req.body.name + i + '.' + ext, buffer);
                        } else {
                            fs.writeFileSync(trainDir + "user/" + req.body.name + i + '.' + ext, buffer);
                        }
                    }

                    // add none user images to training and validation
                    ncp("./randomImages", trainDir + "not/", (err) => {
                        if (err) {
                            res.send(err)
                        } else {
                            ncp("./randomImages", validationDir + "not/", (err) => {
                                if (err) {
                                    res.send(err)
                                } else {
                                    res.send('done')
                                }
                            })
                        }
                    })
                } else {
                    res.status(409).send("account already exists")
                }
            })
        });

        // Test write to database
        app.post('/api/info', function (req, res) {
            let name = req.body.name
            let data = {
                name: name,
                trainDir: "training/users/" + name + "/",
                validationDir: "validation/users/" + name + "/",
                modelDir: "models/" + name + "/",
            }
            db.collection('users').insertOne(data, (err, result) => {
                if (err) return console.log(err)

                console.log('saved to database')
                res.redirect('/')
            })
        })

        app.get('*', function (req, res) {
            // res.send('page not found');
            res.redirect('/')
        });

        app.listen(port, () => console.log(`Listening on port ${port}`))
    }
})

function fallback(error) {
    console.log(error)
    console.log("error connecting to server using fallback")

    app.use(express.static('fallback'))

    app.listen(port, () => console.log(`Listening on port ${port}`))
}