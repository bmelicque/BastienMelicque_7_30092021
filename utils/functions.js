exports.errorHandler = (error, res) => {
    const { code, message } = error;
    if (code) {
        res.status(code).json({ error: message })
    }
    else res.status(500).json({ error })
}

exports.checkAuthorization = (res, userId) => {
    if (userId != res.locals.userId || res.locals.userRole != 'admin')
        res.status(403).json({ error: 'Requête non autorisée' })
    else return 0;
}