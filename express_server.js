// Require and set ExpressJS and defining a port number to listen for requests
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Object containing key:value pairs of URLs and their shortened counterparts
let urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// Requires body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// Defining routes for incoming requests
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

// Handles POST requests, generates a random alphanumeric string and writes the short/long pair to the urlDatabase
app.post('/urls', (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`urls/${randomString}`);
});

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
};

// Tells the HTTP server to listen for requests on the port number defined at top
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});