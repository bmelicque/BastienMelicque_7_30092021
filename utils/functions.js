exports.errorHandler = (error) => {
    switch (error) {
        case 'INVALID_EMAIL':
            return {
                code: 400,
                message: 'Adresse email invalide'
            }
        case 'INVALID_PASSWORD':
            return {
                code: 400,
                message: 'Mot de passe invalide (trop faible)'
            }
        case 'INCORRECT_LOGIN':
            return {
                code: 401,
                message: 'Identifiant(s) incorrect(s)'
            }
        case 'UNAUTHORIZED':
            return {
                code: 403,
                message: 'Requête non autorisée'
            }
        case 'USER_NOT_FOUND':
            return {
                code: 404,
                message: 'Utilisateur inexistant'
            }
        case 'POST_NOT_FOUND':
            return {
                code: 404,
                message: 'Post inexistant'
            }
        case 'COMMENT_NOT_FOUND':
            return {
                code: 404,
                message: 'Commentaire inexistant'
            }
        default:
            return {
                code: 500,
                message: error
            }
    }
}

exports.checkAuthorization = (res, userId) => {
    if (userId != res.locals.userId && res.locals.userRole != 'admin') {
        throw 'UNAUTHORIZED'
    }
    else return 0;
}