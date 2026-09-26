const express = require('express')
const axios = require('axios')
const nodeCache = require('node-cache')

const PORT = process.env.PORT || 300;

const app = express() 


app.listen(PORT, () => {
    console.log(`Listening in PORT: ${PORT}`)
})