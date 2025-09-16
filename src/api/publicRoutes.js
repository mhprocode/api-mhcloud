import express from 'express';
import * as UserController from '../controllers/userController.js';
import authUser from '../middleware/authUser.js'; 

const router = express.Router();


router.get('/', UserController.getLandingPage);
router.get('/docs', UserController.getDocsIndexPage);
router.get('/docs/:slug', UserController.getDocsDetailPage);

router.get('/register', UserController.getRegisterPage);
router.post('/register', UserController.postRegister);
router.get('/login', UserController.getLoginPage); 
router.post('/login', UserController.postLogin);
router.get('/logout', UserController.postLogout);
router.get('/dashboard', authUser, UserController.getDashboard);
router.post('/dashboard/update-profile', authUser, UserController.postUpdateProfile);
router.post('/dashboard/change-password', authUser, UserController.postChangePassword);

export default router;