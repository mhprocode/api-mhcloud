const authAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        // Jika sudah login (session admin ada)
        return next();
    } else {
        // Jika belum login, lempar ke halaman login
        return res.redirect('/admin/login');
    }
};
export default authAdmin;