import { Response, NextFunction } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export class UploadController {
  static async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'No file uploaded' },
        });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      const dbRes = await query(
        `INSERT INTO uploaded_files (user_id, filename, original_name, mime_type, size_bytes, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.user?.id || null,
          req.file.filename,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          fileUrl,
        ]
      );

      res.status(201).json({
        success: true,
        data: {
          id: dbRes.rows[0].id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMultiple(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILES_REQUIRED', message: 'No files uploaded' },
        });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const uploaded = [];

      for (const file of files) {
        const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
        const dbRes = await query(
          `INSERT INTO uploaded_files (user_id, filename, original_name, mime_type, size_bytes, file_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            req.user?.id || null,
            file.filename,
            file.originalname,
            file.mimetype,
            file.size,
            fileUrl,
          ]
        );

        uploaded.push({
          id: dbRes.rows[0].id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
        });
      }

      res.status(201).json({
        success: true,
        data: uploaded,
      });
    } catch (error) {
      next(error);
    }
  }
}
