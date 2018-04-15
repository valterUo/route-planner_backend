const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	username: String,
	name: String,
	password: String,
	locations: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
})

userSchema.statics.format = (user) => {
	return {
		id: user.id,
		username: user.username,
		name: user.name,
		locations: user.locations
	}
}

const User = mongoose.model('User', userSchema)

module.exports = User