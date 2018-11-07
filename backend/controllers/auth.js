const { validationResult } = require('express-validator/check');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name
            });
            return user.save()
        })
        .then(result => {
            res.status(201).json({
                message: 'User created!',
                userId: result._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
                next(err);
            }
        });
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let fetchedUser;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('User with this email was not found!');
                error.statusCode = 401;
                throw error;
            }
            fetchedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            // can add any data we want into jsonwebtoken sign method, do not add password though
            const token = jwt.sign({
                email: fetchedUser.email, 
                userId: fetchedUser._id.toString()
            }, 'asuperlongsecretkeyhere', { expiresIn: '1h' });
            res.status(200).json({
                token: token,
                userId: fetchedUser._id.toString()
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
                next(err);
            }
        });
};