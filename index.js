const express = require('express')
const axios = require('axios')
const nodeCache = require('node-cache')

const cache = new nodeCache({ stdTTL: 900 })   // Cache for 15 minutes

const PORT = process.env.PORT || 3000;
const app = express() 

app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query
    
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' })
    }

    const cacheKey = `${lat},${lon}`
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
        console.log("Serving from cache...")
        // return the cached key and terminate the request early
        return res.json(cachedData)
    }


    try {
        console.log('Request received for lat:', lat, 'lon:', lon)     
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
            params: {
                latitude: lat,
                longitude: lon,
                current: 'temperature_2m,wind_speed_10m'
            }
        })

        //cleans data and formats it to a more readable format with data we need
        const weatherData = {
            source: 'Open-Meteo API',
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            temperature_celsius: response.data.current.temperature_2m,
            temperature_units: response.data.current_units.temperature_2m,
            wind_speed_kmh: response.data.current.wind_speed_10m,
            current_weather: response.data.current_weather
        }

        //store the response in cache
        cache.set(cacheKey, weatherData)

        return res.json(weatherData)

    }catch (error) {
        console.error("Error fetching weather data:", error)
        res.status(500).json({ error: 'Failed to fetch weather data from External API' })
    }

})   

app.listen(PORT, () => {
    console.log(`Listening in PORT: ${PORT}`)
})