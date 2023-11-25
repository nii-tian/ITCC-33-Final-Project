const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;
const MONGODB_URI = 'mongodb://127.0.0.1:27017';

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Loginform.html');
});

// Define a function to generate the script for the pop-up
function generatePopupScript(message, redirectUrl) {
  return `<script>alert("${message}. Click OK to proceed."); window.location.href="${redirectUrl}";</script>`;
}

async function checkCredentials(email, password) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const database = client.db('register');
    const collection = database.collection('user');

    // Check user credentials in the MongoDB collection
    const user = await collection.findOne({ email, password });
    
    return !!user; // Return true if the user is found, false otherwise
  } finally {
    await client.close();
  }
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const isValidCredentials = await checkCredentials(email, password);

    if (isValidCredentials) {
      res.send(generatePopupScript('Login successful', '/'));
    } else {
      res.send(generatePopupScript('Invalid credentials'));
    }
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.send(generatePopupScript('Error during login. Please try again.'));
  }
});

app.post('/register', async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const database = client.db('register');
    const collection = database.collection('user');

    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      res.send(generatePopupScript('Email already registered', '/'));
    } else {
      await collection.insertOne({ firstname, lastname, email, password });
      res.send(generatePopupScript('Registration successful', '/'));
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.send(generatePopupScript('Error during registration. Please try again.'));
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});