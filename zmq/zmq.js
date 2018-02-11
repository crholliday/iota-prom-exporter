'use strict'

const zmq = require('zeromq')
const set = require('lodash.set')
const level = require('level')
const transactions = level('./db', {
    valueEncoding: 'json'
})

module.exports = (promclient, config) => {

    let Histogram = promclient.Histogram
    let Gauge = promclient.Gauge

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

    let confirmationTimeHisto = new Histogram({
        name: 'iota_zmq_tx_confirm_time',
        help: 'Actual seconds it takes to confirm each tx',
        buckets: config.confirm_time_buckets
    })

    let processNewSeenTransaction = async (tx) => {
        try {
            const newSeen = await transactions.get(tx)
        } catch (error) {
            if (error.notFound) {
                await transactions.put(tx, {
                    seenDate: Date.now()
                })
            } else {
                console.log('Something is wrong with LevelDB - the error is: ', error)
            }
        }
    }

    let processNewConfirmedTransaction = async (tx) => {
        try {
            const newConfirmed = await transactions.get(tx)
            let confirmMoment = Date.now()
            await transactions.put(tx, {
                'seenDate': newConfirmed.seenDate,
                'confirmedDate': confirmMoment
            })
            confirmationTimeHisto.observe((confirmMoment - newConfirmed.seenDate) / 1000)
        } catch (error) {
            if (error.notFound) {
                await transactions.put(tx, {
                    confirmedDate: Date.now()
                })
            } else {
                console.log('Something is wrong with LevelDB - the error is: ', error)
            }
        }
    }

    let sock = zmq.socket('sub')
    // sets reconnect to 20 seconds
    // sock.setsockopt(zmq.ZMQ_RECONNECT_IVL, 20000)
    // sets max reconnect interval to 3 minutes
    // sock.setsockopt(zmq.ZMQ_RECONNECT_IVL_MAX, 150000)
    // ZMQ_RECONNECT_IVL_MAX
    sock.connect('tcp://' + config.zmq_url)
    console.log('zmq socket connected')

    // subscribe to all messages
    sock.subscribe('')
    sock.monitor(2000, 0)

    sock.on('message', (topic) => {
        let arr = topic.toString().split(' ')

        if (arr[0] === 'tx') {
            processNewSeenTransaction(arr[1])
            seenTxs.inc(1)
            if (arr[3] !== '0') {
                txsWithValue.inc(1)
            }
        } else if (arr[0] === 'rstat') {
            let rs = {
                'toProcess': arr[1],
                'toBroadcast': arr[2],
                'toRequest': arr[3],
                'toReply': arr[4],
                'totalTransactions': arr[5]
            }
            toProcess.set(Number(rs.toProcess) || 0)
            toBroadcast.set(Number(rs.toBroadcast) || 0)
            toRequest.set(Number(rs.toRequest) || 0)
            toReply.set(Number(rs.toReply) || 0)
            totalTransactionsRs.set(Number(rs.totalTransactions) || 0)

        } else if (arr[0] === 'sn') {
            processNewConfirmedTransaction(arr[2])
            confirmedTxs.inc(1)
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

let getHistogram = (cb) => {

    let buckets = config.confirm_time_buckets
    let totalCount = 0
    let totalSeenAndConfirmedCount = 0
    let histo = {}

    for (let le in buckets) {
        histo[buckets[le]] = 0
    }

    transactions.createReadStream().on('data', (data) => {
        totalCount += 1
        if (data.value.confirmedDate && data.value.seenDate) {
            totalSeenAndConfirmedCount += 1
            let seconds = (data.value.confirmedDate - data.value.seenDate) / 1000

            for (let le in buckets) {
                if (seconds <= Number(buckets[le])) {
                    histo[buckets[le]] += 1
                    break
                } else {
                    histo['inf'] += 1
                }
            }
        }
    }).on('end', () => {
        histo['totalTxs'] = totalCount
        histo['totalSeenAndConfirmedTxs'] = totalSeenAndConfirmedCount
        cb(histo)
    })
}

let getSeenButNotConfirmed = (cb) => {
    let counter = 0
    let stats = {}
    let now = Date.now()
    let seconds = 0

    transactions.createReadStream().on('data', (data) => {
        if (data.value.seenDate && !data.value.confirmedDate) {
            counter += 1
            seconds += (now - data.value.seenDate) / 1000
        }
    }).on('end', () => {
        stats['count'] = counter
        stats['avgSecondsAgo'] = seconds / counter
        cb(stats)
    }).on('error', (err) => {
        cb('An error occured in the stream...', err)
    })
}

let pruneDB = (cb) => {

    let totalCount = 0
    let deleteCount = 0
    let errorCount = 0
    let now = Date.now()
    let stats = {}
    //  days * hours * minutes * seconds * millis
    let pruneDateMS = config.retention_days * 24 * 60 * 60 * 1000
    let pruneDate = now - pruneDateMS

    transactions.createReadStream().on('data', (data) => {
        totalCount += 1
        if (data.value.confirmedDate <= pruneDate ||
            !data.value.confirmedDate && (data.value.seenDate <= pruneDate)) {
            transactions.del(data.key, (err) => {
                if (err) {
                    errorCount += 1
                } else {
                    deleteCount += 1
                }
            })
        }
    }).on('end', () => {
        stats['totalTxs'] = totalCount
        stats['deletedTxs'] = deleteCount
        stats['errors'] = errorCount
        console.log(`Iota-prom-exporter DB was pruned on ${now} and returned: ${JSON.stringify(stats)}`)
        cb(stats)
    })
}
