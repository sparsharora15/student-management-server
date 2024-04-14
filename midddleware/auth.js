const jwt = require('jsonwebtoken');

exports.authUser = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const verification = jwt.verify(token,process.env.JWTSECRETKET ); 
            if (verification) {
                req.user = verification;
                next();
            } else {
                res.status(401).json({
                    status: "Unauthorized",
                    message: "Invalid Token"
                });
            }
        } else {
            res.status(401).json({
                status: "Unauthorized",
                message: "No token passed"
            });
        }
    } catch (e) {
        res.status(401).json({
            status: "Unauthorized",
            message: 'You are not authorized'
        });
    }
};