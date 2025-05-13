const express = require('express');
const userAccountRouter = express.Router();
const userAccountController = require('./userAccount.controller');
const { authenticate, restrictTo } = require('../../middleware/auth.middleware');
const { Role } = require('@prisma/client');


userAccountRouter.get('/', authenticate, restrictTo(Role.ADMIN), userAccountController.getAllUserAccounts);

userAccountRouter.delete('/:id', authenticate, restrictTo(Role.ADMIN), userAccountController.deleteUserAccount);

userAccountRouter.put('/:id', authenticate, restrictTo(Role.ADMIN), userAccountController.unblockUserAccount);

module.exports = userAccountRouter;