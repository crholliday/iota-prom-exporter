let path = require('path')
global.rootPath = path.normalize(path.join(__dirname, '..', '..'))

module.exports = {
    // url and port of your IRI node
    iota_node_url: 'http://localhost:14700',

    // keep this
    stresstest_table_url: 'http://analytics.iotaledger.net/stresstest.table',

    // address and port where the exporter will be bound
    bind_address: '127.0.0.1',
    bind_port: 9311,

    // address where zmq is being served (example: '127.0.0.1:5556')
    // *** Leave blank if ZMQ is not enabled on IRI ***
    zmq_url: '',

    // if true, will pull in market info (IOT to USD, IOT to BTC, etc)
    // *** Leave blank if you do not want market into pulled in ***
    market_info_flag: '',

    // test window for average time to confirm
    // ex: 20, the metric will return the avg time to confirm over the last 
    // 20 minutes
    confirmation_time_minutes: 20,

    // how frequently the confirmation stats are gathered
    // they are currently bound by COO milestones (appx every 2 minutes)
    // a lower number means a faster refresh and more load on your node
    confirmation_stats_refresh_seconds: 30
}
