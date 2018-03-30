let path = require('path')
global.rootPath = path.normalize(path.join(__dirname, '..', '..'))

module.exports = {
    // url and port of your IRI node
    iota_node_url: process.env.iota_node_url || 'http://localhost:14265',

    // address and port where the exporter will be bound
    bind_address: process.env.bind_address || '127.0.0.1',
    bind_port: process.env.bind_port || 9311,

    // address where zmq is being served (example: '127.0.0.1:5556')
    // *** Leave blank if ZMQ is not enabled on IRI ***
    zmq_url: process.env.zmq_url || '127.0.0.1:5556',

    // the frequency that this application will seek for new messages
    // and force a reconnect to the zmq queue if one is not found
    // 5 seconds seems to be a good fit so far
    zmq_restart_interval: process.env.zmq_restart_interval || 5,

    // if true, will pull in market info (IOT to USD, IOT to BTC, etc)
    // *** Leave blank if you do not want market into pulled in ***
    market_info_flag: process.env.market_info_flag || 'true',

    // window for bucketing confirmation times by transaction
    // represents seconds and aggregates a histogram
    confirm_time_buckets: process.env.confirm_time_buckets || [300, 600, 1200, 2400, 3600, 7200, 21600, 43200],

    // how often the prune schedule will run (leave at default unless you have
    // a good reason)
    prune_interval_days: process.env.prune_interval_days || 1,

    // number of days to keep confirmation stats
    // db does not grow that quickly but checking the db/ folder
    // size regularly will prevent any issues
    // **Comment out to remove pruning**
    retention_days: process.env.retention_days || 14
}
