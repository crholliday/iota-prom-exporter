'use strict'

const request = require('request')
const csv = require('csvtojson')
const config = require('./config')

let tangleInfo = async () => {

    return new Promise(function (resolve, reject) {
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
}

module.exports = tangleInfo