const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const graphQlHttp = require('express-graphql');
const auth = require('./middleware/auth');

const app = express();

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/')
    },
    filename: (req, file, cb) => {
        cb(null, 'postimg-' + Date.now() + '-' + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    // const ext = path.extname(file.originalname);
    // pulling only extention without file type
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        const error = new Error('Wrong file format');
        error.statusCode = 422;
        cb(new Error('Wrong file format'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter
}).single('image');


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(upload);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(auth);

app.use('/graphql', graphQlHttp({
    schema: require('./graphql/shema'),
    rootValue: require('./graphql/resolvers'),
    graphiql: true,
    customFormatErrorFn(err) {
        if (!err.originalError) {
            console.log(err);
            return err;
        }
        const data = err.originalError.data;
        const message = err.originalError.message || 'Error occured';
        const status = err.originalError.status || 500;
        return { message, status, data };
    }
}));

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    console.log(error);
    console.log(message);
    res.status(status).json({ message, data });
})

const MONGO_URI = `mongodb+srv://lkarpik:At0fLuVKgPddwPlr@sandbox-0erkh.mongodb.net/nodejsCompleteAPI`

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(result => {
        console.log('Conected do db!')

        app.listen(8080);

    })
    .catch(err => console.log(err))