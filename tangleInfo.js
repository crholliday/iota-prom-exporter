'use strict'

const request = require('request')
const csv = require('csvtojson')
const config = require('./config')

let tangleStuff = {}

let tangleInfo = (cb) => {
    csv({
            noheader: true,
            trim: true,
            delimiter: '|'
        })
        .fromStream(request.get(
                config.stresstest_table_url)
            .on('error', (error) => {
                console.log(`Unable to connect to : ${config.stresstest_table_url}`)
            }))
        .on('end_parsed', (jsonObj) => {
            let txs = jsonObj[jsonObj.length - 2]
            if (txs) {
                tangleStuff.totalTx = txs.field3 || 0
                tangleStuff.confirmedTx = txs.field4 || 0
                cb(tangleStuff)
            } else {
                console.log('Something failed on the request to the stresstest table')
                cb(null)
            }
        })
        .on('error', (error) => {
            console.log('Error in request: ', error)
        })
        // .on('done', (error) => {
        // })
}

module.exports = tangleInfo
