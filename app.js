'use strict'

const express = require('express')
const app = express()
const config = require('./config/config.js')
const promclient = require('prom-client')

let zmqInfo = require('./zmq/zmq.js')(promclient, config)
let marketInfo = require('./marketInfo/marketInfoSocketRC.js')(promclient, config)
let nodeInfo = require('./nodeInfo/nodeInfo.js')(promclient, config)
let neighborInfo = require('./neighborInfo/neighborInfo.js')(promclient, config)

app.get('/metrics', async (req, res) => {

    const [nodeResults, neighborResults] = await Promise.all([nodeInfo.getNodeInfo(), neighborInfo.getNeighborInfo()])

    // console.log(nodeResults)
    // console.log(neighborResults)

    res.end(promclient.register.metrics())
})

app.listen(config.bind_port, config.bind_address, () => {
    console.log('Listening on:', config.bind_port)
})
