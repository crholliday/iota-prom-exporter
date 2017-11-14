let path = require('path')
global.rootPath = path.normalize(path.join(__dirname, '..', '..'))

module.exports = {
    iota_node_url: 'http://localhost:14700',
    stresstest_table_url: 'http://analytics.iotaledger.net/stresstest.table'
}
