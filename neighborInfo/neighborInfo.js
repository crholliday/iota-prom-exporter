'use strict'

const IOTA = require('iota.lib.js')


module.exports = (promclient, config) => {

    let module = {}

    const iota = new IOTA({'provider': config.iota_node_url})
    const i = require('iotap').create(iota)

    let Gauge = promclient.Gauge

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

    module.getNeighborInfo = async () => {

        try {
            let info = await i.getNeighbors()
            let connectedNeighbors = 0
            info.forEach((r) => {
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
            return ('getNeighborInfo ran as expected')
        } catch (e) {
            return e
        }
    }
    return module
}

