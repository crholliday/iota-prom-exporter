'use strict'

let promclient = require('prom-client')
let Gauge = promclient.Gauge
let Histogram = promclient.Histogram

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

let totalStats = require ('../totalstats')
let workerStats = require ('../workerstats')
let rate = require('../paystats')
let rates = require('../rate')

let totalBTC = new Gauge('overwatch_total_btc', 'Your total count of bitcoin', [ 'btc' ])
let totalUSD = new Gauge('overwatch_total_usd', 'Your total funds in USD', [ 'usd' ])
let totalSols = new Gauge('overwatch_total_sols', 'Your total sols/s', [ 'sols' ])
let equihashPayrate = new Gauge('overwatch_current_payrate', 'Equihash payrate', [ 'btc' ])
let remote_query = new Histogram('overwatch_remote_query', 'Remote queries to Nicehash', [ 'duration' ])
let zecPrice = new Gauge('overwatch_zec_btc_price', 'Price of ZEC in BTC', ['btc'])

let addr = process.env.addr
let algo = 24

app.get('/metrics', (req, res) => {
    console.log('.')
    let start = new Date().getTime()
    totalStats(addr, (results) => {
        workerStats(addr, algo, (workerResults) => {
            try {
                totalSols.set( workerResults.totalSols )
                results.forEach( (r) => {

                    totalBTC.set(Number(r.totalBTC))
                    totalUSD.set(Number(r.currency['USD']))       
                })

            } catch (e) {
                console.error('workerStats: Bad response from remote endpoint.')
                console.error(e)
            }

            let end = new Date().getTime()
            remote_query.labels('duration').observe((end-start) / 1000)

            rate(algo, (err, price)=> {

                equihashPayrate.set(Number(price))
                rates.getZecRate((err,zecRate)=> {
                    zecPrice.set(Number(zecRate.rate))
                    res.end(promclient.register.metrics())
                })
            })
        })
    })
})

app.listen(process.env.port || 9010, () => {
    console.log('Listening')
})
