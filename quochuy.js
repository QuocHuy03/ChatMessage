const express = require("express");
const app = express();
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const redis = require("redis");
var bodyParser = require("body-parser");
const webRoutes = require("./routes/web");
const http = require("http");
require("dotenv").config();
const port = process.env.PORT || 2003;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { default: mongoose } = require("mongoose");
const path = require("path");

const redisClient = redis.createClient(process.env.REDIS_URL);
// # Req Form
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// # Session
redisClient.on('error', (err) => {
  console.log('Error: ' + err);
});

app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(function (req, res, next) {
  res.locals.loggedin = req.session.loggedin;
  res.locals.username = req.session.username;
  res.locals.avatar = req.session.avatar;
  res.locals.userID = req.session.userID;
  next();
});

// # Routes
app.use("/", webRoutes(io));

// # views

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// # Server

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    server.listen(port, () => {
      console.log(`ứng dụng đang chạy với port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });