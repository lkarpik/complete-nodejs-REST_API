const express = require('express');
const {
    check
} = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();

router.put('/signup', [
    check('name')
        .trim()
        .isAlphanumeric()
        .withMessage('Name must contain only alphanumeric characters.')
        .isLength({ min: 5 })
        .withMessage('Name must have at least 5 characters.'),
    check('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter valid email')
        .custom(email => {
            return User.findOne({ email })
                .then(user => {
                    if (user) {
                        return Promise.reject('Email already exist')
                    }
                })
                .catch(err => {
                    if (!err.statusCode) {
                        err.statusCode = 500;
                    }
                    err.message = 'Error occured while querying database.';
                    console.log(err);
                    next(err);
                })
        }),

    check('password')
        .trim()
        .isString()
        .isLength({ min: 5 })

], authController.signup);

router.post('/login', authController.login)

module.exports = router;