'use strict'

const express = require('express')
const app = express()
const config = require('./config')
const promclient = require('prom-client')

if (config.zmq_url) {
    let zmqInfo = require('./zmq/zmq.js')(promclient, config)
    let api = require('./zmq/api.js')(config)

    app.get('/getSeenButNotConfirmed', function (req, res) {
        api.getSeenButNotConfirmed((data) => {
            res.send((data))
        })
    })

    app.get('/pruneDb', function (req, res) {
        api.pruneDB((data) => {
            res.send((data))
        })
    })

    app.get('/getHistogram', function (req, res) {
        api.getHistogram((data) => {
            res.send((data))
        })
    })
}


if (config.market_info_flag) {
    let marketInfo = require('./marketInfo/marketInfoSocketRC.js')(promclient, config)
}

let nodeInfo = require('./nodeInfo/nodeInfo.js')(promclient, config)
let neighborInfo = require('./neighborInfo/neighborInfo.js')(promclient, config)

app.get('/metrics', async (req, res) => {
    const [nodeResults,
           neighborResults] = await Promise.all([
        nodeInfo.getNodeInfo(),
        neighborInfo.getNeighborInfo()
    ])
    res.end(promclient.register.metrics())
})

app.listen(config.bind_port, config.bind_address, () => {
    console.log('Listening on:', config.bind_port)
})
