'use strict'

const express = require('express')
const app = express()
const promclient = require('prom-client')
let Gauge = promclient.Gauge

const nodeInfo = require('./nodeInfo')
const neighborInfo = require('./neighborInfo')
const tangleInfo = require('./tangleInfo')
const marketInfo = require('./marketInfo')

let totalTransactions = new Gauge({ name: 'iota_node_info_total_transactions_queued', help: 'Total open txs at the interval' })
let totalTips = new Gauge({ name: 'iota_node_info_total_tips', help: 'Total tips at the interval' })
let totalNeighbors = new Gauge({ name: 'iota_node_info_total_neighbors', help: 'Total neighbors at the interval' })
let latestMilestone = new Gauge({ name: 'iota_node_info_latest_milestone', help: 'Tangle milestone at the interval' })
let latestSolidSubtangleMilestone = new Gauge({ name: 'iota_node_info_latest_subtangle_milestone', help: 'Subtangle milestone at the interval' })
let newTransactions = new Gauge({ name: 'iota_neighbors_new_transactions', help: 'New transactions by neighbor', labelNames: ['id'] })
let randomTransactions = new Gauge({ name: 'iota_neighbors_random_transactions', help: 'Random transactions by neighbor', labelNames: ['id'] })
let allTransactions = new Gauge({ name: 'iota_neighbors_all_transactions', help: 'All transactions by neighbor', labelNames: ['id'] })
let invalidTransactions = new Gauge({ name: 'iota_neighbors_invalid_transactions', help: 'Invalid transactions by neighbor', labelNames: ['id'] })
let activeNeighbors = new Gauge({ name: 'iota_neighbors_active_neighbors', help: 'Number of neighbors who are active' })
let totalTx = new Gauge({ name: 'iota_tangle_total_txs', help: 'Number of total transaction from the whole tangle' })
let confirmedTx = new Gauge({ name: 'iota_tangle_confirmed_txs', help: 'Number of confirmed transactions from the whole tangle' })
let tradePrice = new Gauge({ name: 'iota_market_trade_price', help: 'Latest price from Bitfinex', labelNames: ['pair'] })
let tradeVolume = new Gauge({ name: 'iota_market_trade_volume', help: 'Latest volume from Bitfinex', labelNames: ['pair'] })

app.get('/metrics', (req, res) => {
    console.log('.')

    async function getResults() {

        // needed to clear out neighbors that hung around after they were removed
        // Might be related to the prometheus JS client library and labels
        // Todo: Figure out why this happens
        newTransactions.reset()
        invalidTransactions.reset()
        allTransactions.reset()
        randomTransactions.reset()

        try {
            const [nodeResults, neighborResults, tangleResults, marketResults] = await Promise.all([nodeInfo(), neighborInfo(), tangleInfo(), marketInfo()])

            // node info
            totalTransactions.set(nodeResults.transactionsToRequest)
            totalTips.set(nodeResults.tips)
            totalNeighbors.set(nodeResults.neighbors)
            latestMilestone.set(nodeResults.latestMilestoneIndex)
            latestSolidSubtangleMilestone.set(nodeResults.latestSolidSubtangleMilestoneIndex)

            // neighbor info
            let connectedNeighbors = 0
            neighborResults.forEach((r) => {
                newTransactions.set({ id: r.address }, r.numberOfNewTransactions)
                invalidTransactions.set({ id: r.address }, r.numberOfInvalidTransactions)
                allTransactions.set({ id: r.address }, r.numberOfAllTransactions)
                randomTransactions.set({ id: r.address }, r.numberOfRandomTransactionRequests)
                if (r.numberOfNewTransactions + r.numberOfInvalidTransactions + r.numberOfAllTransactions + r.numberOfRandomTransactionRequests) {
                    connectedNeighbors += 1
                }
            })
            activeNeighbors.set(connectedNeighbors)

            // tangle info
            totalTx.set(parseInt(tangleResults.field3))
            confirmedTx.set(parseInt(tangleResults.field4))

            // market info
            tradePrice.set({ pair: 'IOTUSD' }, marketResults.IOTUSD)
            tradeVolume.set({ pair: 'IOTUSD' }, Number(marketResults.IOTUSD_Volume))
            tradePrice.set({ pair: 'IOTBTC' }, marketResults.IOTBTC)
            tradeVolume.set({ pair: 'IOTBTC' }, Number(marketResults.IOTBTC_Volume))
            tradePrice.set({ pair: 'IOTETH' }, marketResults.IOTETH)
            tradeVolume.set({ pair: 'IOTETH' }, Number(marketResults.IOTETH_Volume))
            tradePrice.set({ pair: 'BTCUSD' }, marketResults.BTCUSD)
            tradeVolume.set({ pair: 'BTCUSD' }, Number(marketResults.BTCUSD_Volume))
            tradePrice.set({ pair: 'ETHUSD' }, marketResults.ETHUSD)
            tradeVolume.set({ pair: 'ETHUSD' }, Number(marketResults.ETHUSD_Volume))

            res.end(promclient.register.metrics())

        } catch (error) {
            console.log(error)
            res.end()
        }
    }
    getResults()
})

app.listen(9311, () => {
    console.log('Listening on:', 9311)
})
