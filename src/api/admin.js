import express from 'express';
import authAdmin from '../middleware/authAdmin.js'; 
import * as Admin from '../controllers/adminController.js'; 

const router = express.Router();

router.get('/login', Admin.getLoginPage);
router.post('/login', Admin.postLogin);
router.get('/logout', Admin.postLogout);

router.get('/dashboard', authAdmin, Admin.getDashboard);
router.get('/history', authAdmin, Admin.getHistoryPage);
router.get('/keys', authAdmin, Admin.getKeysPage); 

router.get('/users', authAdmin, Admin.getUserManagementPage);
router.get('/users/edit/:id', authAdmin, Admin.getEditUserPage);
router.post('/users/update/:id', authAdmin, Admin.postUpdateUser);
router.post('/users/delete/:id', authAdmin, Admin.postDeleteUser);
router.post('/users/ban/:id', authAdmin, Admin.postBanUser);
router.post('/users/unban/:id', authAdmin, Admin.postUnbanUser);

router.get('/ip-bans', authAdmin, Admin.getIpBanPage);
router.post('/ip-bans/add', authAdmin, Admin.postBanIp);
router.post('/ip-bans/unban/:id', authAdmin, Admin.postUnbanIp);
router.post('/ip-bans/quick-ban', authAdmin, Admin.postQuickBanIp);


export default router;