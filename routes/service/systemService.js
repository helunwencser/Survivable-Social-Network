var path = require('path');
var monitorService = require('./monitorService');

module.exports.handleRootContext = function(req, res) {

    if (req.user) {
        // already logged in
        res.redirect("/home");
        return;
    }
    var args = {
        title: "Welcome"
    };
    var errmsg = req.flash('error');
    if (errmsg.length > 0) args.error = errmsg.join('<br>');
    errmsg = req.flash('info');
    if (errmsg.length > 0) args.info = errmsg.join('<br>');
    res.render("index", args);
};

module.exports.handleHomeContext = function(req, res) {
    if (!req.user) {
        // access denied
        req.flash('error', 'Please log in first!');
        res.redirect("/");
        return;
    }
    res.render("home", {
        title: "Home",
        user: req.user
    });
};

module.exports.handlePictureUpload = function(req, res) {

    if (!req.user) {
        // access denied
        req.flash('error', 'Please log in first!');
        res.redirect("/");
        return;
    }
    res.render("uploadPicture", {
        title: "Upload Identity Reference Picture",
        username: req.user.username
    });
};

module.exports.handleViewContext = function(req, res) {
    if (!req.user) return res.status(404).send("Please log in first.");
	res.render(path.join('partial', req.params.pageid), {
		user: req.user
	});
};

module.exports.isUnderTesting = function(req, res, next) {
	if (monitorService.getUserWhoStartedTheTest()) {
        res.render('maintenance');
		return;
    }
	next();
};

module.exports.isUserLoggedIn = function(req, res, next) {
    if (!req.user) {
        res.status(403);
        res.send({
            desc: 'No user is logged in!'
        });
		return;
    }
	if (!monitorService.getUserWhoStartedTheTest()) {
        next();
	}
	else if (req.user.username !== monitorService.getUserWhoStartedTheTest()) {
        res.render('maintenance');
    }
	else {
        next();
    }
};
