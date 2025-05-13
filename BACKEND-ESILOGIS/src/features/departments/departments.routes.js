const express = require('express');
const departmentsRouter = express.Router();
const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../../utils/logger");
const {
    restrictTo,
    authenticate,
} = require("../../middleware/auth.middleware");

departmentsRouter.get('/', authenticate, restrictTo(Role.ADMIN), async (req, res) => {
    try {
        const departments = await prisma.department.findMany();
        res.status(200).json({
            success: true,
            data: departments,
        });
        logger.info(`Fetched all departments: ${departments.length} found`);
    } catch (error) {
        logger.error(`Error fetching departments: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

departmentsRouter.post('/', authenticate, restrictTo(Role.ADMIN), async (req, res) => {
    try {
        const { name } = req.body;
        const newDepartment = await prisma.department.create({
            data: {
                name,
            },
        });
        res.status(201).json({
            success: true,
            data: newDepartment,
        });
        logger.info(`Created new department: ${newDepartment.name}`);

    }catch(error){
        logger.error(`Error fetching department: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

departmentsRouter.put('/:id', authenticate, restrictTo(Role.ADMIN), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const updatedDepartment = await prisma.department.update({
            where: { id: parseInt(id) },
            data: { name },
        });
        res.status(200).json({
            success: true,
            data: updatedDepartment,
        });
        logger.info(`Updated department ${id}: ${updatedDepartment.name}`);
    } catch (error) {
        logger.error(`Error updating department ${id}: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

module.exports = departmentsRouter;