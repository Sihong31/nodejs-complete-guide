const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'MY CONNECTION';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
// csrf checks POST requests in our views since they generally involve data changes
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
// secret should be a long string value in production
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));
app.use(csrfProtection);
// use flash() after session is stored
// flash is for showing 'flash' error messages
app.use(flash());

app.use((req, res, next) => {
    if(!req.session.user) {
        // return next so code below will not be executed
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
        });  
})

app.use((req, res, next) => {
    // included in every rendered view using 'locals' field provided by express
    // passing local variables into every view rendered
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        MONGODB_URI
    )
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });

