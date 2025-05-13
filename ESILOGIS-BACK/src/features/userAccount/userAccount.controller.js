const logger = require("../../utils/logger");
const { PrismaClient , userAccount} = require("@prisma/client");
const prisma = new PrismaClient();
async function getAllUserAccounts(req, res) {
    try {
        const userAccounts = await prisma.userAccount.findMany({
        });
        res.status(200).json({
            success: true,
            data: userAccounts,
        });
    } catch (error) {
        logger.error(`Error getting all userAccounts: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

async function deleteUserAccount(req, res) {
    const { id } = req.params;
    try {
        const userAccount = await prisma.userAccount.update({
            where: {
                id: parseInt(id),
            },
            data: {
                isBlocked: true,
            },
        });
        res.status(200).json({
            success: true,
            data: userAccount,
        });
        logger.info("blocked userAccount", id);
    } catch (error) {
        logger.error(
            `Error blocking userAccount with id ${id}: ${error.message}`
        );
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

async function unblockUserAccount(req, res) {
    const { id } = req.params;
    try {
        const userAccount = await prisma.userAccount.update({
            where: {
                id: Number(id),
            },
            data: {
                isBlocked: false,
            },
        });
        res.status(200).json({
            success: true,
            data: userAccount,
        });
    } catch (error) {
        logger.error(
            `Error unblocking userAccount with id ${id}: ${error.message}`
        );
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    getAllUserAccounts,
    deleteUserAccount,
    unblockUserAccount,
};
