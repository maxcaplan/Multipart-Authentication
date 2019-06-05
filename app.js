const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')

const app = express()
const port = process.env.npm_package_config_myPort || 8080

// app.get('/', (req, res) => res.send('Hello World!'))

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));


app.post('/api/photo', function (req, res) {
    if (req.body.data == false) {
        return res.status(400).send('No files were uploaded.');
    }

    var string = req.body.data
    var regex = /^data:.+\/(.+);base64,(.*)$/;

    var matches = string.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = Buffer.from(data, 'base64');
    fs.writeFileSync('testImages/' + Date.now() + '.' + ext, buffer);

    res.send("done")
});

app.listen(port, () => console.log(`Listening on port ${port}`))   