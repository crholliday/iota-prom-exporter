'use strict'

const zmq = require('zeromq')
const config = require('./config')
const set = require('lodash.set')
const level = require('level')
const transactions = level('./db', {valueEncoding: 'json'})

// require('timers')

let seenTxs = 0
let txsWithValue = 0
let confirmedTxs = 0

let processZmq = (zmqStats, confirmationTimeHisto) => {

    let processNewSeenTransaction = async (tx) => {
        try {
            const newSeen = await transactions.get(tx)
        } catch (error) {
            if (error.notFound) {
                await transactions.put(tx, {
                    seenDate: Date.now()
                })
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
            }
        }
    }

    if (config.zmq_url) {

        let sock = zmq.socket('sub')
        // sets reconnect to 20 seconds
        sock.setsockopt(zmq.ZMQ_RECONNECT_IVL, 20000)
        // sets max reconnect interval to 3 minutes
        sock.setsockopt(zmq.ZMQ_RECONNECT_IVL_MAX, 150000)
        // ZMQ_RECONNECT_IVL_MAX
        sock.connect('tcp://' + config.zmq_url)
        console.log('zmq socket connected')

        // subscribe to all messages
        sock.subscribe('')
        sock.monitor(10000, 0)

        sock.on('message', (topic) => {
            let arr = topic.toString().split(' ')

            if (arr[0] === 'tx') {
                processNewSeenTransaction(arr[1])
                set(zmqStats, 'seenTxs', seenTxs++)
                if (arr[3] !== '0') {
                    set(zmqStats, 'txsWithValue', txsWithValue++)
                }
            } else if (arr[0] === 'rstat') {
                let rs = {
                    'toProcess': arr[1],
                    'toBroadcast': arr[2],
                    'toRequest': arr[3],
                    'toReply': arr[4],
                    'totalTransactions': arr[5]
                }
                set(zmqStats, 'rstats', rs)

            } else if (arr[0] === 'sn') {
                processNewConfirmedTransaction(arr[2])
                set(zmqStats, 'confirmedTxs', confirmedTxs++)
            }
        })

        sock.on('connect_retry', (eventVal, endPoint, err ) => {
            console.log('zmq is in "connect_retry" eventVal, endPoit, err', eventVal, endPoint, err)
        })

        sock.on('disconnect', (eventVal, endPoint, err) => {
            console.log('zmq is in "disconnect" err', err)
        })

    } else {
        console.log('ZMQ is not configured')
    }
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
        stats['avgSecondsAgo'] = seconds/counter
        cb(stats)
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

module.exports = {
    processZmq: processZmq,
    getHistogram: getHistogram,
    getSeenButNotConfirmed: getSeenButNotConfirmed,
    pruneDB: pruneDB
}
