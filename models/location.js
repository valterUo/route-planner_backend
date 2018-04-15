const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
	homeLocation: Object,
	favouriteLocations: Array,
	favouriteStops: Array,
	favouriteLines: Array,
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

const Location = mongoose.model('Location', locationSchema)

module.exports = Location