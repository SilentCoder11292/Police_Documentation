const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Dispatch verification OTP code via Twilio Verify API
 * @param {string} phoneNumber - Registered mobile number
 */
const sendOTP = async (phoneNumber) => {
  if (!client || !verifyServiceSid) {
    throw new Error('SMS Service configuration error: Twilio keys are missing or incomplete in environment.');
  }
  
  return await client.verify.v2.services(verifyServiceSid)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' });
};

/**
 * Validate OTP code via Twilio Verify API
 * @param {string} phoneNumber - Registered mobile number
 * @param {string} code - 6 digit input code
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (phoneNumber, code) => {
  if (!client || !verifyServiceSid) {
    throw new Error('SMS Service configuration error: Twilio keys are missing or incomplete in environment.');
  }

  const verificationCheck = await client.verify.v2.services(verifyServiceSid)
    .verificationChecks
    .create({ to: phoneNumber, code });

  return verificationCheck.status === 'approved';
};

module.exports = {
  sendOTP,
  verifyOTP,
  isConfigured: !!(client && verifyServiceSid)
};
