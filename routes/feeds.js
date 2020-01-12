const express = require('express');
const {
    check
} = require('express-validator');

const router = express.Router();
const feedsController = require('../controllers/feeds');
const isAuth = require('../middleware/is-auth');

router.get('/posts', isAuth, feedsController.getPosts);

router.post('/post', isAuth,
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
router.get('/post/:postId', isAuth, feedsController.getPost);

router.put('/post/:postId', isAuth, [
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

router.delete('/post/:postId', isAuth, feedsController.deletePost);

module.exports = router;