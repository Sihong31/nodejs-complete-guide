const express = require('express');
const { check } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/signup', authController.getSignup);

// check takes name attributes on the form, checks headers, cookies, etc
router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .custom((value, {req}) => {
                // if (value === 'test@test.com') {
                //     throw new Error('This email address is forbidden.');
                // }
                // return true;
                return User.findOne({email: value})
                    .then(userDoc => {
                        if(userDoc) {
                            return Promise.reject('Email exists already, please pick a different one');
                        }
                    })
            })
            .normalizeEmail(),
        // second argument in check() is for the default message in validators
        check('password', 'Please enter a password with only numbersand text and at least 5 characters.')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim(),
        check('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ],
    authController.postSignup);

router.get('/login', authController.getLogin);

router.post('/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .normalizeEmail()
            .custom((value, { req }) => {
                return User.findOne({email: value})
                    .then(user => {
                        if(!user) {
                            return Promise.reject('This email does not exist!');
                        }
                    })
            }),
        check('password', 'Password has to be valid')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim()
    ], 
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;