var passport = require('passport');
var userCtrl = require('../controller/userCtrl');
var fs = require("fs");
var socketCtrl = require('../socketio');

var tmpFdr = 'temp'; 
fs.access(tmpFdr, fs.R_OK | fs.W_OK, function(err){
	if (!err) return; // temp folder exists
	fs.mkdir(tmpFdr, 0775, function(err){
		if (!err) return; // temp folder created
		console.error('FATAL: ' + err);
	});
});

function isAuthorized(req, res) {
    if (req.user.privilege !== 'Admin' && req.params.username !== req.user.username) {
        // access denied
        res.status(403);
        res.send({
            desc: 'You are not authorized for this action!'
        });
        return false;
    }
    return true;
}

module.exports.signup = function(req, res, next) {

    if (!req.body.password || !req.body.createdAt) {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "password" and "createdAt" in request body JSON.'
        });
        return;
    }

    /* Authenticate through passport */
    req.body.username = req.params.username;
    passport.authenticate('local-signup', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(info.statusCode);
            delete info.statusCode;
            return res.send(info);
        }
        var updateInfo = {
            lastLoginAt: req.body.lastLoginAt,
            createdAt: req.body.createdAt
        };
        userCtrl.update(req.params.username, updateInfo, false, function(result) {
            if (result.statusCode > 400) {
                res.status(result.statusCode);
                delete result.statusCode;
                return res.send(result);
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                res.status(info.statusCode);
                return res.send({});
            });
        });
    })(req, res, next);
};


module.exports.login = function(req, res, next) {

    // if username not exist or password not exist, stop
    if (!req.body.password || !req.body.lastLoginAt) {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "password" and "lastLoginAt" in request JSON body.'
        });
        return;
    }

    /* Authenticate through passport */
    req.body.username = req.params.username;
    passport.authenticate('local-login', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(info.statusCode);
            delete info.statusCode;
            return res.send(info);
        }
        var updateInfo = {
            lastLoginAt: req.body.lastLoginAt
        };
        userCtrl.update(req.params.username, updateInfo, false, function(result) {
            if (result.statusCode > 400) {
                res.status(result.statusCode);
                delete result.statusCode;
                return res.send(result);
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                //res.status(info.statusCode);
                return res.send({});
            });
        });
    })(req, res, next);
};


module.exports.logout = function(req, res) {

    if (!req.user) {
        res.redirect('/');
        return;
    }

    if (!req.body.logoutTime) {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "logoutTime" in request body JSON.'
        });
        return;
    }

    userCtrl.updateLastLogoutTime(req.user.username, req.body.logoutTime, function(result) {
        req.logout();
        if (result.statusCode > 400) {
            res.status(result.statusCode);
            delete result.statusCode;
            return res.send(result);
        }
        req.flash('info', 'Successfully logged out.');
        res.redirect('/');
    });
};


module.exports.getUsers = function(req, res) {

    userCtrl.getUsers(function(result) {
        res.status(result.statusCode);
        if (result.users) {
			if (req.user.privilege !== 'Admin') {
				result.users = result.users.filter(function(item, idx, arr){
					return item.accountStatus === 'Active';
				});
			}
            return res.send(result.users);
        }
		delete result.statusCode;
		res.send(result);
    });
};

module.exports.getUser = function(req, res) {

    userCtrl.getUser(req.params.username, function(result) {
        res.status(result.statusCode);
        if (result.statusCode == 200) {
            res.send(result.user);
        } else {
            delete result.statusCode;
            res.send(result);
        }
    });
};

module.exports.updateUser = function(req, res) {
    if (!isAuthorized(req, res)) {
        return;
    }
	var isAdmin = req.user.privilege? req.user.privilege === "Admin": false;
    userCtrl.update(req.params.username, req.body, isAdmin, function(result) {
        res.status(result.statusCode);
        if (result.statusCode < 400) {
            res.send(result.user);
			if (result.force_logout) {
				socketCtrl.logoutUser(req.params.username);
			}
        } else {
            delete result.statusCode;
            res.send(result);
        }
    });
};

module.exports.shareStatus = function(req, res) {

    if (!req.body.updatedAt || !req.body.statusType) {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "updatedAt" and "statusType" in request body JSON.'
        });
        return;
    }

    if (!isAuthorized(req, res)) {
        return;
    }

    /* Preparing request for controller */
    var updateStatusRequest = {
        updatedAt: req.body.updatedAt,
        statusType: req.body.statusType,
    };
	if (req.body.location) updateStatusRequest.location = req.body.location;

    userCtrl.updateStatus(req.params.username, updateStatusRequest, function(result) {
        res.status(result.statusCode);
        if (result.statusCode == 201) {
            res.send(result.user);
        } else {
            delete result.statusCode;
            res.send(result);
        }
    });
};

module.exports.getStatusHistory = function(req, res) {
    if (!isAuthorized(req, res)) {
        return;
    }
    userCtrl.getUserStatusHistory(req.params.username, function(result) {
        res.status(result.statusCode);
        if (result.statusCode == 200) {
            res.send(result.statusList);
        } else {
            delete result.statusCode;
            res.send(result);
        }
    });
};

module.exports.postProfilePicture = function(req, res) {
    if (!isAuthorized(req, res)) {
        return;
    }
    userCtrl.updateProfilePicture(req.params.username, req.body.image, function(result) {
        res.status(result.statusCode);
        if (result.statusCode == 200 || result.statusCode == 201) {
            res.send(result.user);
        } else {
            delete result.statusCode;
            res.send(result);
        }
    });
};

module.exports.getProfilePicture = function(req, res) {
    userCtrl.getProfilePicture(req.params.username, function(result) {
		var file = 'public/default-user.png';
        if (result.image) {
			file = tmpFdr + '/' + req.params.username + '.png';
			base64_decode(file, result.image);
        }

		fs.stat(file, function(err, stat) {
			img = fs.readFileSync(file);
			res.contentType = 'image/png';
			res.contentLength = stat.size;
			res.end(img, 'binary');
		});
    });
};

// Just for system testing, not an public API
module.exports.deleteUser = function(req, res) {
    userCtrl.deleteUser(req.params.username, function(result) {
		res.status(result.statusCode);
		delete result.statusCode;
		return res.send(result);
	});
};

function base64_decode(fileName, dataUrl) {
    var dataString = dataUrl.split(",")[1];
    var buffer = new Buffer(dataString, 'base64');
    fs.writeFileSync(fileName, buffer, "binary");
}
