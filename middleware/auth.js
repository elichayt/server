// ! the client side must save is token for all interaction to avoid login 
// ! each time !
// ? token timeOut : 60mins
const jwt = require("jsonwebtoken");
const { config } = require("../config/secret");

// need to check info in jwt


//* check the token if its valid then decod it and add it to req as tokenData
exports.auth = (req, res, next) => {
    let token = req.header('x-api-key');
    if (!token) {
        return res.status(401).json({ msg: "please provide a valid token!" })
    }
    try {
        let decodedToken = jwt.verify(token, config.tokenSecret);
        req.tokenData = decodedToken

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "token is invalid or expired!" })
    }
}

//! add this middleware to check if its an admin 
// * get out of router if is not admin and res with msg 
//* if its admin continue normally in rout 
exports.isAdmin = (req, res, next) => {

    if (req.tokenData.role !== 'admin') {
        return res.status(401).json({ msg: " the action you trying to perform is allowed only for admins " });
    }
    next();

}