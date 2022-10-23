const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class OrdersControllers {
    static CreateOrder = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                variation_list,
                shipping_name,
                shipping_phone,
                shipping_address,
                shipping_subdistrict,
                shipping_district,
                shipping_province,
                shipping_postcode,
                receiver_name,
                receiver_phone,
                receiver_address,
                receiver_subdistrict,
                receiver_district,
                receiver_province,
                receiver_postcode,
                remark
            } = req.body;

            const {
                user_id
            } = req.auth;

            conn = await poolCtrlDB.getConnection();
            sql = `SELECT * FROM accounts WHERE id = ${conn.escape(user_id)}`;
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

            let order_id;
            let i = 0;
            let dt = new Date();
            let prefix = `${dt.getFullYear()}${dt.getDate()}`;
            let order_number = (prefix + Common.ranStr(6)).toUpperCase();
            let account_id = resp.data[0].id
            try {
                await conn.query('START TRANSACTION');
                do {
                    i++;
                    sql = `SELECT * FROM orders WHERE order_number = ${conn.escape(order_number)}`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    } else if (resp?.data.length > 0) {
                        order_number = (prefix + Common.ranStr(6)).toUpperCase();
                        continue;
                    }

                    sql = `INSERT INTO orders SET 
                        ${remark ? `remark = ${conn.escape(remark)},` : ``}
                        account_id = ${conn.escape(account_id)},
                        order_number= ${conn.escape(order_number)},
                        shipping_name= ${conn.escape(shipping_name)},
                        shipping_phone= ${conn.escape(shipping_phone)},
                        shipping_address= ${conn.escape(shipping_address)},
                        shipping_subdistrict= ${conn.escape(shipping_subdistrict)},
                        shipping_district= ${conn.escape(shipping_district)},
                        shipping_province= ${conn.escape(shipping_province)},
                        shipping_postcode= ${conn.escape(shipping_postcode)},
                        receiver_name= ${conn.escape(receiver_name)},
                        receiver_phone= ${conn.escape(receiver_phone)},
                        receiver_address= ${conn.escape(receiver_address)},
                        receiver_subdistrict= ${conn.escape(receiver_subdistrict)},
                        receiver_district= ${conn.escape(receiver_district)},
                        receiver_province= ${conn.escape(receiver_province)},
                        receiver_postcode= ${conn.escape(receiver_postcode)},
                        create_dt = now()`;
                    resp = await Common.handleQuery(conn.query(sql));
                    if (!resp.status) {
                        throw resp.data
                    }
                    order_id = resp.data.insertId;

                    for (let row of variation_list) {
                        sql = `SELECT a.id as variation_id, a.attribute_id, b.id as product_id, a.price, a.qty
                                FROM product_variations a JOIN products b ON a.product_id = b.id 
                                WHERE a.id = ${conn.escape(row.variation_id)} AND a.attribute_id = ${conn.escape(row.attribute_id)}`;
                        resp = await Common.handleQuery(conn.query(sql));
                        if (!resp.status) {
                            throw resp.data
                        } else if (resp?.data.length == 0) {
                            data = {
                                status: 500,
                                data: [],
                                message: `variation id ${row.variation_id} , attribute id ${row.attribute_id} is not exist.`
                            }
                            return Common.response(conn, res, data);
                        }

                        if (resp.data[0].qty < row.qty) {
                            data = {
                                status: 500,
                                data: [],
                                message: `variation id ${row.variation_id} , attribute id ${row.attribute_id} qty not enough.`
                            }
                            return Common.response(conn, res, data);
                        }


                        sql = `INSERT INTO order_details SET 
                                order_id = ${order_id},
                                product_id = ${resp.data[0].product_id},
                                variation_id = ${resp.data[0].variation_id},
                                price = ${conn.escape(resp.data[0].price)},
                                qty = ${row.qty},
                                create_dt = now()`
                        resp = await Common.handleQuery(conn.query(sql));
                        if (!resp.status) {
                            throw resp.data
                        } else if (resp.data.affectedRows == 0) {
                            throw "Cannot save order details"
                        }

                        sql = `UPDATE product_variations SET qty = qty - ${row.qty}, update_dt = now() WHERE id = ${conn.escape(row.variation_id)} AND attribute_id = ${conn.escape(row.attribute_id)}`
                        resp = await Common.handleQuery(conn.query(sql));
                        if (!resp.status) {
                            throw resp.data
                        } else if (resp.data.affectedRows == 0) {
                            throw "Cannot update variation qty"
                        }

                    }
                    break;
                } while (i <= 3)

                if (i >= 3) {
                    data = {
                        status: 500,
                        data: [],
                        message: `Cannot generate order number`
                    }

                    return Common.response(conn, res, data);
                }

                await conn.query('COMMIT');

                data = {
                    status: 200,
                    data: {
                        order_id,
                        order_number
                    },
                    msg: "create success"
                };

                return Common.response(conn, res, data);

            } catch (e) {
                await conn.query('ROLLBACK');
                if (conn) conn.release();
                throw e
            };

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

    static CancelOrder = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                order_id,
            } = req.body;

            const {
                user_id
            } = req.auth;

            conn = await poolCtrlDB.getConnection();
            sql = `SELECT * FROM accounts WHERE id = ${conn.escape(user_id)}`;
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

            sql = `SELECT * FROM orders WHERE id = ${conn.escape(order_id)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    msg: "Order is not exist."
                };
                return Common.response(conn, res, data);
            } else if (resp.data[0].cancel_status == 1) {
                data = {
                    status: 404,
                    data: [],
                    msg: "Order already cancelled."
                };
                return Common.response(conn, res, data);
            }

            else if (resp.data[0].status == 1) {
                data = {
                    status: 404,
                    data: [],
                    msg: "Cannot cancel completed order."
                };
                return Common.response(conn, res, data);
            }

            sql = `UPDATE orders SET cancel_status = 1 , cancel_by = ${conn.escape(resp.data[0].username)}, update_dt = now() WHERE id = ${conn.escape(order_id)}`;
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.affectedRows == 0) {
                throw "Cannot cancel order"
            }

            data = {
                status: 200,
                data: {
                    order_id
                },
                msg: "cancel success"
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

    static OrderList = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                page,
                limit,
            } = req.query;

            const {
                user_id
            } = req.auth;

            conn = await poolCtrlDB.getConnection();
            sql = `SELECT COUNT(id) as total FROM orders WHERE account_id = ${conn.escape(user_id)}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found count data"
                }
                return Common.response(conn, res, data);
            }
            let total = resp.data[0].total;

            sql = `SELECT * FROM orders WHERE account_id = ${conn.escape(user_id)} LIMIT ${limit} OFFSET ${page}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found data"
                }
                return Common.response(conn, res, data);
            }
            data = {
                status: 200,
                data: resp.data,
                total: total,
                msg: "success"
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

    static OrderDetail = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                order_id
            } = req.params;

            const {
                user_id
            } = req.auth;

            conn = await poolCtrlDB.getConnection();
            sql = `SELECT * FROM orders WHERE account_id = ${conn.escape(user_id)} AND id = ${conn.escape(order_id)}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found data"
                }

                return Common.response(conn, res, data);
            }
            data = {
                status: 200,
                data: resp.data,
                msg: "success"
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

module.exports = OrdersControllers;