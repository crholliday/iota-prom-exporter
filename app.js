'use strict'

let promclient = require('prom-client')
let Gauge = promclient.Gauge
// let Histogram = promclient.Histogram

/* 
TODO:
- Number of transactions over time
- Number sent over time by neighbor
- Number random over time by neighbor
- Number new over time by neighbor
- Time between milestones
- Total Tips
- Milestone, milestone counts, etc
*/

let express = require('express')
let app = express()

let nodeInfo = require ('./nodeInfo')
let neighborInfo = require ('./neighborInfo')

let totalTransactions = new Gauge({ name: 'total_transactions_queued', help: 'Total open txs at the interval' })
let totalTips = new Gauge({ name: 'total_tips', help: 'Total tips at the interval' })
let totalNeighbors = new Gauge({ name: 'total_neighbors', help: 'Total neighbors at the interval' })
let latestMilestone = new Gauge({ name: 'latest_milestone', help: 'Tangle milestone at the interval' })
let latestSolidSubtangleMilestone = new Gauge({ name: 'latest_subtangle_milestone', help: 'Subtangle milestone at the interval' })
let newTransactions = new Gauge({ name: 'new_neighbor_transactions', help: 'New transactions by neighbor', labelNames: ['id'] })
let randomTransactions = new Gauge({ name: 'random_neighbor_transactions', help: 'Random transactions by neighbor', labelNames: ['id'] })
let allTransactions = new Gauge({ name: 'all_neighbor_transactions', help: 'All transactions by neighbor', labelNames: ['id'] })
let invalidTransactions = new Gauge({ name: 'invalid_neighbor_transactions', help: 'Invalid transactions by neighbor', labelNames: ['id'] })

app.get('/metrics', (req, res) => {
    console.log('.')

    nodeInfo( (err, results) => {

        if (err) {
            console.log('there was an error in the nodeInfo api call... ')
            console.log(err)
        } else {
            totalTransactions.set(results.transactionsToRequest)
            totalTips.set(results.tips)
            totalNeighbors.set(results.neighbors)
            latestMilestone.set(results.latestMilestoneIndex)
            latestSolidSubtangleMilestone.set(results.latestSolidSubtangleMilestoneIndex)           
        }

        neighborInfo( (error, neighborResults) => {
            neighborResults.forEach( (r) => {              
                newTransactions.set({id: r.address}, r.numberOfNewTransactions)
                invalidTransactions.set({id: r.address}, r.numberOfInvalidTransactions)                       
                allTransactions.set({id: r.address}, r.numberOfAllTransactions)                       
                randomTransactions.set({id: r.address}, r.numberOfRandomTransactionRequests)                       
            })
            res.end(promclient.register.metrics())      
        })         
    })
})

app.listen(process.env.port || 9011, () => {
    console.log('Listening on:', process.env.port || 9010)
})
