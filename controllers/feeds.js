exports.getPosts = (req, res, next) => {

    console.log('getPosts');
    const title = req.body.title;
    const content = req.body.content;
    console.log(title, content);

    res.status(200).json({
        posts: [{
            title,
            content
        }]
    })
}

exports.postPosts = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;

    const post = {
        title,
        content,
        id: new Date().getTime()
    }

    res.status(201).json({
        post,
        message: 'Post created'
    });

    console.log('postPosts');
}