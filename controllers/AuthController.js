const User = require("../models/user");
const bcrypt = require("bcrypt");
const multer = require("multer");
const random = require("random-token");
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads"); // Thư mục lưu trữ tệp tải lên
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // Giữ nguyên tên tệp tải lên
    },
  }),
});
// register
exports.createUser = [
  upload.single("avatar"),
  (req, res, next) => {
    const { username, password, email } = req.body;
    if (username == "" || password == "" || email == "") {
      res.status(200).json({ status: false, message: "Không Được Để Trống" });
    } else {
      // Mã hóa mật khẩu
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Có lỗi xảy ra trong quá trình mã hóa mật khẩu",
          });
        }
        var token = random(24);
        const users = new User({
          username,
          password: hash,
          email,
          avatar: req.file.path,
          token: token,
        });
        console.log("Register : ", users);
        users
          .save()
          .then((result) => {
            res.status(201).json({
              status: true,
              message: "Đăng Ký Thành Công",
            });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      });
    }
  },
];

// login

exports.loginUser = (req, res, next) => {
  const { username, password } = req.body;
  if (username == "" || password == "") {
    res.status(200).json({ status: false, message: "Không Được Để Trống" });
  } else {
    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return res.status(200).json({
            status: false,
            message: "Tài khoản không tồn tại",
          });
        }
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            return res
              .status(401)
              .json({ status: false, message: "Đăng nhập thất bại" });
          }
          if (result) {
            req.session.loggedin = true;
            req.session.username = username;
            req.session.avatar = user.avatar;
            req.session.userID = user._id;
            res.locals.avatar = user.avatar;
            res.locals.userID = user._id;
            res.locals.username = username;
            // console.log(res.locals.userID);
            return res.status(200).json({
              status: true,
              message: "Đăng nhập thành công",
            });
          } else {
            return res
              .status(200)
              .json({ status: false, message: "Đăng nhập thất bại" });
          }
        });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};
