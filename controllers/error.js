exports.get404 = (req, res, next) => {
    res.status(404).render("404", {
        pageTitle: "Page Not Found",
        path: "/404",
    });
};

exports.get500 = (error, req, res, next) => {
    let isLoggedIn;
    if ("session" in req && "isLoggedIn" in req.session) {
        isLoggedIn = req.session.isLoggedIn;
    } else {
        isLoggedIn = false;
    }
    res.status(500).render("500", {
        pageTitle: "Server error",
        path: "/500",
        isAuthenticated: isLoggedIn,
        csrfToken: "",
    });
};
