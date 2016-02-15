/* UserModel.js */
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDB.db');
var crypto = require('crypto');

//this function is to encrypt the password using sha1
function hashPassword(passwords, salts) {
    var hash = crypto.createHash('sha1');
    hash.update(passwords);
    hash.update(salts);
    return hash.digest('hex');
}

exports.hashPassword = hashPassword;

//this function is to select one user sent from the controller in database and return its info to the controller
exports.selectOneUser = function(username, callback) {
    db.get("SELECT * FROM 'userinfo' WHERE username='" + username + "'", function(err, row) {
        if (err || !row) {
            return callback({status: false, desc: "selectOneUser failed"});
        }
        return callback({status: true, user: row, desc: "selectOneUser succeed"});
    });
};

//this function is to add a new user sent from the controller to the database
exports.addNewUser = function(usernames, passwords, callback) {
    var salts = crypto.randomBytes(26).toString('hex');
    var encryptpassword = hashPassword(passwords, salts);
    var accountStatus = "Active";
    var privilege = "Citizen";
    var sql_cmd = "INSERT INTO 'userinfo' (username, password, salt, accountStatus, privilege) VALUES ";
    sql_cmd += "('" + usernames + "', '" + encryptpassword + "', '" + salts + "', '" + accountStatus + "', '" + privilege + "')";
    db.run(sql_cmd, function (err) {
        if (err) return callback({status: false, desc: "addNewUser failed"});
		callback({status: true, desc: "addNewUser succeed"});
    });
};

exports.InitOriginAdmin = function(usernames, passwords, callback) {
    var salts = crypto.randomBytes(26).toString('hex');
    var encryptpassword = hashPassword(passwords, salts);
    var accountStatus = "Active";
    var privilege = "Admin";
    var sql_cmd = "INSERT INTO 'userinfo' (username, password, salt, accountStatus, privilege) VALUES ";
    sql_cmd += "('" + usernames + "', '" + encryptpassword + "', '" + salts + "', '" + accountStatus + "', '" + privilege + "')";
    db.run(sql_cmd, function (err) {
        if (err) return callback({status: false, desc: usernames + " Created failed"});
		callback({status: true, desc: usernames + " Created succeed"});
    });
};

//in order to use password to validate,I choose to return all the info
exports.allUser = function (callback) {
	db.all('SELECT * FROM userinfo ', function (err, rows) {
		if (err) {
			return callback({status: false, desc: err});
		}
		callback({status: true, users: rows, desc: "allUser succeed"});
	});
};

exports.selectUsersByStatus = function(statusName, callback){
	db.all("select * from userinfo where lastStatusCode='" + statusName + "'", function(err, rows){
		if(err){
			return callback({status: false, desc: err});
		}
		return callback({status: true, users: rows, desc: 'get users by status name success'});
	});
};

//this is to update the user's information in the databases

    //exports.updateUser = function(username, info, callback) {
    //    db.get("SELECT username FROM userinfo WHERE username='" + username + "'", function(err, row) {
    //        if (err) {
		//		return callback({ status: false, desc: username + " pinpoint failed, " + err });
    //        }
    //        if (!row) {
    //            return callback({ status: false, desc: username + " has No info in db" });
    //        }
    //        var set_stmts = [];
    //        if ('password' in info) {
    //            info['salt'] = crypto.randomBytes(26).toString('hex');
    //            info['password'] = hashPassword(info['password'], info['salt']);
    //        }
    //        for (key in info) {
    //            set_stmts.push("'" + key + "' = '" + info[key] + "'");
    //        }
    //        if (set_stmts.length === 0) {
    //            return callback({ status: true, desc: "nothing to update" });
    //        }
    //        var sql_cmd = "UPDATE userinfo SET " + set_stmts.join(", ");
    //        sql_cmd += " WHERE username = '" + username + "'";
    //        db.run(sql_cmd, function(err) {
    //            if (err) {
    //                return callback({ status: false, desc: "update User " + username + " failed, " + err});
    //            }
    //            return callback({ status: true, desc: "update User " + username + " succeed" });
    //        });
    //    });
    //};
    //
    //exports.getProfilePicture = function(username, callback) {
    //    db.get("SELECT image FROM 'userinfo' WHERE username='" + username + "'", function(err, row) {
    //        if (err) return callback({status: false, desc: err});
    //        if (!row) return callback({status: false, desc: "user does not exist"});
    //        if (!row.image) return callback({status: false, desc: "user has no image"});
    //        return callback({status: true, image: row.image, desc: "selectOneUser failed"});
    //    });
    //}

   //// this function will delete the user in database
   // exports.deleteUser = function (usernames, callback) {
   //
   //     db.get("SELECT username FROM userinfo WHERE username='" + usernames + "'", function (err, row) {
   //         if (err !== null) {
   //             callback({status: false, desc: usernames + "pinpoint failed"});
   //         } else {
   //             if (row === undefined) {
   //
   //                 callback({status: false, desc: usernames + " has No info in db"});
   //             } else {
   //
   //
   //                 db.run("DELETE FROM userinfo WHERE username='" + usernames + "'",
   //                     function (err) {
   //                         if (err !== null) {
   //
   //                             callback({status: false, desc: usernames + " deleted  failed"});
   //                         } else {
   //                             callback({status: true, desc: usernames + " deleted succeed"});
   //                         }
   //                     });
   //
   //             }
   //
   //         }
   //     });
   // }
exports.updateUser = function(username, info, callback) {
	db.get("SELECT username FROM userinfo WHERE username='" + username + "'", function(err, row) {
		if (err) {
			return callback({ status: false, desc: username + " pinpoint failed, " + err });
		}
		if (!row) {
			return callback({ status: false, desc: username + " has No info in db" });
		}
		var set_stmts = [];
		if ('password' in info) {
			info.salt = crypto.randomBytes(26).toString('hex');
			console.log('password before hash: ' + info.password);
			info.password = hashPassword(info.password, info.salt);
			console.log('password after hash:' + info.password);
		}
		for (var key in info) {
			set_stmts.push("'" + key + "' = '" + info[key] + "'");
		}
		if (set_stmts.length === 0) {
			return callback({ status: true, desc: "nothing to update" });
		}
		var sql_cmd = "UPDATE userinfo SET " + set_stmts.join(", ");
		sql_cmd += " WHERE username = '" + username + "'";
		db.run(sql_cmd, function(err) {
			if (err) {
				return callback({ status: false, desc: "update User " + username + " failed, " + err});
			}
			return callback({ status: true, desc: "update User " + username + " succeed" });
		});
	});
};

exports.getProfilePicture = function(username, callback) {
	db.get("SELECT image FROM 'userinfo' WHERE username='" + username + "'", function(err, row) {
		if (err) return callback({status: false, desc: err});
		if (!row) return callback({status: false, desc: "user does not exist"});
		if (!row.image) return callback({status: false, desc: "user has no image"});
		return callback({status: true, image: row.image, desc: "selectOneUser failed"});
	});
};

exports.deleteUser = function(usernames, callback) {
	db.run("DELETE FROM userinfo WHERE username='" + usernames + "'", function(err) {
		if (err) return callback({status: false, desc: err});
		return callback({status: true, desc: usernames + " deleted succeed"});
	});
};

exports.deleteAllUsers = function(callback) {
	db.run("DELETE FROM userinfo WHERE username<>'SSNAdmin'", function(err) {
		if (err) return callback({status: false, desc: err});
		return callback({status: true, desc: "all users deleted"});
	});
};

exports.getAdmins = function (callback) {
	db.all("SELECT username FROM userinfo WHERE privilege='Admin'", function (err, rows) {
		if (err) {
			return callback({status: false, desc: err});
		}
		rows.forEach(function(item, idx, arr){arr[idx] = item.username;});
		callback({status: true, users: rows, desc: "getAdmins succeed"});
	});
};
