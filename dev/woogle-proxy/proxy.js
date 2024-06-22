const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

app.get('/api/municipalities', async (req, res) => {
  try {
    const response = await fetch('https://pid.wooverheid.nl/?pid=nl&infobox=true&dim=publisher&category=Gemeente');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching municipalities');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});