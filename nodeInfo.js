'use strict'

const IOTA = require('iota.lib.js')
const config = require('./config')
const iota = new IOTA({'provider': config.iota_node_url})
const i = require('iotap').create(iota)

let nodeInfo = async () => {

    try {
        const info = await i.getNodeInfo()
        return info
    } catch (error) {
        return error
    }
}

module.exports = nodeInfo
