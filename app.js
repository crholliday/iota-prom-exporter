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

let totalTransactions = new Gauge({ name: 'iota_node_info_total_transactions_queued', help: 'Total open txs at the interval' })
let totalTips = new Gauge({ name: 'iota_node_info_total_tips', help: 'Total tips at the interval' })
let totalNeighbors = new Gauge({ name: 'iota_node_info_total_neighbors', help: 'Total neighbors at the interval' })
let latestMilestone = new Gauge({ name: 'iota_node_info_latest_milestone', help: 'Tangle milestone at the interval' })
let latestSolidSubtangleMilestone = new Gauge({ name: 'iota_node_info_latest_subtangle_milestone', help: 'Subtangle milestone at the interval' })
let newTransactions = new Gauge({ name: 'iota_neighbors_new_transactions', help: 'New transactions by neighbor', labelNames: ['id'] })
let randomTransactions = new Gauge({ name: 'iota_neighbors_random_transactions', help: 'Random transactions by neighbor', labelNames: ['id'] })
let allTransactions = new Gauge({ name: 'iota_neighbors_all_transactions', help: 'All transactions by neighbor', labelNames: ['id'] })
let invalidTransactions = new Gauge({ name: 'iota_neighbors_invalid_transactions', help: 'Invalid transactions by neighbor', labelNames: ['id'] })
let activeNeighbors = new Gauge({ name: 'iota_neighbors_active_neighbors', help: 'Number of neighbors who are active'})

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
            let connectedNeighbors = 0
            neighborResults.forEach( (r) => {     
                newTransactions.set({id: r.address}, r.numberOfNewTransactions)
                invalidTransactions.set({id: r.address}, r.numberOfInvalidTransactions)                       
                allTransactions.set({id: r.address}, r.numberOfAllTransactions)                       
                randomTransactions.set({id: r.address}, r.numberOfRandomTransactionRequests) 
                if (r.numberOfNewTransactions + r.numberOfInvalidTransactions + r.numberOfAllTransactions + r.numberOfRandomTransactionRequests) {
                    connectedNeighbors += 1
                }  
            })
            activeNeighbors.set(connectedNeighbors)  
            res.end(promclient.register.metrics())      
        })         
    })
})

app.listen(process.env.port || 9011, () => {
    console.log('Listening on:', process.env.port || 9011)
})
