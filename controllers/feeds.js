const path = require('path');
const fs = require('fs');
const {
    validationResult
} = require('express-validator');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 3;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage);
        })
        .then(posts => {
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
    const post = new Post({
        title,
        content,
        imageUrl,
        creator: {
            name: 'Burak'
        }
    })
    post.save()
        .then(result => {
            res.status(201).json({
                post,
                message: 'Post created'
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
            err.message = 'Error occured while finding post.';
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    let deletePath;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Couldn not find post');
                error.statusCode = 404;
                throw error;
            }
            // Check authorization
            deletePath = post.imageUrl;
            return post.remove();
        })
        .then(result => {
            clearImage(deletePath);
            res.status(200).json({ message: 'Post deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            err.message = 'Error occured while finding post.';
            next(err);
        })

}

const clearImage = filePath => {
    const imgPath = path.join(__dirname, '..', filePath);
    fs.unlink(imgPath, err => console.log(err));
}