const level = require('level')
const _db = level('./db', {valueEncoding: 'json'}, (err, db)  => {
    if (err) {
        return console.log('Failed to open LevelDB', err)
    }
    console.log('Connected to levelDB database')
})

exports.connect = () => {
	return _db
}
