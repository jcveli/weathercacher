const express = require('express')
const axios = require('axios')
const nodeCache = require('node-cache')



const PORT = process.env.PORT || 3000;
const app = express() 

app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query
    
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' })
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
        return res.json(response.data)

    }catch (error) {
        console.error("Error fetching weather data:", error)
        res.status(500).json({ error: 'Failed to fetch weather data from External API' })
    }

})   

app.listen(PORT, () => {
    console.log(`Listening in PORT: ${PORT}`)
})