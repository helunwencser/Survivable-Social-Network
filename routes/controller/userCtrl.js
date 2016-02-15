var path = require("path");
var validate = require("validate.js");
var userModel = require('../../models/UserModel');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var statuslistModel = require('../../models/StatusModel');
var chatModel = require('../../models/ChatModel');
var restrictedDomains = require('fs').readFileSync(path.join(__dirname, "../../restricted.txt")).toString().split(" ");
var testCtrl = require('./testCtrl.js');

function validateTime(time) {
	var isValidDateMsg = Date.parse(time);
	if (isNaN(isValidDateMsg)) {
		return 'Error: date and time must be in ISO format!';
	}
	return '';
}

function validateRequest(username, password) {
	regEx = /^[\w\-\.]+$/;
	var errorMsg = [];

	var isRestrictedMsg = validate({ unames: username }, {
		unames: { exclusion: restrictedDomains }
	});

	if (isRestrictedMsg) {
		errorMsg.push('Error: Username ' + isRestrictedMsg.unames[0]);
	}
	if (!regEx.test(username)) {
		errorMsg.push('Error: Username must contain only letters, numbers and underscores!');
	}
	if (username.length < 4 || username.length > 12) {
		errorMsg.push('Error: Username must be of minimum length 4, and maximum length 12!');
	}
	if (password.length < 5 || password.length > 30) {
		errorMsg.push('Error: Password must be of minimum length 5, and maximum length 30!');
	}
	return errorMsg;
}

function removePassword(element) {
	delete element.password;
	delete element.salt;
}

passport.serializeUser(function(user, done) {
    removePassword(user);
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Login function
passport.use('local-login', new LocalStrategy(function(username, password, done) {
    var errorMsg = validateRequest(username, password);
    if (errorMsg.length > 0) {
        return done(null, false, { statusCode: 400, desc: errorMsg });
    }
    userModel.selectOneUser(username, function(result) {
        if (!result.status) {
            return done(null, false, { statusCode: 404, desc: 'user not found.' });
        }
        if (result.user.password !== userModel.hashPassword(password, result.user.salt)) {
            return done(null, false, { statusCode: 401, desc: 'wrong password' });
        }
		if (result.user.accountStatus !== "Active") {
			return done(null, false, { statusCode: 401, desc: 'inactive account' });
		}
        return done(null, result.user, { statusCode: 200 });
    });
}));

// Signup function
passport.use('local-signup', new LocalStrategy(function(username, password, done) {
	var errorMsg = validateRequest(username, password);
	if (errorMsg.length > 0){
		return done(null, false, {statusCode: 400, desc: errorMsg});
	}
	userModel.selectOneUser(username, function(result) {
		if (result.status) {
			return done(null, false, { statusCode: 401, desc: 'user already exists' });
		}
		userModel.addNewUser(username, password, function(result) {
			if (!result.status) {
                return done(null, false, { statusCode: 400, desc: result.desc });
			}
            userModel.selectOneUser(username, function(result) {
                if (!result.status) {
                    return done(null, false, { statusCode: 404, desc: result.desc });
                }
                return done(null, result.user, { statusCode: 201 });
            });
		});
	});
}));

module.exports.update = function(username, updateInfo, isAdmin, callback){
	var errorMsg = false;
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	if (updateInfo.lastLoginAt) {
        errorMsg = validateTime(updateInfo.lastLoginAt);
        if (errorMsg){
            return callback({statusCode: 400, desc: errorMsg});
        } 
	}
	if (updateInfo.createdAt) {
        errorMsg = validateTime(updateInfo.createdAt);
        if (errorMsg){
            return callback({statusCode: 400, desc: errorMsg});
        } 
    }
    userModel.selectOneUser(username, function(result){
		var force_logout = false;
        if (!result.status){
            callback({statusCode: 404, desc: 'user not exists!'});
            return;
        }
        if (updateInfo.username) { // updateInfo includes username
			if (updateInfo.username === result.user.username) delete updateInfo.username;
			else if (!isAdmin) return callback({statusCode: 403, desc: "only Admin can change username"});
			else force_logout = true;
		}
        if (updateInfo.password) {
			force_logout = true;
		}
		if (updateInfo.privilege) {
			if (updateInfo.privilege === result.user.privilege) delete updateInfo.privilege;
			else if (!isAdmin) return callback({statusCode: 403, desc: "only Admin can change privilege"});
			else force_logout = true;
		}
		if (updateInfo.accountStatus) {
			if (updateInfo.accountStatus === result.user.accountStatus) delete updateInfo.accountStatus;
			else if (!isAdmin) return callback({statusCode: 403, desc: "only Admin can change accountStatus"});
			else force_logout = true;
		}
        if (updateInfo.username) { // updateInfo includes username
			var newUsername = updateInfo.username;
			userModel.getAdmins(function(result){
				if (result.users.length === 1 && result.users.indexOf(username) >= 0 && 
						(updateInfo.accountStatus === 'Inactive' || (updateInfo.privilege && updateInfo.privilege !== 'Admin'))) {
					return callback({statusCode: 401, desc: "There should be at least 1 admin!"});
				}
				userModel.selectOneUser(newUsername, function(result){
					if (result.status) { //newUsername exists, cannot update
						return callback({statusCode: 400, desc: "newUsername exists"});
					}
					userModel.updateUser(username, updateInfo, function(result){
						if (!result.status){
							return callback({statusCode: 500, desc: result.desc});
						}
						statuslistModel.updateUsername(username, newUsername, function(result){
							if (!result.status){
								return callback({statusCode: 500, desc: result.desc});
							}
							chatModel.updateAuthor(username, newUsername, function(result){
								if (!result.status){
									return callback({statusCode: 500, desc: result.desc});
								}
								chatModel.updateTarget(username, newUsername, function(result){
									if (!result.status){
										return callback({statusCode: 500, desc: result.desc});
									}
									return callback({statusCode: 200, desc: "update user success", force_logout: force_logout});
								});
							});
						});
					});
				});
			});
        }
		else {
			userModel.getAdmins(function(result){
				if (result.users.length === 1 && result.users.indexOf(username) >= 0 && 
						(updateInfo.accountStatus === 'Inactive' || (updateInfo.privilege && updateInfo.privilege !== 'Admin'))) {
					return callback({statusCode: 401, desc: "There should be at least 1 admin!"});
				}
				userModel.updateUser(username, updateInfo, function(result){
					if (!result.status){
						return callback({statusCode: 500, desc: "update user failed"});
					}
					return callback({statusCode: 200, desc: "update user success!", force_logout: force_logout});
				});
			});
        }
    });
};

module.exports.getUsers = function(callback){
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.allUser(function(result){
		if (!result.status) {
			return callback({statusCode: 400, users: null});
		}
		// should not send password out
		result.users.forEach(removePassword);
		callback({statusCode: 200, users: result.users});
	});
};

module.exports.getUser = function(username, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.selectOneUser(username, function(result){
		if(!result.status)
			callback({statusCode: 404, user: null});
		else {
			// should not send password out
			removePassword(result.user);
			callback({statusCode: 200, user: result.user});
		}
	});
};

function validateStatusType(statusType){
	if(!statusType || statusType.length === 0)
		return 'ERROR';
	if(statusType.toUpperCase() == "OK")
		return "OK";
	if(statusType.toUpperCase() == "HELP")
		return "HELP";
	if(statusType.toUpperCase() == "EMERGENCY")
		return "EMERGENCY";
	return 'ERROR';
}

module.exports.updateStatus = function(username, updateStatusRequest, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.selectOneUser(username, function(result){
		if(!result.status){
			callback({statusCode: 404, user: null, desc: "user not exists"});
			return;
		}
		validateTimeMsg = validateTime(updateStatusRequest.updatedAt);
		if(validateTimeMsg){
			callback({statusCode: 400, user: username, desc: validateTimeMsg});
			return;
		}
		validateStatusTypeMsg = validateStatusType(updateStatusRequest.statusType);
		if(validateStatusTypeMsg == 'ERROR'){
			callback({statusCode: 400, user: username, desc: 'Invalide status code'});
			return;
		}
		delete updateStatusRequest.statusType;
		updateStatusRequest.lastStatusCode = validateStatusTypeMsg;
		statuslistModel.saveStatus(username, validateStatusTypeMsg, updateStatusRequest.updatedAt, updateStatusRequest.location, function(result){
			if (!result.status){
				callback({statusCode: 500, user: username, desc: result.desc});
				return;
			}
			else {
				userModel.updateUser(username, updateStatusRequest, function(result){
					if (!result.status){
						callback({statusCode: 500, user: username, desc: result.desc});
						return;
					}
					callback({statusCode: 200, user: username, desc: 'add status successfully.'});
				});
			}
		});
	});
};

module.exports.getUserStatusHistory = function(username, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.selectOneUser(username, function(result){
		if(!result.status){
			callback({statusCode: 400, desc: "user not exists!"});
			return;
		}
		statuslistModel.searchOneUserStatusHistory(username, function(result){
			if(!result.status){
				callback({statusCode: 500, statusList: null, desc: result.desc});
				return;
			}
			callback({statusCode: 200, statusList: result.OneUserStatusHistory, desc: "get user status history successfully"});
			return;
		});
	});
};

module.exports.updateLastLogoutTime = function(username, lastLogoutTime, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.selectOneUser(username, function(result){
		if(!result.status){
			callback({statusCode: 400, desc: "user not exists"});
			return;
		}
		validateTimeMsg = validateTime(lastLogoutTime);
		if(validateTimeMsg){
			callback({statusCode: 400, desc: validateTimeMsg});
			return;
		}
        updateInfo = {lastLogoutAt: lastLogoutTime};
		userModel.updateUser(username, updateInfo, function(result){
			if(!result.status){
				callback({statusCode: 500, desc: result.desc});
				return;
			}
			else{
				callback({statusCode: 200, desc: "update last logout time successfully"});
				return;
			}
		});
	});
};

module.exports.getUsersByUserNameMatch = function(username, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	username = username.toUpperCase();
	userModel.allUser(function(result){
		if(!result.status){
			callback({statusCode: 500, users: null, desc: result.desc});
			return;
		}else{
			var onlineUsers = [];
			var offlineUsers = [];
			var length = result.users.length;
			for(var i = 0; i < length; i++){
				var user = result.users[i];
				if(user.username.toUpperCase().indexOf(username) > -1){
					//on line user
					if((user.lastLoginAt && !user.lastLogoutAt) || user.lastLoginAt > user.lastLogoutAt){
						onlineUsers.push(user);
					}else{//off line user
						offlineUsers.push(user);
					}
				}
			}
			onlineUsers.sort(function(a, b){
				if(a.username < b.username)
					return -1;
				else if(a.username == b.username)
					return 0;
				else
					return 1;
			});

			offlineUsers.sort(function(a, b){
				if(a.username < b.username)
					return -1;
				else if(a.username == b.username)
					return 0;
				else
					return 1;
			});
			callback({statusCode: 200, users: onlineUsers.concat(offlineUsers), desc: 'get matched users successfully.'});
			return;
		}
	});
};

module.exports.getusersByStatusNameMatch = function(statusName, callback){
	if(testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var statusMsg = validateStatusType(statusName);
	if(statusMsg == 'ERROR'){
		callback({statusCode: 400, users: null, desc: 'invalide status name'});
		return;
	}else{
		userModel.selectUsersByStatus(statusMsg, function(result){
			if(!result.status){
				callback({statusCode: 500, users: null, desc: 'get users by status name failed.'});
				return;
			}else{
				var onlineUsers = [];
				var offlineUsers = [];
				var length = result.users.length;
				for(var i = 0; i < length; i++){
					var user = result.users[i];
					//on line user
					if((user.lastLoginAt && !user.lastLogoutAt) || user.lastLoginAt > user.lastLogoutAt){
						onlineUsers.push(user);
					}else{//off line user
						offlineUsers.push(user);
					}
				}
				onlineUsers.sort(function(a, b){
					if(a.username < b.username)
						return -1;
					else if(a.username == b.username)
						return 0;
					else
						return 1;
				});

				offlineUsers.sort(function(a, b){
					if(a.username < b.username)
						return -1;
					else if(a.username == b.username)
						return 0;
					else
						return 1;
				});
				callback({statusCode: 200, users: onlineUsers.concat(offlineUsers), desc: 'get users by status success'});
				return;
			}
		});
	}
};

module.exports.updateProfilePicture = function(username, imageFromUser, callback){
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.selectOneUser(username, function(result){
		if(!result.status){
			callback({statusCode: 400, desc: "user not exists"});
			return;
		}
        updateInfo = {image: imageFromUser};
		userModel.updateUser(username, updateInfo, function(result){
			if (!result.status){
				callback({statusCode: 500, desc: result.desc});
				return;
			}
			else {
				callback({statusCode: 200, desc: "update profile picture time successfully"});
				return;
			}
		});
	});
};

module.exports.getProfilePicture = function(username, callback){
    if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.getProfilePicture(username, function(result){
		if (!result.status)
			callback({});
		else{
			callback({image: result.image});
		}
	});
};

module.exports.deleteUser = function(username, callback){
    if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userModel.deleteUser(username, function(result){
		if (!result.status) return callback({statusCode: 500, desc: result.desc});
		callback({statusCode: 200, desc: result.desc});
	});
};
