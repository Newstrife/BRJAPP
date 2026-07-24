const path = require('path');
const multer = require('multer');
const { fail } = require('../utils/response');

const MAX_SIZE = 10 * 1024 * 1024;

// 单文件上传：限制大小（10MB）和扩展名，错误统一走 {code,message} 返回
exports.uploadSingle = (field, dest, allowedExts) => {
  const upload = multer({
    dest,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();

      if (!allowedExts.includes(ext)) {
        return cb(new Error(`仅支持 ${allowedExts.join(' / ')} 格式的文件`));
      }

      cb(null, true);
    }
  }).single(field);

  return (req, res, next) => {
    upload(req, res, err => {
      if (err) return fail(res, err.message);
      next();
    });
  };
};
