const Html5WebSocket = require('html5-websocket')
const ReconnectingWebSocket = require('reconnecting-websocket')
const options = {connectionTimeout: 1000, constructor: Html5WebSocket}
const w = new ReconnectingWebSocket('wss://api.bitfinex.com/ws/2', undefined, options)
const set = require('lodash.set')

module.exports = (promclient) => {

    let trades = {}

    let Gauge = promclient.Gauge

    let tradePrice = new Gauge({
        name: 'iota_market_trade_price',
        help: 'Latest price from Bitfinex',
        labelNames: ['pair']
    })
    let tradeVolume = new Gauge({
        name: 'iota_market_trade_volume',
        help: 'Latest volume from Bitfinex',
        labelNames: ['pair']
    })

    let btcUsdMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tBTCUSD'
    })
    
    let btcEurMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tBTCEUR'
    })
    
    let iotBtcMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tIOTBTC'
    })

    let iotUsdMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tIOTUSD'
    })

    let iotEurMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tIOTEUR'
    })

    let iotEthMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tIOTETH'
    })

    let ethUsdMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tETHUSD'
    })

    w.addEventListener('open', () => {

        console.log('Connected to Bitfinex websocket')

        w.send(JSON.stringify(btcUsdMsg))
        w.send(JSON.stringify(btcEurMsg))
        w.send(JSON.stringify(iotBtcMsg))
        w.send(JSON.stringify(iotUsdMsg))
        w.send(JSON.stringify(iotEurMsg))
        w.send(JSON.stringify(iotEthMsg))
        w.send(JSON.stringify(ethUsdMsg))

    })

    w.addEventListener('message', (msg) => {
        let data = JSON.parse(msg.data)
        if (data.event === 'subscribed') {
            if (data.pair === 'BTCUSD') {
                set(trades, 'BTCUSD.channelID', data.chanId)
            } else if (data.pair === 'BTCEUR') {
                set(trades, 'BTCEUR.channelID', data.chanId)
            } else if (data.pair === 'IOTBTC') {
                set(trades, 'IOTBTC.channelID', data.chanId)
            } else if (data.pair === 'IOTUSD') {
                set(trades, 'IOTUSD.channelID', data.chanId)
            } else if (data.pair === 'IOTEUR') {
                set(trades, 'IOTEUR.channelID', data.chanId)
            } else if (data.pair === 'IOTETH') {
                set(trades, 'IOTETH.channelID', data.chanId)
            } else if (data.pair === 'ETHUSD') {
                set(trades, 'ETHUSD.channelID', data.chanId)
            }
        }
        if (data.length === 2 && data[1] !== 'hb') {
            if (data[0] === trades.BTCUSD.channelID) {
                tradePrice.set({
                    pair: 'BTCUSD'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'BTCUSD'
                }, Number(data[1][7]))
            } else if (data[0] === trades.BTCEUR.channelID) {
                tradePrice.set({
                    pair: 'BTCEUR'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'BTCEUR'
                }, Number(data[1][7]))
            } else if (data[0] === trades.IOTBTC.channelID) {
                tradePrice.set({
                    pair: 'IOTBTC'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'IOTBTC'
                }, Number(data[1][7]))
            } else if (data[0] === trades.IOTUSD.channelID) {
                tradePrice.set({
                    pair: 'IOTUSD'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'IOTUSD'
                }, Number(data[1][7]))
            } else if (data[0] === trades.IOTEUR.channelID) {
                tradePrice.set({
                    pair: 'IOTEUR'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'IOTEUR'
                }, Number(data[1][7]))
            } else if (data[0] === trades.IOTETH.channelID) {
                tradePrice.set({
                    pair: 'IOTETH'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'IOTETH'
                }, Number(data[1][7]))
            } else if (data[0] === trades.ETHUSD.channelID) {
                tradePrice.set({
                    pair: 'ETHUSD'
                }, data[1][6])
                tradeVolume.set({
                    pair: 'ETHUSD'
                }, Number(data[1][7]))
            }
        }
    })

    w.addEventListener('close', () => {
        console.log('Disconnected from Bitfinex websocket ...')
    })
}
