const axios = require('axios');

const ABB_BASE_URL = process.env.ABB_BASE_URL || 'http://api-test-c2b.abb-bank.az';

async function getToken(username, password) {
  const url = `${ABB_BASE_URL}/payments/auth/token`;
  const response = await axios.get(url, {
    params: { username, password },
    headers: { 'Accept': 'application/json' },
    timeout: 15000,
  });
  return response.data;
}

function buildHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function sendPaymentRequest(token, base64aDoc, externalReference, path) {
  const url = `${ABB_BASE_URL}${path}`;
  return axios.post(
    url,
    { base64aDoc, externalReference },
    { headers: buildHeaders(token), timeout: 20000 }
  );
}

async function sendPayments(token, base64aDoc, externalReference) {
  return sendPaymentRequest(token, base64aDoc, externalReference, '/payments');
}

async function sendPaymentsOtp(token, base64aDoc, externalReference) {
  return sendPaymentRequest(token, base64aDoc, externalReference, '/payments/otp');
}

async function verifyOtp(token, batchNumber, otpCode) {
  return axios.post(
    `${ABB_BASE_URL}/payments/verify-otp`,
    { batchNumber, otpCode },
    { headers: buildHeaders(token), timeout: 15000 }
  );
}

module.exports = {
  getToken,
  sendPayments,
  sendPaymentsOtp,
  verifyOtp,
};
