const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const locationRouter = require('./controllers/locations')
const cors = require('cors')

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('build'))

if ( process.env.NODE_ENV !== 'production' ) {
	require('dotenv').config()
}

const url = process.env.MONGODB_URI
mongoose.connect(url)

app.get('/', (request, response) => {
	response.send('<h1>Welcome to Route Planner backend!</h1>')
})

app.use('/users', usersRouter)
app.use('/login', loginRouter)
app.use('/locations', locationRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})