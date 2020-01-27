const expect = require('chai').expect;
const authMiddleware = require('../middleware/is-auth');

describe('Auth middleware', function () {
    it('should throw error if no auth header is present', function () {
        const req = {
            get: function () {
                return null;
            }
        };

        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('Not atuhenticated');

    });

    it('should trow an error if the authorization header is only one string', function () {
        const req = {
            get: function (headerName) {
                return 'string';
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw();
    });

    it('should trow an error if there is wrong token', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer string';
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => { })).to.throw();
    });

    it('should give a req.userId object', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer string';
            }
        };
        authMiddleware(req, {}, () => { });
        expect(req).to.have.property('userId');
    });
});

