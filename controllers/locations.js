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
		console.log(decodedToken)

		if (!token || !decodedToken.id) {
			return response.status(401).json({ error: 'Token is missing or invalid.' })
		}
		const user = await User.findById(decodedToken.id)
		const userLocations = await Location.findById(user.locations)
		let savedFavouriteLocations = userLocations.favouriteLocations
		let savedFavouriteStops = userLocations.favouriteStops
		let savedFavouriteLines = userLocations.favouriteLines
		let savedHomeLocation = userLocations.homeLocation

		if(body.homeLocation !== null) {
			savedHomeLocation = {
				lat: body.homeLocation.lat,
				lon: body.homeLocation.lon,
				name: 'Home location: ' + body.homeLocation.name
			}
		}

		//Avoiding duplicates
		if(body.favouriteLocations !== null) {
			if(userLocations.favouriteLocations.every(function(location) {
				if(location.lat !== body.favouriteLocations.lat && location.lon !== body.favouriteLocations.lon) {
					return true
				}
				return false
			})) {
				savedFavouriteLocations = userLocations.favouriteLocations.concat(body.favouriteLocations)
			}
		}
		if(body.favouriteStops !== null) {
			if(userLocations.favouriteStops.every(function(stop) {
				return body.favouriteStops.gtfsId !== stop.gtfsId
			})) {
				savedFavouriteStops = userLocations.favouriteStops.concat(body.favouriteStops)
			}
		}
		if(body.favouriteLines !== null) {
			if(userLocations.favouriteLines.every(function(line) {
				return line.id !== body.favouriteLines.id
			})) {
				savedFavouriteLines = userLocations.favouriteLines.concat(body.favouriteLines)
			}
		}

		const location = new Location({
			homeLocation: savedHomeLocation,
			favouriteLocations: savedFavouriteLocations,
			favouriteStops: savedFavouriteStops,
			favouriteLines: savedFavouriteLines,
			user: user._id
		})
		await Location.findByIdAndRemove(user.locations)
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