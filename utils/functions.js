exports.errorHandler = (error, res) => {
    const { code, message } = error;
    if (code) {
        res.status(code).json({ error: message })
    }
    else res.status(500).json({ error })
}

exports.checkAuthorization = (res, userId) => {
    if (userId != res.locals.userId || res.locals.userRole != 'admin')
        throw {
            code: 403,
            message: "Vous n'êtes pas autorisés à accéder à cette ressource"
        }
    else return 0;
}