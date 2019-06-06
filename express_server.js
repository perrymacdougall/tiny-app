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
// Object containing my data store of users
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Requires body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// Requires cookie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

/*----- GET ROUTES ------*/

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    cookieName: users[req.cookies.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    cookieName: users[req.cookies.user_id]
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    cookieName: users[req.cookies.user_id]
  };
  res.render('urls_show', templateVars);
});

// Handles outbound redirect request
app.get('/u/:shortURL', (req, res) => {
  const final = (urlDatabase[req.params.shortURL]);
  res.redirect(final);
});

app.get('/register', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    cookieName: users[req.cookies.user_id]
  };
  res.render('urls_registration', templateVars);
});

/*---- POST ROUTES -----*/

// Handles POST requests, generates a random alphanumeric string and writes the short/long pair to the urlDatabase
app.post('/urls', (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`urls/${randomString}`);
});

// Handles login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls')
});

// Handles logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls')
});

// Handles a DELETE request
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')
});

// Updates the URL of an existing link
app.post('/urls/:id', (req, res) => {
  console.log(req.params, req.body);
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls')
});

// Handles registration requests and creates a new user
app.post('/register', (req, res) => {

  // Checks if email and password are valid
  if (req.body.email === "" || req.body.password === "") {
    res.send("Error 400: Please make sure your email address and password are valid");
  }

  // Creates a new user object from registration form data
  const newUser = generateRandomString();

  users[newUser] = {
    id: newUser,
    email: req.body.email,
    password: req.body.password
  }

  // Create a new cookie for new user
  res.cookie('user_id', users[newUser].id);
  res.redirect('/urls')
});

/*---- HELPER FUNCTIONS ------*/

// 6-character UID generator
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
};

// Email lookup function
// function emailLookup(userID) {
//   return (users[userID].email);
// };

// Tells the HTTP server to listen for requests on the port number defined at top
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});