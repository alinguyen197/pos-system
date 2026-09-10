import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { ApiResponder } from '../utils'
import { ValidationError } from '../exceptions'

const uploadDir = path.join(__dirname, '../../uploads/products')

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, fileName } = req.body

    if (!image) {
      throw new ValidationError(
        [
          {
            field: 'image',
            messageCode: 'ERR_REQUIRED',
            message: 'Dữ liệu hình ảnh không được để trống',
          },
        ],
        'Dữ liệu hình ảnh không hợp lệ'
      )
    }

    // If image is already an HTTP URL, return as is
    if (
      typeof image === 'string' &&
      (image.startsWith('http://') || image.startsWith('https://'))
    ) {
      return ApiResponder.success(res, { url: image }, 'Tải ảnh thành công')
    }

    // Extract Base64 content
    let base64Data = image
    let extension = 'png'

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,')
      const mime = parts[0]
      if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg'
      else if (mime.includes('png')) extension = 'png'
      else if (mime.includes('webp')) extension = 'webp'
      base64Data = parts[1]
    }

    const uniqueName = fileName
      ? `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`

    const filePath = path.join(uploadDir, uniqueName)
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    const host = req.get('host') || 'localhost:8000'
    const protocol = req.protocol || 'http'
    const imageUrl = `${protocol}://${host}/uploads/products/${uniqueName}`

    return ApiResponder.success(
      res,
      { url: imageUrl, filename: uniqueName },
      'Tải hình ảnh lên thành công'
    )
  } catch (error: any) {
    next(error)
  }
}

export default {
  uploadImage,
}
