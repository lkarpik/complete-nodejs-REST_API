const express = require('express');
const router = express.Router();
const feedsController = require('../controllers/feeds');

router.get('/posts', feedsController.getPosts);

router.post('/posts', feedsController.postPosts);


module.exports = router;