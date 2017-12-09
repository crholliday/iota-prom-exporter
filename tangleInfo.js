'use strict'

const request = require('request')
const csv = require('csvtojson')
const config = require('./config')
const axios = require('axios')

let tangleStuff = {}

let tangleInfo = async () => {

    let totalTransactions = await axios.post(config.iota_node_url, 
        {command: 'tangleStuff.getTotalTransactions'},
        {headers: {'X-IOTA-API-Version': '1.4.1'}}
    )

    tangleStuff.totalTransactions = totalTransactions.data.ixi.totalTransactions

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
            .on('done',(error)=>{
                reject(error)
            })
    })

    tangleStuff.totalTx = txs.field3
    tangleStuff.confirmedTx = txs.field4

    return tangleStuff
}

module.exports = tangleInfo