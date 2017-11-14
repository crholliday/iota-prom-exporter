'use strict'

let IOTA = require('iota.lib.js')
let config = require('./config')
const iota = new IOTA({'provider': config.iota_node_url})
const i = require('iotap').create(iota)

let neighbhorInfo = async () => {

    try {
        const info = await i.getNeighbors()
        return info
    } catch (error) {
        return error
    }
}

module.exports = neighbhorInfo