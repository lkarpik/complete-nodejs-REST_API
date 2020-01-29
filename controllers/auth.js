const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed')
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                name,
                email,
                password: hashedPw
            });
            return user.save()
        })
        .then(result => {
            res.status(201).json({ message: 'User created!', userId: result._id })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            err.message = 'Error occured while creating a new User';
            next(err);
        })
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try {


        const user = await User.findOne({ email });

        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404;
            throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            const error = new Error('Wrong password')
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString(),
            },
            'Better done then perfect',
            {
                expiresIn: '1h'
            }
        );

        res.status(200).json({ token, userId: foundUser._id.toString() })
        // Valid user
        return;

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        err.message = 'Error occured while login';
        next(err);
        return err;
    }
}
