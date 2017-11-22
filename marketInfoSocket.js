const ws = require('ws')
const w = new ws('wss://api.bitfinex.com/ws/2', { restart: true })
const set = require('lodash.set')

module.exports = (trades) => {

    let btcUsdMsg = ({
        event: 'subscribe',
        channel: 'ticker',
        symbol: 'tBTCUSD'
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

    w.on('open', () => {

        console.log('Connected to Bitfinex websocket')

        w.send(JSON.stringify(btcUsdMsg))
        w.send(JSON.stringify(iotBtcMsg))
        w.send(JSON.stringify(iotUsdMsg))
        w.send(JSON.stringify(iotEthMsg))
        w.send(JSON.stringify(ethUsdMsg))

    })

    w.on('message', (msg) => {
        let data = JSON.parse(msg)
        if (data.event === 'subscribed') {
            if (data.pair === 'BTCUSD') {
                set(trades, 'BTCUSD.channelID', data.chanId)
            } else if (data.pair === 'IOTBTC') {
                set(trades, 'IOTBTC.channelID', data.chanId)
            } else if (data.pair === 'IOTUSD') {
                set(trades, 'IOTUSD.channelID', data.chanId)
            } else if (data.pair === 'IOTETH') {
                set(trades, 'IOTETH.channelID', data.chanId)
            } else if (data.pair === 'ETHUSD') {
                set(trades, 'ETHUSD.channelID', data.chanId)
            }
        }
        if (data.length === 2 && data[1] !== 'hb') {
            if (data[0] === trades.BTCUSD.channelID) {
                trades.BTCUSD.price = data[1][6]
                trades.BTCUSD.volume = data[1][7]
            } else if (data[0] === trades.IOTBTC.channelID) {
                trades.IOTBTC.price = data[1][6]
                trades.IOTBTC.volume = data[1][7]
            } else if (data[0] === trades.IOTUSD.channelID) {
                trades.IOTUSD.price = data[1][6]
                trades.IOTUSD.volume = data[1][7]
            } else if (data[0] === trades.IOTETH.channelID) {
                trades.IOTETH.price = data[1][6]
                trades.IOTETH.volume = data[1][7]
            } else if (data[0] === trades.ETHUSD.channelID) {
                trades.ETHUSD.price = data[1][6]
                trades.ETHUSD.volume = data[1][7]
            }
        }
    })

    w.on('error', (err) => {
        console.log('Error from Bitfinex websocket: ', err)

    })

    w.on('close', (event) => {
        console.log('Disconnected from Bitfinex websocket ...')
        console.log(event)

        setTimeout(function () {
            try {
                console.log('Connection died, dumping process so PM2 restarts... ')
                process.exit()
            } catch (err) {
                console.error('Socket reconnect failed...', err)
            }
        }, 3000)
    })
}
