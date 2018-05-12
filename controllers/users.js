const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const Location = require('../models/location')

usersRouter.get('/', async (request, response) => {
	try {
		const users = await User.find({}).populate('locations')
		if(users) {
			response.json(users)
		}
	} catch(error) {
		console.log(error)
		response.status(404).end()
	}
})

usersRouter.get('/:id', async (request, response) => {
	try {
		const user = await User.findById(request.params.id)
		if (user) {
			response.json(user)
		} else {
			response.status(404).end()
		}
	} catch (error) {
		console.log(error)
		response.status(404).send({ error: 'Malformatted id' })
	}
})

usersRouter.post('/', async (request, response) => {
	try {
		const user = request.body
		const existingUser = await User.find({ username: user.username })
		if (existingUser.length > 0) {
			return response.status(400).json({ error: 'Username must be unique' })
		}
		if (user.username === undefined) {
			return response.status(400).json({ error: 'Username is missing.' })
		}
		if (user.name === undefined) {
			return response.status(400).json({ error: 'Name is missing.' })
		}
		if (user.password === undefined) {
			return response.status(400).json({ error: 'Password is missing.' })
		}
		if(user.password.length < 8) {
			return response.status(400).json({ error: 'Password needs to be at least 8 characters.' })
		}

		const saltRounds = 10
		const passwordHash = await bcrypt.hash(user.password, saltRounds)

		const newUser = new User({
			username: user.username,
			name: user.name,
			password: passwordHash,
			locations: null
		})

		const savedUser = await newUser.save()

		const location = new Location({
			homeLocation:  null,
			favouriteLocations: [],
			favouriteStops: [],
			favouriteLines: [],
			user: savedUser._id
		})

		const savedLocation = await location.save()
		const justSaveduser = await User.findById(savedUser._id)
		justSaveduser.locations = savedLocation._id
		await justSaveduser.save()

		response.status(201).json(savedUser)
	} catch(error) {
		console.log(error)
		response.status(404).end()
	}
})

module.exports = usersRouter