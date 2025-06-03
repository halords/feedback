const functions = require('firebase-functions');
const authApp = require('./auth/app');

exports.api = functions.https.onRequest(authApp)