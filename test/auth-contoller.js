const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth Controller - Login', function () {
    it('should throw an errorwith 500 if accessing the database fails', function (done) {

        sinon.stub(User, 'findOne');
        User.findOne.throws();

        const req = {
            body: {
                email: 'email@email.com',
                password: 'tester'
            }
        };

        AuthController.login(req, {}, () => { }).then(res => {
            expect(res).to.be.an('error');
            expect(res).to.have.property('statusCode', 501);
            done();
        });

        User.findOne.restore()
        // jwt.sign.restore();
    });

    it('should send a response with a valid user status for an existing user', function (done) {
        const MONGO_URI = `mongodb+srv://lkarpik:At0fLuVKgPddwPlr@sandbox-0erkh.mongodb.net/nodejsCompleteAPI-testDB`
        mongoose
            .connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            })
            .then(result => {
                const user = new User({
                    email: 'test@test.com',
                    password: 'password',
                    name: 'Test',
                    posts: [],
                    _id: '5c0f66b979ad55031b34728a'
                });
                return user.save();
            })
            .then(() => {
                req = { userId: '5c0f66b979ad55031b34728a' }
                res = {
                    statusCode: 500,
                    userStatus: null,
                    status: function (code) {
                        this.statusCode = code;
                        return this;
                    },
                    json: function (data) {
                        this.userStatus = data.status;

                    }
                };
                AuthController.getUserStatus(req, res, () => { }).then(result => {
                    expect(req.statusCode).to.be.equal(200);

                });
            })
            .catch(err => console.log(err))

    });
});

