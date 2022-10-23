const {
    GLOBAL_SALT
} = process.env
const md5 = require('md5')
const ev = require("express-validator");
const Common = require("../Libraries/Common");


class Authen {
    static async checkJwt(req, res, next) {

        if (!req?.headers?.authorization) {
            return res.status(403).send("No header Authorization value");
        }
        const accessToken = req.headers["authorization"].split(" ");
        if (accessToken[0] != "Bearer") {
            return res.status(403).send("Unauthorized (1) : Wrong authorization method");
        } else {
            let auth = Common.verifyJWT(accessToken[1]);
            if (!auth.status) {
                return res.status(403).send({ status: auth.status, msg: auth.msg });
            }
            req.auth = {};
            req.auth.accessToken = accessToken[1];
            req.auth.user_id = auth.data.user_id;
        }
        let errors = ev.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                data: errors.mapped(),
            });
        }
        next();

    };
    static checkToken(req, res, next) {
        try {
            if (!req.headers || !req.headers.authorization) return res.status(403).send("Unauthorized (1)");

            let auth = req.headers.authorization.split(':')

            if (auth[0] != "Token" || auth[1] === undefined) return res.status(403).send("Unauthorized (2)");

            let time = req.query.time || req.body.time || req.params.time
            if (!time || isNaN(time)) return res.status(403).send("Unauthorized (3)");
            if (auth[1] != md5(GLOBAL_SALT + time)) return res.status(403).send("Unauthorized (4)");

            let errors = ev.validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 400,
                    data: errors.mapped(),
                });
            }
            next()

        } catch (e) {
            return res.status(500).send("Internal Server Error!");
        };
    };

}

module.exports = Authen