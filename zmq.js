'use strict'

const zmq = require('zeromq')
const config = require('./config')
const set = require('lodash.set')

let seenTxs = 0
let txsWithValue = 0
let confirmedTxs = 0

module.exports = (zmqStats) => {
    if (config.zmq_url) {
        var sock = zmq.socket('sub')
        sock.connect('tcp://' + config.zmq_url)
        console.log('zmq socket connected')

        // subscribe to all messages
        sock.subscribe('')

        sock.on('message', function (topic) {
            var tp = topic.toString()
            var arr = tp.split(' ')

            if (arr[0] === 'tx') {
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
                set(zmqStats, 'confirmedTxs', confirmedTxs++)
            }
        })
    } else {
        console.log('ZMQ is not configured')
    }
}