'use strict'

const zmq = require('zeromq-ng/compat')

module.exports = (promclient, config) => {

    let Gauge = promclient.Gauge

    // zmq stuff
    let seenTxs = new Gauge({
        name: 'iota_zmq_seen_tx_count',
        help: 'Count of transactions seen by zeroMQ',
    })
    let txsWithValue = new Gauge({
        name: 'iota_zmq_txs_with_value_count',
        help: 'Count of transactions seen by zeroMQ that have a non-zero value'
    })
    let confirmedTxs = new Gauge({
        name: 'iota_zmq_confirmed_tx_count',
        help: 'Count of transactions confirmed by zeroMQ',
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
    sock.on('message', (topic) => {

        try {
            let arr = topic.toString().split(' ')

            if (arr[0] === 'tx') {
                if (Number(arr[3]) !== 0) {
                    txsWithValue.inc(1)
                    seenTxs.inc(1)
                } else {
                    seenTxs.inc(1)
                }
            } else if (arr[0] === 'rstat') {
                toProcess.set(Number(arr[1]) || 0)
                toBroadcast.set(Number(arr[2]) || 0)
                toRequest.set(Number(arr[3]) || 0)
                toReply.set(Number(arr[4]) || 0)
                totalTransactionsRs.set(Number(arr[5]) || 0)
                // console.log('rstats just came through')

            } else if (arr[0] === 'sn') {
                confirmedTxs.inc(1)
            }

        } catch (e) {
            console.log('error in the on.message event in ZMQ: ', e)
        }
    })

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
