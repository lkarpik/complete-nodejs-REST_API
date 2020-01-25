const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');



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

    createPost: async (args, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        const { title, content, imageUrl } = args.postInput;
        const errors = [];
        console.log("Here");
        console.log(args);
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5, max: 100 })) {
            errors.push({ message: 'Title must be at least 5 characters long' });
        }
        if (validator.isEmpty(title) || !validator.isLength(content, { min: 5, max: 100 })) {
            errors.push({ message: 'Content must be at least 5 characters long' });
        }

        if (errors.length > 0) {
            const error = new Error('Post validation error')
            error.data = errors;
            error.status(422);
            console.log(error);
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found')
            error.status(401);
            throw error;
        }
        const post = new Post({
            title,
            content,
            imageUrl,
            creator: user
        });

        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }

    }
};