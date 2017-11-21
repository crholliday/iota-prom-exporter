'use strict'

const axios = require('axios')

let marketInfo = async () => {

    let results = {}
    
    try {
        const [usdData, btcData, ethData, btcUsdData] = await Promise.all([
            axios.request('https://api.bitfinex.com/v2/ticker/tIOTUSD'), 
            axios.request('https://api.bitfinex.com/v2/ticker/tIOTBTC'),
            axios.request('https://api.bitfinex.com/v2/ticker/tIOTETH'),
            axios.request('https://api.bitfinex.com/v2/ticker/tBTCUSD')
        ])

        results.IOTUSD = usdData.data[6]
        results.IOTUSD_Volume = usdData.data[7]

        results.IOTBTC = btcData.data[6]
        results.IOTBTC_Volume = btcData.data[7]

        results.IOTETH = ethData.data[6]
        results.IOTETH_Volume = ethData.data[7]

        results.BTCUSD = btcUsdData.data[6]
        results.BTCUSD_Volume = btcUsdData.data[7]

        return results
    }
    catch (err) {
        console.log('Market Info error...')
        console.log(err)
        return err
    }    
}

module.exports = marketInfo