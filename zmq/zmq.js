'use strict'

const zmq = require('zeromq-ng/compat')
const config = require('../config')

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

sock.on('message', (topic) => {

    try {
        let arr = topic.toString().split(' ')

        if (arr[0] === 'tx') {
            txCounter++
            if (txCounter % 30 === 0 ) {
                console.log('ZMQ tx count = ', txCounter)
            }
        } else if (arr[0] === 'rstat') {
            console.log('rstats just came through')

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

