const path = require('path');
const fs = require('fs');
const {
    validationResult
} = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 3;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .populate('creator', ('name email'))
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage);
        })
        .then(posts => {
            console.log(posts);
            res.status(200).json({
                message: 'Fetched posts successfully',
                posts,
                totalItems
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            err.message = 'Error occured while fetching posts.';
            next(err);
        });
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new Error('Validation error when creating a post!');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided')
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = path.normalize(req.file.path);
    let creator;
    const post = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId
    })
    post.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save()
        })
        .then(result => {

            res.status(201).json({
                post,
                message: 'Post created',
                creator: { _id: creator._id, name: creator.name }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            err.message = 'Error occured while saving post to database. Try again later.';
            next(err);
        })

}

exports.getPost = (req, res, next) => {
    const post_id = req.params.postId;
    Post.findById(post_id)
        .populate('creator', ('name'))
        .then(post => {

            if (!post) {
                const error = new Error('Couldn not find post');
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({
                post,
                message: 'Post found'
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            err.message = 'Error occured while finding post.';
            next(err);
        })
};

exports.uptadePost = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new Error('Validation error when updating a post!');
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Couldn not find post');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized');
                error.statusCode = 404;
                throw error;
            }

            post.title = req.body.title;
            post.content = req.body.content;
            if (req.file && post.imageUrl) {

                clearImage(post.imageUrl);
                post.imageUrl = path.normalize(req.file.path);
            }
            return post.save();
        }).then(post => {
            res.status(200).json({
                message: 'Content updated!',
                post
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Couldn not find post');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized!')
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return post.remove();
        })
        .then(result => {
            return User.findById(req.userId)
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Post deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}

const clearImage = filePath => {
    const imgPath = path.join(__dirname, '..', filePath);
    fs.unlink(imgPath, err => console.log(err));
}