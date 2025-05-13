// src/app.routes.js - Main router that connects all feature routes
const express = require('express');
const router = express.Router();

// Import feature routes
const authRoutes = require('./features/auth/auth.routes');
const equipmentRoutes = require('./features/equipment/equipment.routes');
const interventionRoutes = require('./features/intervention/intervention.routes');
const locationRoutes = require('./features/location/location.routes');
const equipmentTypeRoutes = require('./features/equipmentType/equipmentType.routes');
const personRoutes = require('./features/person/person.routes');
const userAccountRoutes = require('./features/userAccount/userAccount.routes');
const departmentsRoutes = require('./features/departments/departments.routes');
const filesRoutes = require('./features/files/files.routes');
// Auth routes (at root level)
router.use('/auth', authRoutes);

// API routes (under /api namespace)
const apiRouter = express.Router();
apiRouter.use('/equipment', equipmentRoutes);
apiRouter.use('/equipment-type', equipmentTypeRoutes);
apiRouter.use('/intervention', interventionRoutes);
apiRouter.use('/location', locationRoutes);
apiRouter.use('/technicians', personRoutes);
apiRouter.use('/userAccounts', userAccountRoutes);
apiRouter.use('/departments', departmentsRoutes);
apiRouter.use('/files', filesRoutes);

// Mount API router
router.use('/api', apiRouter);

module.exports = router;