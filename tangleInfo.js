'use strict'

const request=require('request')
const csv=require('csvtojson')

let tangleInfo = (done) => {

    let results = {}

    csv({
        noheader:true,
        trim:true,
        delimiter: '|'
    })
    .fromStream(request.get('http://analytics.iotaledger.net/stresstest.table'))
    .on('end_parsed',(jsonObj)=>{
        results = jsonObj[jsonObj.length - 2]
        // console.log(results)  
        done(results)
    })    
}

module.exports = tangleInfo