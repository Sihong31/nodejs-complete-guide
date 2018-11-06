const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');

const shopController = require("./controllers/shop");
const isAuth = require('./middleware/is-auth');

const MONGODB_URI = 'MY CONNECTION';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

// common status codes
// 200 -> Operation succeeded
// 201 -> Success, resource created
// 301 -> Moved permananently
// 401 -> Not authenticated
// 403 -> Not authorized
// 404 -> Not found
// 422 -> Invalid input
// 500 -> Server-side error

// csrf checks POST requests in our views since they generally involve data changes
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);  
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// secret should be a long string value in production
app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: store}));
// use flash() after session is stored
// flash is for showing 'flash' error messages
app.use(flash());

app.use((req, res, next) => {
    // included in every rendered view using 'locals' field provided by express
    // passing local variables into every view rendered
    res.locals.isAuthenticated = req.session.isLoggedIn;
    next();
})

app.use((req, res, next) => {
    if(!req.session.user) {
        // return next so code below will not be executed
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            // inside async code need to use next(new Error(err));
            // outside of async code, throw new Error('Dummy Error');
            next(new Error(err));
        });  
})

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.get404);

// if next(error) is called anywhere in app, express will skip other middleware and come directly to this special error handling middleware
// multiple error handling middlewares are called top to bottom as per usual
app.use((error, req, res, next) => {
    console.log(error);
    // res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: '500 Server Error', 
        path: '/500',
        isAuthenticated: true,
        csrfToken: ''
    });
});

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

