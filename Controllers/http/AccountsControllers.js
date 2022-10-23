const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class AccountsControllers {
    static Register = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                email,
                password,
                username,
                phone,
            } = req.body;

            conn = await poolCtrlDB.getConnection();

            sql = `SELECT * FROM accounts WHERE email = ${conn.escape(email)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length > 0) {
                data = {
                    status: 404,
                    data: [],
                    msg: "email is already exist."
                };
                return Common.response(conn, res, data);
            }

            let hash_pwd = await Common.hashPassword(password);
            sql = `INSERT INTO accounts 
                    SET email = ${conn.escape(email)},
                    password = ${conn.escape(hash_pwd)},
                    username = ${conn.escape(username)},
                    mobile_phone = ${conn.escape(phone)},
                    create_dt = now()`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.affectRows == 0) {
                data = {
                    status: 500,
                    data: [],
                    msg: "Cannot register account"
                };
                return Common.response(conn, res, data);
            }

            data = {
                status: 200,
                data: [],
                msg: "register success"
            };

            return Common.response(conn, res, data);


        } catch (e) {
            console.log(e);
            data = {
                status: 500,
                data: e?.stack ? e.stack : e,
                message: "Fails"
            };
            return Common.response(conn, res, data);
        };
    };

    static Login = async (req, res) => {
        let data, conn, sql, resp
        try {
            const {
                email,
                password
            } = req.body;

            conn = await poolCtrlDB.getConnection();
            sql = `SELECT * FROM accounts WHERE email = ${conn.escape(email)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    msg: "Account is not exist."
                };
                return Common.response(conn, res, data);
            }

            let payload = {
                user_id: resp.data[0].id,
                name: resp.data[0].username,
                email: resp.data[0].email
            }
            let validate = await Common.validatePassword(password, resp.data[0].password);
            if (!validate) throw "Password is not correct.";

            sql = `UPDATE accounts SET last_login_dt = now() WHERE id = ${conn.escape(resp.data[0].id)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) throw resp.data

            let jwt = Common.createJWT(payload);
            if (!jwt.status) throw jwt.data

            data = {
                status: 200,
                data: {
                    jwt_token: jwt.data
                },
                msg: "login success"
            };

            return Common.response(conn, res, data);

        } catch (e) {
            console.log(e);
            data = {
                status: 500,
                data: e?.stack ? e.stack : e,
                message: "Fails"
            };
            return Common.response(conn, res, data);
        };
    };

    static getInfo = async (req, res) => {
        let data, conn, sql, resp
        const {
            user_id
        } = req.auth;
        try {
            conn = await poolCtrlDB.getConnection();
            sql = `SELECT email,username,mobile_phone,create_dt,last_login_dt FROM accounts WHERE id = ${conn.escape(user_id)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) throw resp.data
            if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    msg: "Cannot get information."
                };
                return Common.response(conn, res, data);
            }

            data = {
                status: 200,
                data: resp.data,
                message: "success"
            };

            return Common.response(conn, res, data);

        } catch (e) {
            console.log(e);
            data = {
                status: 500,
                data: e?.stack ? e.stack : e,
                message: "Fails"
            };
            return Common.response(conn, res, data);
        };
    };
};

module.exports = AccountsControllers;