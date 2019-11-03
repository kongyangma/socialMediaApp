// Load modules
const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
// Connect to MongoURI exported from external file
const keys = require('./config/keys.js');
// User collection
const User = require('./models/user.js');
// Link passports to the server
require('./passport/google-passport');
require('./passport/facebook-passport');
require('./passport/instagram-passport');
// Initialize application
const app = express();
// Express config
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ 
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
// set global vars for user
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
})
// Setup template engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
// Setup static file to serve css, javascript and images
app.set('view engine', 'handlebars');
// Connect to remote database
app.use(express.static('public'));
// connect to remote database
mongoose.Promise = global.Promise;
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to Remote Database....');
}).catch((err) => {
    console.log(err);
});
// Setup environment variable for port
const port = process.env.PORT || 3000;
// Handle routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
});

// GOOGLE AUTH ROUTE
app.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/' 
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });

// FACEBOOK AUTH ROUTE
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { 
        failureRedirect: '/' 
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });
// HANDLE INSTAGRAM AUTH ROUTE
app.get('/auth/instagram',
  passport.authenticate('instagram'));

app.get('/auth/instagram/callback', 
  passport.authenticate('instagram', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });
// Handle profile route
app.get('/profile', (req, res) => {
    User.findById({_id: req.user._id})
    .then((user) => {
        res.render('profile', {
            user: user
        });
    })
});
// HANDLE EMAIL POST ROUTE
app.post('/addEmail', (req, res) => {
    const email = req.body.email;
    User.findById({_id: req.user._id})
    .then((user) => {
        user.email = email;
        user.save()
        .then(() => {
            res.redirect('/profile');
        });
    });
});
// Handle User Logout Route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});