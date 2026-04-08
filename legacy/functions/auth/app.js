const functions = require('firebase-functions');  // Firebase Functions
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const apiCalls = require('./call');  // Import your API logic

// Initialize Firebase Admin SDK
if (process.env.FUNCTIONS_EMULATOR) {
  // Running locally with emulator
  admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccount.json')),
  });
} else {
  // Running in production (deployed), use default credentials
  admin.initializeApp();
}

const app = express();
const db = admin.firestore();

// Middleware for handling JSON requests
app.use(bodyParser.json());

app.post('/api/login', async (req, res) => {
  try {
    const result = await apiCalls.loginUser(db, req.body);

    // Debugging: Log the result to verify it's the expected JSON object
    // console.log("Login result:", result);

    if (result.status === 'error') {
      return res.status(400).json({ error: result.message });
    }

    // Send JSON response instead of redirect
    res.status(200).json(result);  // Return the result as JSON
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📊 Fetch Data Route
app.post('/api/fetchUserData', async (req, res) => {
  try {
    const { offices } = req.body;
    const data = await apiCalls.getUserData(db, offices);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/api/fetchUsers', async (req, res) => {
  try {
    const data = await apiCalls.getUsers(db); // Ensure this function is correctly defined and works
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching user data:', err); // This will log the error to the server console
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});

// 📊 Fetch Data Route
app.post('/api/getReport', async (req, res) => {
  try {
    const { offices, month, year } = req.body;
    // console.log(month+" that "+year+" "+offices);
    const data = await apiCalls.analyzeResponsesByOffice(db, offices, month, year);
    res.status(200).json(data);

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const data = req.body; // Get data from the request
    // console.log(data);
    const pdfBytes = await apiCalls.generatePDF(data); // Generate the PDF

    // Set headers for inline display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');

    // Send the actual PDF
    res.send(pdfBytes);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// 📊 Fetch Data Route
app.post('/api/updateComments', async (req, res) => {
  try {
    const data = req.body;
    // console.log(month+" that "+year+" "+offices);
    const result = await apiCalls.updateComments(db, admin, data);
    res.status(200).json(result);

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// 📊 Add User
app.post('/api/addUser', async (req, res) => {
  try {
    const data = req.body;
    // console.log(month+" that "+year+" "+offices);
    const result = await apiCalls.addUser(db, data);
    res.status(200).json(result);

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// 📊 Update Office
app.post('/api/removeOffice', async (req, res) => {
  try {
    const data = req.body;
    // console.log(month+" that "+year+" "+offices);
    const result = await apiCalls.removeOffice(db, data);
    res.status(200).json(result);

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/addOffice', async (req, res) => {
  try {
    const data = req.body;
    // console.log(month+" that "+year+" "+offices);
    const result = await apiCalls.addOffice(db, data);
    res.status(200).json(result);

  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/fetchDashboard', async (req, res) => {
  try {
    const data = req.body;
    const result = await apiCalls.fetchDashboard(db, data); // Ensure this function is correctly defined and works
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching user data:', err); // This will log the error to the server console
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});

app.post('/api/summary-pdf', async (req, res) => {
  try {
    const {summaryPDF, finals} = req.body; // Get data from the request
    // console.log(data);
    const pdfBytes = await apiCalls.summaryPDF(summaryPDF, finals); // Generate the PDF

    // Set headers for inline display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="conso.pdf"');

    // Send the actual PDF
    res.send(pdfBytes);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

app.post('/api/export-pdf', async (req, res) => {
  try {
    const { images } = req.body; // Get images array from request body
    const pdfBytes = await apiCalls.chartPDF(images); // Generate the PDF from images

    // Set headers for inline display and downloadable file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="charts.pdf"');

    // Send the generated PDF to the client
    res.send(pdfBytes);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Export the app as a Firebase Function
module.exports = app;  // This is important!