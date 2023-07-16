const path = require("path");
require("dotenv").config();

const csrf = require("csrf-sync");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const multer = require("multer");

const errorController = require("./controllers/error");
const User = require("./models/user");

const { csrfSynchronisedProtection } = csrf.csrfSync({
    getTokenFromRequest: (req) => {
        // If NOT delete/get request, we have a body
        // to retrieve the token from
        if (!/get|delete/i.test(req.method)) {
            return req.body["_csrf"];
        }
        // get/delete request, get csrf from headers
        return req.headers["csrf-token"];
    },
});

const app = express();
const store = new MongoDBStore({
    uri: process.env.URI,
    collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
    session({
        secret: "my secret",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.use(csrfSynchronisedProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken(true);
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.redirect("/500");
    // let isLoggedIn;
    // if ("session" in req && "isLoggedIn" in req.session) {
    //     isLoggedIn = req.session.isLoggedIn;
    // } else {
    //     isLoggedIn = false;
    // }
    // res.status(500).render("500", {
    //     pageTitle: "Error!",
    //     path: "/500",
    //     isAuthenticated: isLoggedIn,
    // });
});

mongoose
    .connect(process.env.URI)
    .then((result) => {
        app.listen(3000, console.log("Connected!"));
    })
    .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
