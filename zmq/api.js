'use strict'

const transactions = require('../db').connect()

module.exports = (config) => {

    let module = {}

    module.getHistogram = (cb) => {

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

    module.getSeenButNotConfirmed = (cb) => {
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

    module.pruneDB = (cb) => {

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

    // pruning routine
    if (config.retention_days) {
        const cron = require('node-cron')
        console.log(`Schedule set to prune the zmq DB every ${config.prune_interval_days} days to retain ${config.retention_days} days of data.`)
        cron.schedule(`0 0 */${config.prune_interval_days} * *`, function () {
            module.pruneDB((data) => {
                return
            })
        })
    }

    return module
}
