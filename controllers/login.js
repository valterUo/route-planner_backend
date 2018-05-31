const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')
const Location = require('../models/location')

loginRouter.post('/', async (request, response) => {
	try {
		const body = request.body
		const user = await User.findOne({ username: body.username })
		const passwordCorrect = user === null ? false : await bcrypt.compare(body.password, user.password)

		if ( !(user && passwordCorrect) ) {
			return response.status(401).send({ error: 'Invalid username or password' })
		}

		const userForToken = {
			username: user.username,
			id: user._id
		}

		const token = jwt.sign(userForToken, process.env.SECRET)
		const userLocations = await Location.findById(user.locations)
		response.status(200).send({ token, username: user.username, name: user.name, locations: userLocations })
	} catch (error) {
		console.log(error)
		return response.status(404).end()
	}
})

module.exports = loginRouter