const authUser = (req, res, next) => {
    // Kita akan gunakan 'req.session.userId' untuk penanda login user
    if (req.session && req.session.userId) {
        return next();
    } else {
        // Redirect ke halaman login USER (bukan admin)
        return res.redirect('/login'); 
    }
};

export default authUser;