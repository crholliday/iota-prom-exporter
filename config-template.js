let path = require('path')
global.rootPath = path.normalize(path.join(__dirname, '..', '..'))

module.exports = {
    // url and port of your IRI node
    iota_node_url: 'http://localhost:14700',

    // keep this
    stresstest_table_url: 'http://analytics.iotaledger.net/stresstest.table',

    // address and port where the exporter will be bound
    bind_address: '127.0.0.1',
    bind_port: 9311
}
