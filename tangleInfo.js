'use strict'

const request = require('request')
const csv = require('csvtojson')

let tangleInfo = async () => {

    return new Promise(function (resolve, reject) {
        csv({
            noheader: true,
            trim: true,
            delimiter: '|'
        })
            .fromStream(request.get('http://analytics.iotaledger.net/stresstest.table'))
            .on('end_parsed', (jsonObj) => {
                resolve(jsonObj[jsonObj.length - 2])
            })
            .on('done',(error)=>{
                reject(error)
            })
    })
}

module.exports = tangleInfo