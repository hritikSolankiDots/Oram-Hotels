
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  hubspotApiKey: process.env.HUBSPOT_API_KEY,
};
