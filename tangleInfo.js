'use strict'

const request = require('request')
const csv = require('csvtojson')
const config = require('./config')

let tangleStuff = {}

let tangleInfo = async () => {

    let txs = await new Promise(function (resolve, reject) {
        csv({
            noheader: true,
            trim: true,
            delimiter: '|'
        })
            .fromStream(request.get(config.stresstest_table_url))
            .on('end_parsed', (jsonObj) => {
                resolve(jsonObj[jsonObj.length - 2])
            })
            .on('error', (error) => {
                reject(error)
            })
            .on('done',(error)=>{
                reject(error)
            })
    })

    tangleStuff.totalTx = txs.field3
    tangleStuff.confirmedTx = txs.field4

    return tangleStuff
}

module.exports = tangleInfo
