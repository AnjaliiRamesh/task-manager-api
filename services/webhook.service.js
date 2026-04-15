const axios = require('axios');
require('dotenv').config();

const sendWebhook = async (payload, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Sending webhook attempt ${attempt}/${retries}...`);

      await axios.post(process.env.WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      console.log('✅ Webhook sent successfully!');
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));
      return true;

    } catch (error) {
      console.error(`❌ Webhook attempt ${attempt} failed:`, error.message);

      if (attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
      } else {
        console.error('❌ All webhook attempts failed!');
        return false;
      }
    }
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { sendWebhook };
