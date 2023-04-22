import multer from "multer";
import fs from "fs";

const folderPath = "./uploads";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const csvUpload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error("Please upload an csv file"));
    }

    cb(undefined, true);
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

export default csvUpload;
