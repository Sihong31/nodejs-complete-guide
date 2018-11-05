// node provided package for creating unique secure values
const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const User = require('../models/user');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: 'SENDGRID API KEY'
    }
}));

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
                    return transporter.sendMail({
                        to: email,
                        from: 'shop@node-shop.com',
                        subject: 'Sign up complete!',
                        html: '<h1>You successfully signed up!</h1>'
                    });
                    
                })
                .catch(err => {
                    console.log(err);
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

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/reset', {
        path: 'reset',
        pageTitle: 'Password Reset',
        errorMessage: message,
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                // milliseconds
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                   to: req.body.email,
                   from: 'shop@node-shop.com',
                   subject: 'Password reset',
                   html: `
                    <p>You requested a password reset </p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                   `
                });
            })
            .catch(err => {
                console.log(err);
            })
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            console.log(err);
        });
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let fetchedUser;
    User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()},  _id: userId})
        .then(user => {
            fetchedUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            fetchedUser.password = hashedPassword;
            fetchedUser.resetToken = null;
            fetchedUser.resetTokenExpiration = undefined;
            return fetchedUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        })
}   

