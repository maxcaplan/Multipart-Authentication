const express = require('express')
const app = express()
const port = process.env.npm_package_config_myPort || 8080

// app.get('/', (req, res) => res.send('Hello World!'))

app.use(express.static('public'))

app.listen(port, () => console.log(`Listening on port ${port}`))   