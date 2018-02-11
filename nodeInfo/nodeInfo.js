'use strict'

const IOTA = require('iota.lib.js')

module.exports = (promclient, config) => {

    let module = {}

    const iota = new IOTA({'provider': config.iota_node_url})
    const i = require('iotap').create(iota)

    let Gauge = promclient.Gauge

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

    module.getNodeInfo = async () => {

        try {
            let info = await i.getNodeInfo()
            totalTransactions.set(info.transactionsToRequest)
            totalTips.set(info.tips)
            totalNeighbors.set(info.neighbors)
            latestMilestone.set(info.latestMilestoneIndex)
            latestSolidSubtangleMilestone.set(info.latestSolidSubtangleMilestoneIndex)
            return ('getNodeInfo ran as expected')
        } catch (e) {
            return e
        }
    }

    return module
}

