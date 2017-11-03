'use strict'

let IOTA = require('iota.lib.js')
let config = require('./config')
const iota = new IOTA({'provider': config.iota_node_url})

let nodeInfo = (done) => {

    let results = {}

    iota.api.getNodeInfo(function (error, success) {
        if (error) {
            console.log('error in getNodeInfo api call... ')
            console.log(error)
        } else {
            results = success
        }
        done(error, results)
    })   
}

module.exports = nodeInfo