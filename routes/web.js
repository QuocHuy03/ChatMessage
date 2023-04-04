const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");
const Chats = require("../models/chat");
const moment = require("moment");
const Users = require("../models/user");
const UserServer = require("../controllers/UserController");
// check login

module.exports = function (io) {
  const users = new UserServer();
  function checkLoggedIn(req, res, next) {
    if (!req.session.loggedin) {
      return res.redirect("/login");
    }
    next();
  }

  router.get("/", checkLoggedIn, async (req, res, next) => {
    let huyit = [];
    await Chats.find().then((items) => {
      huyit = items;
    });
    res.render("index", {
      huyit,
    });
  });

  router.get("/login", async (req, res, next) => {
    res.render("auth/login");
  });

  router.post("/postLoginUser", authController.loginUser);

  router.get("/register", async (req, res, next) => {
    res.render("auth/register");
  });

  router.post("/postCreateUser", authController.createUser);
  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/login");
      }
    });
  });

  // # Socket.io

  io.on("connection", (socket) => {
    socket.emit("SERVER_SEND_SOCKETID", socket.id);
    // console.log("a user connected 123");

    socket.on("CLIENT_SEND_ALL_MESSAGE", async (data) => {
      const newChat = new Chats({
        username: data.username,
        content: data.content,
        avatar: data.avatar,
      });

      await newChat.save().then((result) => {
        io.emit("SERVER_RETURN_ALL_MESSAGE", {
          content: result.content,
          username: result.username,
          avatar: result.avatar,
          createdAt: moment(data.createAt).format("LLL"),
        });
      });
    });

    socket.on("USER_CONNECT", async (data) => {
      users.addUser(socket.id, data.username, data.avatar);
      const listUsers = [];
      for (let i = 0; i < users.getListUsers().length; i++) {
        const huyit = users.getListUsers()[i];
        Users.findOne({ username: huyit.username })
          .then((userFromDB) => {
            console.log("User Online : ", userFromDB);
            listUsers.push(userFromDB);
            if (i === users.getListUsers().length - 1) {
              // duyệt qua các phần tử trong danh sách
              io.emit("SERVER_SEND_ALL_LIST_USER", listUsers);
            }
          })
          .catch((err) => {
            console.error(err);
          });
      }
    });

    socket.on("disconnect", () => {
      let user = users.removeUser(socket.id);
      if (user) {
        console.log(`User disconnected: ${socket.id}`);
        const listUsers = [];
        for (let i = 0; i < users.getListUsers().length; i++) {
          const huyit = users.getListUsers()[i];
          Users.findOne({ username: huyit.username })
            .then((userFromDB) => {
              console.log("User Online : ", userFromDB);
              listUsers.push(userFromDB);
              if (i === users.getListUsers().length - 1) {
                // duyệt qua các phần tử trong danh sách
                io.emit("SERVER_SEND_ALL_LIST_USER", listUsers);
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }
      }
    });
  });
  return router;
};
