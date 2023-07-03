const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const User = require("../models/user");

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
        user: "jordon.durgan@ethereal.email",
        pass: "gECkx16tV5J1AjTJrj",
    },
});

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        isAuthenticated: false,
        errorMessage: message,
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash("error", "Invalid email or password");
                return res.redirect("/login");
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect("/");
                        });
                    }
                    req.flash("error", "Invalid email or password");
                    res.redirect("/login");
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect("/login");
                });
        })
        .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then((userDoc) => {
            if (userDoc) {
                req.flash("error", "Email alredy exist");
                return res.redirect("/signup");
            }
            return bcrypt
                .hash(password, 12)
                .then((hashedPassword) => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] },
                    });

                    return user.save();
                })
                .then((result) => {
                    transporter.sendMail(
                        {
                            from: "shop@node-test.com",
                            to: email,
                            subject: "Signup complete",
                            text: "Signup succeded",
                            html: "<b>Hey there! </b><br> This is our first message sent with Nodemailer<br />",
                        },
                        (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            // console.log(
                            //     "Message sent: %s",
                            //     info.messageId
                            // );
                        }
                    );
                    res.redirect("/login");
                });
        })
        .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect("/");
    });
};
