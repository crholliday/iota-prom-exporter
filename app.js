'use strict'

const express = require('express')
const app = express()
const config = require('./config')
const promclient = require('prom-client')


let Gauge = promclient.Gauge
let Histogram = promclient.Histogram

let trades = {}
let zmqStats = {}

const nodeInfo = require('./nodeInfo')
const neighborInfo = require('./neighborInfo')

if (config.market_info_flag) {
    const marketInfoSocket = require('./marketInfoSocketRC')(trades)
}

// confirmation stats
if (config.zmq_url) {
    let zmqInfo = require('./zmq')

    // pruning routine
    if (config.retention_days) {
        const cron = require('node-cron')
        cron.schedule(`0 0 */${config.prune_interval_days} * *`, function () {
            zmqInfo.pruneDB((data) => {
                return
            })
        })
    }

    let confirmationTimeHist = new Histogram({
        name: 'iota_zmq_tx_confirm_time',
        help: 'Actual seconds it takes to confirm each tx',
        buckets: config.confirm_time_buckets
    })

    zmqInfo.processZmq(zmqStats, confirmationTimeHist)

    app.get('/getHistogram', function (req, res) {
        zmqInfo.getHistogram((data) => {
            res.send((data))
        })
    })

    app.get('/getSeenButNotConfirmed', function (req, res) {
        zmqInfo.getSeenButNotConfirmed((data) => {
            res.send((data))
        })
    })

    app.get('/pruneDb', function (req, res) {
        zmqInfo.pruneDB((data) => {
            res.send((data))
        })
    })
}

let totalTransactions = new Gauge({
    name: 'iota_node_info_total_transactions_queued',
    help: 'Total open txs at the interval'
})
let totalTips = new Gauge({
    name: 'iota_node_info_total_tips',
    help: 'Total tips at the interval'
})
let totalNeighbors = new Gauge({
    name: 'iota_node_info_total_neighbors',
    help: 'Total neighbors at the interval'
})
let latestMilestone = new Gauge({
    name: 'iota_node_info_latest_milestone',
    help: 'Tangle milestone at the interval'
})
let latestSolidSubtangleMilestone = new Gauge({
    name: 'iota_node_info_latest_subtangle_milestone',
    help: 'Subtangle milestone at the interval'
})
let newTransactions = new Gauge({
    name: 'iota_neighbors_new_transactions',
    help: 'New transactions by neighbor',
    labelNames: ['id']
})
let randomTransactions = new Gauge({
    name: 'iota_neighbors_random_transactions',
    help: 'Random transactions by neighbor',
    labelNames: ['id']
})
let allTransactions = new Gauge({
    name: 'iota_neighbors_all_transactions',
    help: 'All transactions by neighbor',
    labelNames: ['id']
})
let invalidTransactions = new Gauge({
    name: 'iota_neighbors_invalid_transactions',
    help: 'Invalid transactions by neighbor',
    labelNames: ['id']
})
let sentTransactions = new Gauge({
    name: 'iota_neighbors_sent_transactions',
    help: 'Transactions sent to neighbor',
    labelNames: ['id']
})
let activeNeighbors = new Gauge({
    name: 'iota_neighbors_active_neighbors',
    help: 'Number of neighbors who are active'
})

// market info stuff
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


// zmq stuff
let seenTxs = new Gauge({
    name: 'iota_zmq_seen_tx_count',
    help: 'Count of transactions seen by zeroMQ'
})
let txsWithValue = new Gauge({
    name: 'iota_zmq_txs_with_value_count',
    help: 'Count of transactions seen by zeroMQ that have a non-zero value'
})
let confirmedTxs = new Gauge({
    name: 'iota_zmq_confirmed_tx_count',
    help: 'Count of transactions confirmed by zeroMQ'
})
let toProcess = new Gauge({
    name: 'iota_zmq_to_process',
    help: 'toProcess from RSTAT output of ZMQ'
})
let toBroadcast = new Gauge({
    name: 'iota_zmq_to_broadcast',
    help: 'toBroadcast from RSTAT output of ZMQ'
})
let toRequest = new Gauge({
    name: 'iota_zmq_to_request',
    help: 'toRequest from RSTAT output of ZMQ'
})
let toReply = new Gauge({
    name: 'iota_zmq_to_reply',
    help: 'toReply from RSTAT output of ZMQ'
})
let totalTransactionsRs = new Gauge({
    name: 'iota_zmq_total_transactions',
    help: 'totalTransactions from RSTAT output of ZMQ'
})

app.get('/metrics', async (req, res) => {

    newTransactions.reset()
    invalidTransactions.reset()
    allTransactions.reset()
    randomTransactions.reset()
    sentTransactions.reset()

    try {
        const [nodeResults, neighborResults] = await Promise.all([nodeInfo(), neighborInfo()])

        // node info
        if (nodeResults && typeof nodeResults.transactionsToRequest !== 'undefined') {
            totalTransactions.set(nodeResults.transactionsToRequest)
            totalTips.set(nodeResults.tips)
            totalNeighbors.set(nodeResults.neighbors)
            latestMilestone.set(nodeResults.latestMilestoneIndex)
            latestSolidSubtangleMilestone.set(nodeResults.latestSolidSubtangleMilestoneIndex)
        }

        // neighbor info
        if (neighborResults && neighborResults.length > 0) {
            let connectedNeighbors = 0
            neighborResults.forEach((r) => {
                newTransactions.set({
                    id: r.address
                }, r.numberOfNewTransactions)
                invalidTransactions.set({
                    id: r.address
                }, r.numberOfInvalidTransactions)
                allTransactions.set({
                    id: r.address
                }, r.numberOfAllTransactions)
                randomTransactions.set({
                    id: r.address
                }, r.numberOfRandomTransactionRequests)
                sentTransactions.set({
                    id: r.address
                }, r.numberOfSentTransactions)
                if (r.numberOfNewTransactions + r.numberOfInvalidTransactions + r.numberOfAllTransactions + r.numberOfRandomTransactionRequests) {
                    connectedNeighbors += 1
                }
            })
            activeNeighbors.set(connectedNeighbors)
        }

        // market info
        if (config.market_info_flag) {
            if (trades.IOTBTC) {
                tradePrice.set({
                    pair: 'IOTUSD'
                }, trades.IOTUSD.price)
                tradeVolume.set({
                    pair: 'IOTUSD'
                }, Number(trades.IOTUSD.volume))
                tradePrice.set({
                    pair: 'IOTEUR'
                }, trades.IOTEUR.price)
                tradeVolume.set({
                    pair: 'IOTEUR'
                }, Number(trades.IOTEUR.volume))
                tradePrice.set({
                    pair: 'IOTBTC'
                }, trades.IOTBTC.price)
                tradeVolume.set({
                    pair: 'IOTBTC'
                }, Number(trades.IOTBTC.volume))
                tradePrice.set({
                    pair: 'IOTETH'
                }, trades.IOTETH.price)
                tradeVolume.set({
                    pair: 'IOTETH'
                }, Number(trades.IOTETH.volume))
                tradePrice.set({
                    pair: 'BTCUSD'
                }, trades.BTCUSD.price)
                tradeVolume.set({
                    pair: 'BTCUSD'
                }, Number(trades.BTCUSD.volume))
                tradePrice.set({
                    pair: 'BTCEUR'
                }, trades.BTCEUR.price)
                tradeVolume.set({
                    pair: 'BTCEUR'
                }, Number(trades.BTCEUR.volume))
                tradePrice.set({
                    pair: 'ETHUSD'
                }, trades.ETHUSD.price)
                tradeVolume.set({
                    pair: 'ETHUSD'
                }, Number(trades.ETHUSD.volume))
            }
        }

        if (config.zmq_url) {
            // zmq info
            seenTxs.set(zmqStats.seenTxs || 0)
            txsWithValue.set(zmqStats.txsWithValue || 0)
            confirmedTxs.set(zmqStats.confirmedTxs || 0)

            // Rstats info
            if (zmqStats.rstats) {
                toProcess.set(Number(zmqStats.rstats.toProcess) || 0)
                toBroadcast.set(Number(zmqStats.rstats.toBroadcast) || 0)
                toRequest.set(Number(zmqStats.rstats.toRequest) || 0)
                toReply.set(Number(zmqStats.rstats.toReply) || 0)
                totalTransactionsRs.set(Number(zmqStats.rstats.totalTransactions) || 0)
            }
        }

        res.end(promclient.register.metrics())

    } catch (error) {
        console.log(error)
        res.end()
    }
})

app.listen(config.bind_port, config.bind_address, () => {
    console.log('Listening on:', config.bind_port)
})