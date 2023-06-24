const path = require("path");
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    User.findById("6495c158d44badf695a17b22")
        .then((user) => {
            req.user = new User(user.name, user.email, user.cart, user._id);
            next();
        })
        .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect(process.env.URI)
    .then((result) => {
        // console.log(result);
        app.listen(3000);
        console.log("Connected!");
    })
    .catch((err) => {
        console.log(err);
    });
