'use strict'

const axios = require('axios')

let marketInfo = (done) => {
    
    let results = {}
    let error = ''

    axios.request('https://api.bitfinex.com/v2/ticker/tIOTUSD')
    .then(response => {
        // console.log('IOTUSD returns:')
        // console.log(response.data)
        results.IOTUSD = response.data[6]
        results.IOTUSD_Volume = response.data[7]

        axios.request('https://api.bitfinex.com/v2/ticker/tIOTBTC')
        .then(response => {
            results.IOTBTC = response.data[6]
            results.IOTBTC_Volume = response.data[7]
            
            axios.request('https://api.bitfinex.com/v2/ticker/tIOTETH')
            .then(response => {
                results.IOTETH = response.data[6]
                results.IOTETH_Volume = response.data[7]
                done(error, results)
            })
            .catch(function (error) {
                console.log(error)
                done(error, results)
            })  
        })
        .catch(function (error) {
            console.log(error)
            done(error, results)
        })  
    })
    .catch(function (error) {
        console.log(error)
        done(error, results)
    })  

    
}

module.exports = marketInfo