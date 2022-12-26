const mongoose = require('mongoose');
const Joi = require('joi');
const { date } = require('joi');
const jwt = require('jsonwebtoken');
const { config } = require('../config/secret')



// 
/**
 * ? schema of user -> sended by mongoose to database
 * ? build by Schema constructor of mongoose 
 */
const userSchema = new mongoose.Schema({
    userName: String,
    password: String,
    email: String,
    date_created: {
        type: Date,
        default: Date.now()
    },
    role: {
        type: String,
        default: 'user'
    }


});
/*
* export a model that herit from schema 
*/
exports.UserModel = mongoose.model("userModel", userSchema, "users");

// * validation for user creation 
exports.userValidation = bodyRequest => {
    let joiSchema = Joi.object({
        userName: Joi.string().alphanum().min(2).max(30).required(),
        password: Joi.string().alphanum().min(8).max(16).required(),
        email: Joi.string().email().required(),
        // ! emali tag is limited and check regex of vald email
    })
    return joiSchema.validate(bodyRequest);
}


// *validation for login.  account can be username and mail 
exports.loginValidation = bodyRequest => {
    let joiSchema = Joi.object({
        account: Joi.string().min(2).max(30).required(),
        password: Joi.string().alphanum().min(8).max(16).required()
    })
    return joiSchema.validate(bodyRequest);
};

// * validation for deletion check id
exports.delUserValidation = bodyRequest => {
    let joiSchema = Joi.object({
        _id: Joi.string().alphanum().max(999).required()
    })
    return joiSchema.validate(bodyRequest)
}

// * validation for update here all schema is optional you wiil notified in th route if nothing changed 
exports.userUpdateValidation = bodyRequest => {
    let joiSchema = Joi.object({
        userName: Joi.string().alphanum().min(2).max(30),
        password: Joi.string().alphanum().min(8).max(16),
        email: Joi.string().email().max(999),
        role: Joi.string().max(999).allow("admin","user"),
        
    })
    return joiSchema.validate(bodyRequest);
}

// * creat token when user login .time befor expired : 60mins
// ? payload containig in of user and role for middleware checks  
exports.creatToken = (_id, _role) => {
    let token = jwt.sign({ id: _id, role: _role }, config.tokenSecret, { expiresIn: "60mins" })
    return token;
}
