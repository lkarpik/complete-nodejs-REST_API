const express = require('express');
const {
    check
} = require('express-validator');

const router = express.Router();
const feedsController = require('../controllers/feeds');

router.get('/posts', feedsController.getPosts);

router.post('/post',
    [
        check('title')
            .trim()
            .isString()
            .isLength({
                min: 5
            }),
        check('content')
            .trim()
            .isString()
            .isLength({
                min: 7
            })
    ], feedsController.createPost);
router.get('/post/:postId', feedsController.getPost);

router.put('/post/:postId', [
    check('title')
        .trim()
        .isString()
        .isLength({
            min: 5
        }),
    check('content')
        .trim()
        .isString()
        .isLength({
            min: 5
        })
], feedsController.uptadePost);

router.delete('/post/:postId', feedsController.deletePost);

module.exports = router;