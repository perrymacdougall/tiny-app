// Requiring all dependencies and defining a port number to listen for requests
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Object containing key:value pairs of URLs and their shortened counterparts
const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: "userRandomID" },
  '9sm5xK': { longURL: 'http://www.google.com', userID: "user2RandomID"}
};

// Object containing my data store of users
const users = {
  // One default user for evaluation purposes
  '7cde89':
    { id: '7cde89',
      email: 'light@lighthouse.com',
      password: '$2b$10$DPBfPXqwVxniGzLWaiWl1uJN2LXe5Ng.ae9/Tbxj0fvp3CL58XLzi'
    }
}

/*----- Middleware ----------*/

// Sets body-parser
app.use(bodyParser.urlencoded({extended: true}));

// Sets cookie-session
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

/*---- HELPER FUNCTIONS ------*/

// 6-character UID generator
function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x10000000).toString(36);
};

// Email lookup function
const emailLookup = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  };
  return null;
};

// Filters URLs according to logged in user_id
function urlsForUser(id) {
  let filteredUrls = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrls[url] = urlDatabase[url]
    }
  }

  return filteredUrls;
}

// Protocol checker
function protocolChecker(input) {
  let longURL = input.split("");
  let protocol = [];

  for (let i = 0; i < 7; i++) {
    protocol.push(longURL[i]);
  }

  let checker = protocol.join("");

  if (checker !== 'http://') {
    return false;
  } else {
    return true;
  }
}

/*----- GET ROUTES ------*/

app.get('/', (req, res) => {
  // Checks to see if user is logged in
  // If not, user is redirected to login page
  if (req.session.user_id) {
    let myUrls = urlsForUser(req.session.user_id);
    let templateVars = {
      urls: myUrls,
      cookieName: users[req.session.user_id]
    }
    res.render('urls_index', templateVars);
  } else {
    res.render('urls_login');
  }
});


app.get('/urls', (req, res) => {
  let myUrls = urlsForUser(req.session.user_id);

  let templateVars = {
    urls: myUrls,
    cookieName: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  // Checks to see if user is logged in
  // If not, user is redirected to login page
  if (req.session.user_id) {
    let templateVars = {
      cookieName: users[req.session.user_id]
    }
    res.render('urls_new', templateVars);
  } else {
    res.render('urls_login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let myUrls = urlsForUser(req.session.user_id);

  let templateVars = {
    urls: myUrls,
    cookieName: users[req.session.user_id],
    page_id: req.params.shortURL
  };

  // Checks if user is logged in with the correct user_id
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    res.render('urls_show', templateVars);
  } else {
    res.send("Please login first to view this URL");
  }

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
    cookieName: users[req.session.user_id]
  };
  res.render('urls_registration', templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    cookieName: users[req.session.user_id]
  };
  res.render('urls_login', templateVars);
});

/*---- POST ROUTES -----*/

// Adds a new shortened url to the urlDatabase
app.post('/urls/new', (req, res) => {
  // Error handling for missing http protocol
  let longURL = protocolChecker(req.body.longURL);

  if (longURL) {
    const randomString = generateRandomString();
    urlDatabase[randomString] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    }
    res.redirect('/urls');
  } else {
    res.send('Please don\'t forget the http:// please!');
  }

});

// Handles login
app.post('/login', (req, res) => {
  const passwordCheck = req.body.password;

  // Checks to see if user exists
  let userExists = emailLookup(req.body.email);
  // Creates a cookie for returning user
  if (userExists && bcrypt.compareSync(passwordCheck, users[userExists.id].password)) {
    req.session.user_id = userExists.id;
    res.redirect('/urls')
  } else {
    res.send('Error 403: Sorry, couldn\'t find you in our pseudo-database')
  }
});

// Handles logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls')
});

// Handles a DELETE request
app.post('/urls/:shortURL/delete', (req, res) => {
  // Checks if user is logged in with the correct user_id
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls')
  } else {
    res.send("Please login first to remove this URL");
  }
});

// Updates the URL of an existing link
app.post('/urls/:id', (req, res) => {

  // Checks if user is logged in with the correct user_id
  if (urlDatabase[req.params.id].userID === req.session.user_id) {

    // Updates longURL in database
    urlDatabase[req.params.id].longURL = req.body.longURL;

    let myUrls = urlsForUser(req.session.user_id);

    let templateVars = {
      urls: myUrls,
      cookieName: users[req.session.user_id]
    };

    res.redirect('/urls')
  } else {
    res.send("Please login first to edit this URL");
  }

});


// Handles registration requests and creates a new user
app.post('/register', (req, res) => {
const password = req.body.password;
const hashedPassword = bcrypt.hashSync(password, 10);

  // Checks if email and password are valid
  if (req.body.email === "" || req.body.password === "") {
    res.send("Error 400: Please make sure your email address and password are valid");
  }

  // Checks to see if user already exists
  if (emailLookup(req.body.email)) {
    res.send("Hmm...it seems you already exist");
  } else {
    // If user ,doesn't exist, creates a new user object from registration form data
    const newUser = generateRandomString();

    users[newUser] = {
      id: newUser,
      email: req.body.email,
      password: hashedPassword
    }

    // Create a new cookie for new user
    req.session.user_id = users[newUser].id;
    res.redirect('/urls')
  }
});

// Tells the HTTP server to listen for requests on the port number defined at top
app.listen(PORT, () => {
  console.log(`Example app listening on ${PORT}!`);
});