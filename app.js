'use strict'

const express = require('express')
const app = express()
const config = require('./config')
const promclient = require('prom-client')
let zmqInfo = require('./zmq/zmq.js')(promclient, config)

app.get('/metrics', async (req, res) => {
    res.end(promclient.register.metrics())
})

app.listen(config.bind_port, config.bind_address, () => {
    console.log('Listening on:', config.bind_port)
})
