const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

const clearImage = require('../util/fileHelper')

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

    },

    posts: async ({ page }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        if (!page) {
            page = 1;
        }

        const perPage = 3;

        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('creator', '-password')
        const returnedPosts = posts.map(post => {
            return {
                ...post._doc,
                _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            }
        })

        return {
            posts: returnedPosts, totalPosts
        }
    },

    post: async ({ id }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }
        const post = await (await Post.findById(id).populate('creator', '-password'));
        if (!post) {
            const error = new Error('No post found.')
            error.status = 404;
            throw error;
        }
        // post.createdAt = post.createdAt.toLocaleString();
        post._id = post._id.toString();
        post.createdAt = post.createdAt.toISOString();

        return {
            ...post._doc,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            _id: post._id.toString()
        }
    },

    updatePost: async ({ id, postInput }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        const { title, content, imageUrl } = postInput;
        const post = await Post.findById(id).populate('creator', '-password');

        if (!post) {
            const error = new Error('No post found.')
            error.status = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not authorized');
            error.status = 403;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5, max: 100 })) {
            errors.push({ message: 'Title must be at least 5 characters long' });
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5, max: 100 })) {
            errors.push({ message: 'Content must be at least 5 characters long' });
        }

        if (errors.length > 0) {
            const error = new Error('Post validation error')
            error.data = errors;
            error.status(422);
            console.log(error);
            throw error;
        }
        post.title = title;
        post.content = content;

        if (typeof imageUrl !== 'undefined') {
            post.imageUrl = imageUrl;
        }
        const updatedPost = await post.save()
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async ({ id }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        const post = await Post.findById(id);

        if (!post) {
            const error = new Error('No post found.')
            error.status = 404;
            throw error;
        }

        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized');
            error.status = 403;
            throw error;
        }

        clearImage(post.imageUrl);

        await post.remove();

        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();

        return true;

    },
    user: async (args, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found.')
            error.status = 404;
            throw error;
        }

        return { ...user._doc, _id: user._id.toString() };

    },

    updateStatus: async ({ status }, req) => {

        if (!req.isAuth) {
            const error = new Error('Not authenticated')
            error.status = 401;
            throw error;
        }

        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error('No user found.')
            error.status = 404;
            throw error;
        }
        user.status = status
        await user.save();

        return { ...user._doc, _id: user._id.toString() }

    }
};

