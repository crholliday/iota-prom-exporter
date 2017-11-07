'use strict'

const axios = require('axios')

let marketInfo = (done) => {
    
    let results = {}
    let error = ''

    axios.request('https://api.bitfinex.com/v2/ticker/tIOTUSD')
    .then(response => {
        results = response.data
        done(error, results)
    })
    .catch(function (error) {
        console.log(error)
        done(error, results)
    })  

    
}

module.exports = marketInfo