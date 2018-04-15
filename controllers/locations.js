const Location = require('../models/location')
const User = require('../models/user')
const locationRouter = require('express').Router()
const jwt = require('jsonwebtoken')

const getTokenFrom = (request) => {
	const authorization = request.get('authorization')
	if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.substring(7)
	}
	return null
}

locationRouter.get('/', async (request, response) => {
	try { const location = await Location
		.find({})
		.populate('user')

	if(location) {
		response.json(location)
	} else {
		response.status(404).end()
	}
	} catch (error) {
		console.log(error)
		response.status(400).end()
	}
})

locationRouter.get('/:id', async (request, response) => {
	try {
		const locations = await Location.findById(request.params.id)
		if (locations) {
			response.json(locations)
		} else {
			response.status(404).end()
		}
	} catch (error) {
		console.log(error)
		response.status(404).send({ error: 'Malformatted id' })
	}
})

locationRouter.post('/', async (request, response) => {
	const body = request.body
	try {
		const token = getTokenFrom(request)
		const decodedToken = jwt.verify(token, process.env.SECRET)

		if (!token || !decodedToken.id) {
			return response.status(401).json({ error: 'Token is missing or invalid.' })
		}
		const user = await User.findById(decodedToken.id)

		const location = new Location({
			homeLocation: body.homeLocation,
			favouriteLocations: body.favouriteLocations,
			favouriteStops: body.favouriteStops,
			favouriteLines: body.favouriteLines,
			user: user._id
		})
		const savedLocation = await location.save()

		user.locations = savedLocation._id
		await user.save()

		response.json(savedLocation)
	} catch(error) {
		console.log(error)
		response.status(500).json({ error: 'Failure' })
	}
})

//This is used also to delete single values in location table (delete one line or one favourite location). If user wants to delete the whole table, use delete request.
locationRouter.put('/:id', async (request, response) => {
	const body = request.body

	const updatedLocation = {
		homeLocation: body.homeLocation,
		favouriteLocations: body.favouriteLocations,
		favouriteStops: body.favouriteStops,
		favouriteLines: body.favouriteLines
	}

	const result = await Location.findByIdAndUpdate(request.params.id, updatedLocation, { new: true })
	response.json(result)
})

locationRouter.delete('/:id', async (request, response) => {
	try {
		const token = getTokenFrom(request)
		const decodedToken = jwt.verify(token, process.env.SECRET)

		if (!token || !decodedToken.id) {
			return response.status(401).json({ error: 'Token is missing or invalid.' })
		}
		const user = await User.findById(decodedToken.id)
		const location = await Location.findById(request.params.id)
		if (location.user.toString() === user._id.toString()) {
			await Location.findByIdAndRemove(request.params.id)
			response.status(204).end()
		} else {
			response.status(401).json({ error: 'Unauthorized user' })
		}

	} catch (exception) {
		if (exception.name === 'JsonWebTokenError' ) {
			response.status(401).json({ error: exception.message })
		} else {
			console.log(exception)
			response.status(400).send({ error: 'Malformatted id' })
		}

	}
})

module.exports = locationRouter