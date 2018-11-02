const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false
    })
}

exports.postLogin = (req, res, next) => {
    // session object added by express-session middleware   
    User.findById('5bdb45fc0e4f5b72b41b6384')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) =>{
                // use .save() to ensure that the session is created within mongodb store before the redirect is fired.
                // normally do not need to call .save() except for something like redirect
                console.log(err);
                res.redirect('/');
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