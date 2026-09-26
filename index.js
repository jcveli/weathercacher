require('dotenv').config()

const express = require('express')
const axios = require('axios')
const nodeCache = require('node-cache')

const app = express() 

const cache = new nodeCache({ stdTTL: process.env.CACHE_TTL || 900 })   // Cache for 15 minutes
const PORT = process.env.PORT || 3000;

app.get('/api/weather', async (req, res) => {
    let { lat, lon, city } = req.query

    if(city) {
        try { 
            console.log(`Request received for city: ${city}`)
            const geoResponse = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
                params: {
                    name: city,
                    count: 1,
                    language: 'en',
                    format: 'json'
                }
            })

            if(!geoResponse.data.results || geoResponse.data.results.length === 0) {
                return res.status(404).json({ error: 'City not found' })
            }

            //console.log(geoResponse.data.results)
            lat = geoResponse.data.results[0].latitude
            lon = geoResponse.data.results[0].longitude

            console.log(`Coordinates for ${city}: lat=${lat}, lon=${lon}`)


        }catch (error) {
            console.error("Error fetching geocoding data:", error)
            return res.status(500).json({ error: 'Failed to fetch geocoding data from External API' })
        }
    }     
    else if (!lat || !lon) {
        return res.status(400).json({ error: 'A City or Latitude and longitude are required' })
    }

    const cacheKey = `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}`  //toFixed for better cache and prevent memory bloat

    if (cachedData) {
        console.log(`Serving from cache for key: ${cacheKey}`)
        //injects city name into the cahced data if it was used
        if(city){
            cachedData.queried_city = city
        }    
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