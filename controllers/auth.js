const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: false,
        errorMessage: message
    })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email,
          password = req.body.password,
          confirmPassword = req.body.confirmPassword;

    User
        .findOne({email: email})
        .then(userDoc => {
            if(userDoc) {
                req.flash('error', 'E-mail exists already, please pick a different one.');
                return res.redirect('/signup');
            }
            return bcrypt
                .hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: []}
                    })
                    return user.save();
                })
                .then(result => {
                    res.redirect('/login');
                });
        })
        .catch(err => {
            console.log(err)
        });
}

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false,
        // this gets stored from .postLogin, key is what we set there
        errorMessage: message
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    // session object added by express-session middleware   
    User.findOne({email: email})
        .then(user => {
            if(!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if(doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) =>{ 
                            // use .save() to ensure that the session is created within mongodb store before the redirect is fired.
                            // normally do not need to call .save() except for something like redirect
                            console.log(err);
                            return res.redirect('/')
                        })
                    }
                    req.flash('error', 'Invalid email or password.'); 
                    res.redirect('/login');
                })
                .catch(err => {
                    res.redirect('/login');
                });
        })
        .catch(err => {
            console.log(err);
        });   
}

exports.postLogout = (req, res ,next) => {
    // method provided by session package
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}

