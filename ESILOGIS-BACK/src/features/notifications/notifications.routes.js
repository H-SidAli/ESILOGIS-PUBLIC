const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.service');
const { authenticate, restrictTo } = require('../../middleware/auth.middleware');

// create a new notification, notify by email and sms and push notification
router.post('/notify', authenticate, notificationsController.createNotification);

// get all notifications for a user
router.get('/', authenticate, notificationsController.getNotifications);

router.get('/', authenticate, restrictTo('admin'), notificationsController.getAllNotifications);
