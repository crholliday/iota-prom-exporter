'use strict'

const zmq = require('zeromq')
const transactions = require('../db').connect()

module.exports = (promclient, config) => {

    let Histogram = promclient.Histogram
    let Gauge = promclient.Gauge

    // zmq stuff
    let seenTxs = new Gauge({
        name: 'iota_zmq_seen_tx_count',
        help: 'Count of transactions seen by zeroMQ',
        labelNames: ['hasValue']
    })
    let txsWithValue = new Gauge({
        name: 'iota_zmq_txs_with_value_count',
        help: 'Count of transactions seen by zeroMQ that have a non-zero value'
    })
    let confirmedTxs = new Gauge({
        name: 'iota_zmq_confirmed_tx_count',
        help: 'Count of transactions confirmed by zeroMQ',
        labelNames: ['hasValue']
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

    let confirmationTimeHisto = new Histogram({
        name: 'iota_zmq_tx_confirm_time',
        help: 'Actual seconds it takes to confirm each tx',
        labelNames: ['hasValue'],
        buckets: config.confirm_time_buckets
    })

    let processNewSeenTransaction = async (tx, val) => {

        if (Number(val) !== 0) {
            txsWithValue.inc(1)
            seenTxs.inc({'hasValue': '<> 0'}, 1)
        } else {
            seenTxs.inc({'hasValue': '0'}, 1)
        }

        try {
            await transactions.put(tx, {
                seenDate: Date.now(),
                val: val
            })
        } catch (error) {
            console.log('Something is wrong with putting to LevelDB - the error is: ', error)
        }
    }

    let processNewConfirmedTransaction = async (tx) => {
        let hasVal = '0'
        try {
            const newConfirmed = await transactions.get(tx)
            let confirmMoment = Date.now()
            await transactions.put(tx, {
                'seenDate': newConfirmed.seenDate,
                'confirmedDate': confirmMoment,
                'val': newConfirmed.val || 0
            })
            hasVal = Number(newConfirmed.val) !== 0 ? '<> 0' : '0'
            confirmationTimeHisto.labels(hasVal).observe((confirmMoment - newConfirmed.seenDate) / 1000)
        } catch (error) {
            if (error.notFound) {
                await transactions.put(tx, {
                    confirmedDate: Date.now()
                })
            } else {
                console.log('Something is wrong with LevelDB - the error is: ', error)
            }
        }
        confirmedTxs.inc({'hasValue': hasVal}, 1)
    }

    let sock = zmq.socket('sub')
    // sets reconnect to 3 seconds
    sock.setsockopt(zmq.ZMQ_RECONNECT_IVL, 3000)
    // sets max reconnect interval to 30 seconds
    sock.setsockopt(zmq.ZMQ_RECONNECT_IVL_MAX, 30000)
    // ZMQ_RECONNECT_IVL_MAX
    sock.connect('tcp://' + config.zmq_url)
    // subscribe to all messages
    sock.subscribe('')
    // set monitoring to fire every half second
    sock.monitor(500, 0)
    // process every message

    let txCounter = 0
    let interval = 0
    let attempts = 0

    sock.on('message', (topic) => {
        let arr = topic.toString().split(' ')

        if (arr[0] === 'tx') {
            txCounter++
            if (txCounter % 100 === 0) {
                console.log('ZMQ Tx Count = ', txCounter)
            }
            processNewSeenTransaction(arr[1], arr[3])
        } else if (arr[0] === 'rstat') {
            toProcess.set(Number(arr[1]) || 0)
            toBroadcast.set(Number(arr[2]) || 0)
            toRequest.set(Number(arr[3]) || 0)
            toReply.set(Number(arr[4]) || 0)
            totalTransactionsRs.set(Number(arr[5]) || 0)
            console.log('rstats just came through')

        } else if (arr[0] === 'sn') {
            processNewConfirmedTransaction(arr[2])
        }
    })

    setInterval(() => {
        if (interval === txCounter) {
            attempts++
            console.log('Closing the sockets due to inactivity for ', config.zmq_restart_interval, ' seconds')
            console.log('Attempt #: ', attempts)
            sock.disconnect('tcp://' + config.zmq_url)
            sock.connect('tcp://' + config.zmq_url)
            sock.subscribe('')

        } else {
            interval = txCounter
        }
    }, config.zmq_restart_interval * 1000)

    sock.on('connect_retry', (eventVal, endPoint, err) => {
        console.log('zmq is in "connect_retry". The eventVal, endPoint, err are: ', eventVal, endPoint, err)
    })

    sock.on('disconnect', (eventVal, endPoint, err) => {
        console.log('zmq is in "disconnect". the error is: ', err)
    })

    sock.on('connect', () => {
        console.log('zmq is in a "connected" state.')
    })

    sock.on('connect_delay', (eventVal, endPoint, err) => {
        console.log('zmq is in a "connect_delay" state.', eventVal, endPoint, err)
    })

    sock.on('close', (eventVal, endPoint, err) => {
        console.log('zmq is in a "closed" state.', eventVal, endPoint, err)
    })

    sock.on('close_error', (eventVal, endPoint, err) => {
        console.log('zmq is in a "close_error" state.', eventVal, endPoint, err)
    })

    sock.on('bind_error', (eventVal, endPoint, err) => {
        console.log('zmq is in a "bind_error" state.', eventVal, endPoint, err)
    })

    sock.on('accept_error', (eventVal, endPoint, err) => {
        console.log('zmq is in a "accept_error" state.', eventVal, endPoint, err)
    })
}
