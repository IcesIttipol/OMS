const poolCtrlDB = require("../../Database/ctrlDB");
const Common = require("../../Libraries/Common");

class ProductsControllers {
    static ProductList = async (req, res) => {
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
            sql = `SELECT COUNT(id) as total FROM products`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found product data"
                }
                return Common.response(conn, res, data);
            }
            let total = resp.data[0].total;
            sql = `SELECT * FROM products LIMIT ${limit} OFFSET ${page}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found product data"
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

    static ProductDetail = async (req, res) => {
        let data, conn, sql, resp;
        try {
            const {
                product_id
            } = req.params;

            const {
                user_id
            } = req.auth;

            conn = await poolCtrlDB.getConnection();

            sql = `SELECT id as product_id,name,description,status,images,width,length,height,weight,create_dt,update_dt 
                        FROM products WHERE id = ${conn.escape(product_id)}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found product data"
                }
                return Common.response(conn, res, data);
            }
            let products = resp.data[0];
            sql = `SELECT a.id as variation_id,a.name,a.attribute_id,a.brand_name,a.price,a.qty,b.name
                        FROM product_variations a JOIN product_attributes b ON a.attribute_id = b.id 
                        WHERE a.product_id = ${conn.escape(products.product_id)}`
            resp = await Common.handleQuery(conn.query(sql));
            if (!resp.status) {
                throw resp.data
            } else if (resp?.data.length == 0) {
                data = {
                    status: 404,
                    data: [],
                    message: "Not found variation data"
                }
                return Common.response(conn, res, data);
            }
            products.variation_list = resp.data
            data = {
                status: 200,
                data: products,
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

module.exports = ProductsControllers;