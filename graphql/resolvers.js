const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');



module.exports = {
    createUser: async (args, req) => {

        const { userInput } = args;
        const email = userInput.email;
        const name = userInput.name;
        const password = userInput.password;
        const errors = [];
        if (!validator.isEmail(email)) {
            errors.push({ message: 'E-mail is invalid' });
        }
        if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
            errors.push({ message: 'Password must be 5 characters at least' });
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input')
            error.data = errors;
            error.status = 422;
            console.log(error);
            throw error;
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists')
            throw error;
        }
        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email,
            name,
            password: hashedPw
        });

        const createdUser = await user.save();
        return {
            ...createdUser._doc,
            _id: createdUser._id.toString()
        }
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User not found!');
            error.status = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Password is incorect.');
            error.status = 401;
            throw error;
        }
        const userId = user._id.toString()
        const token = jwt.sign(
            {
                userId,
                email: user.email,
            },
            'Better done then perfect',
            {
                expiresIn: '1h'
            }
        );

        return {
            token,
            userId
        };
    },

    createPost: async ({ title, content, imageUrl }, req) => {


    }
};