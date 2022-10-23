const route = require('express').Router();
const Authen = require('../Middleware/Authen');
const ex = require("express-validator");

//ACCCOUNT
const Accounts = require('../Controllers/http/AccountsControllers');
route.post('/account/register/:time', [
    ex.body("email").notEmpty().isEmail(),
    ex.body("password").notEmpty().isLength({ min: 6 }),
    ex.body("username").notEmpty(),
    ex.body("phone").notEmpty(),
], Authen.checkToken, Accounts.Register);

route.post('/account/login/:time', [
    ex.body("email").notEmpty().isEmail(),
    ex.body("password").notEmpty().isLength({ min: 6 })
], Authen.checkToken, Accounts.Login);

route.get('/account/info', Authen.checkJwt, Accounts.getInfo);


//ORDERS
const Orders = require('../Controllers/http/OrdersControllers');
route.post('/order/create', [
    ex.body("variation_list").notEmpty().isArray(),
    ex.body("variation_list.*.variation_id").notEmpty().isInt(),
    ex.body("variation_list.*.attribute_id").notEmpty().isInt(),
    ex.body("variation_list.*.qty").notEmpty().isInt(),
    ex.body("shipping_name").notEmpty(),
    ex.body("shipping_phone").notEmpty().isMobilePhone(),
    ex.body("shipping_address").notEmpty(),
    ex.body("shipping_subdistrict").notEmpty(),
    ex.body("shipping_district").notEmpty(),
    ex.body("shipping_province").notEmpty(),
    ex.body("shipping_postcode").notEmpty().isNumeric(),
    ex.body("receiver_name").notEmpty(),
    ex.body("receiver_phone").notEmpty().isMobilePhone(),
    ex.body("receiver_address").notEmpty(),
    ex.body("receiver_subdistrict").notEmpty(),
    ex.body("receiver_district").notEmpty(),
    ex.body("receiver_province").notEmpty(),
    ex.body("receiver_postcode").notEmpty().isNumeric(),
], Authen.checkJwt, Orders.CreateOrder);

route.post('/order/cancel', [
    ex.body("order_id").notEmpty().isInt()
], Authen.checkJwt, Orders.CancelOrder);

route.get('/order/list', [
    ex.query("page").notEmpty().isInt({ min: 0 }),
    ex.query("limit").notEmpty().isInt({ min: 1 }),
], Authen.checkJwt, Orders.OrderList);

route.get('/order/detail/:order_id', [
    ex.param("order_id").notEmpty().isInt(),
], Authen.checkJwt, Orders.OrderDetail);

//PRODUCTS
const Products = require('../Controllers/http/ProductsControllers');
route.get('/product/list', [
    ex.query("page").notEmpty().isInt({ min: 0 }),
    ex.query("limit").notEmpty().isInt({ min: 1 }),
], Authen.checkJwt, Products.ProductList);

route.get('/product/detail/:product_id', [
    ex.param("product_id").notEmpty().isInt(),
], Authen.checkJwt, Products.ProductDetail);

module.exports = route