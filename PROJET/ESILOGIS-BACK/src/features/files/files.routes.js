const express = require('express');
const multer = require('multer');
const filesRouter = express.Router();
const cloudinary = require('../../config/cloudinary');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { authenticate, restrictTo } = require('../../middleware/auth.middleware');
const { Role } = require('@prisma/client');
const logger = require('../../utils/logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// File size limit - 10MB
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// Validate file type
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs and Office documents are allowed.'), false);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Modified to accept any field name
const upload = multer({
    storage,
    limits: { fileSize: FILE_SIZE_LIMIT },
    fileFilter
}).any();

// File upload endpoint
filesRouter.post('/', authenticate, (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            logger.error(`Upload error: ${err.message}`);
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        }
        
        try {
            // Check if files were uploaded
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const file = req.files[0];
            
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'esilogis'
            });

            // Get file info from request
            const { interventionId, equipmentId } = req.body;
            const userId = req.user.id;

            // Save file reference to database matching the schema
            const document = await prisma.document.create({
                data: {
                    filename: file.originalname,
                    originalName: file.originalname,
                    path: result.secure_url,
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadedById: userId,
                    ...(interventionId && { interventionId: parseInt(interventionId) }),
                    ...(equipmentId && { equipmentId: parseInt(equipmentId) }),
                }
            });

            // Delete local file after upload
            fs.unlinkSync(file.path);

            logger.info(`File uploaded: ${document.id}`);
            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: document
            });
        } catch (error) {
            logger.error(`Error uploading file: ${error.message}`);
            
            // Clean up local files
            if (req.files) {
                req.files.forEach(file => {
                    if (file.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to upload file',
                error: error.message
            });
        }
    });
});

// Get documents by intervention ID
filesRouter.get('/intervention/:id', authenticate, async (req, res) => {
    try {
        const interventionId = parseInt(req.params.id);
        
        const documents = await prisma.document.findMany({
            where: {
                interventionId: interventionId
            },
            include: {
                uploadedBy: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });
        
        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        logger.error(`Error retrieving documents: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: error.message
        });
    }
});

// Get documents by equipment ID
filesRouter.get('/equipment/:id', authenticate, async (req, res) => {
    try {
        const equipmentId = parseInt(req.params.id);
        
        const documents = await prisma.document.findMany({
            where: {
                equipmentId: equipmentId
            },
            include: {
                uploadedBy: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });
        
        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        logger.error(`Error retrieving documents: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve documents',
            error: error.message
        });
    }
});

// Get text documents only (PDFs, Word docs, etc.)
filesRouter.get('/documents', authenticate, async (req, res) => {
    try {
        // const { interventionId, equipmentId } = req.query;
        
        // if (!interventionId && !equipmentId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Either interventionId or equipmentId is required'
        //     });
        // }
        
        const documentMimeTypes = [
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];
        
        const where = {
            mimetype: {
                in: documentMimeTypes
            }
        };
        
        // if (interventionId) {
        //     where.interventionId = parseInt(interventionId);
        // } else if (equipmentId) {
        //     where.equipmentId = parseInt(equipmentId);
        // }
        
        const documents = await prisma.document.findMany({
            where,
            include: {
                uploadedBy: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });
        
        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        logger.error(`Error retrieving document files: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve document files',
            error: error.message
        });
    }
});

// Delete document
filesRouter.delete('/:id', authenticate, async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Extract public ID from the Cloudinary URL if needed
        if (document.path.includes('cloudinary.com')) {
            const urlParts = document.path.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            
            // Delete from Cloudinary
            await cloudinary.uploader.destroy(publicId);
        }
        
        // Delete from database
        await prisma.document.delete({
            where: { id: documentId }
        });
        
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        logger.error(`Error deleting document: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
});

// Download a document
// Download a document (proxy method)
filesRouter.get('/:id/download', authenticate, async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        
        // Get the file from Cloudinary
        const fileUrl = document.path;
        
        logger.info(`Starting download of file: ${document.id}`);
        
        // Use axios or node-fetch to get the file
        const axios = require('axios');
        
        // Stream approach - fetch the file and pipe it to response
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream'
        });
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Type', document.mimetype);
        
        // Pipe the file directly to response
        response.data.pipe(res);
        
        // Log completion when the stream finishes
        response.data.on('end', () => {
            logger.info(`File downloaded successfully: ${document.id}`);
        });
        
        response.data.on('error', (err) => {
            logger.error(`Error streaming file: ${err.message}`);
        });
        
    } catch (error) {
        logger.error(`Error downloading document: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to download document',
            error: error.message
        });
    }
});
module.exports = filesRouter;