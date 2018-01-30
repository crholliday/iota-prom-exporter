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
            .fromStream(request.get(
                config.stresstest_table_url)
                .on('error', (error) => {
                    console.log('Error in request: ', error)
                    resolve()
                }
            ))
            .on('end_parsed', (jsonObj) => {
                resolve(jsonObj[jsonObj.length - 2])
            })
            .on('error', (error) => {
                console.log('Error in request: ', error)
                resolve()
            })
            .on('done',(error)=>{
                resolve()
            })
    })

    tangleStuff.totalTx = txs.field3 || 0
    tangleStuff.confirmedTx = txs.field4 || 0

    return tangleStuff
}

module.exports = tangleInfo
