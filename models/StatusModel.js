var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDB.db');


exports.saveStatus = function(usernames,statuscodes,createdAts,locations, callback){

    db.run("INSERT INTO 'statuscrumb' (username,statuscode,createdAt,location) " +
        "VALUES('" + usernames + "','" + statuscodes + "','" + createdAts + "','" +
         locations + "')",function(err){
        if(err!== null){

            callback({status:false, desc: err});
        }else{
            callback({status:true, desc:"saveStatus succeed"});
        }
    });
};


exports.searchOneUserStatusHistory = function (usernames, callback){
    db.all("SELECT * FROM statuscrumb WHERE username='" + usernames + "'ORDER BY statuscrumb.createdAt DESC",function(err,row) {
            if (err !== null) {

                callback({status:false,OneUserStatusHistory:null, desc: err});
            }else{
                //console.log("searchOneUserStatusHistory succeed");
                callback({status:true,OneUserStatusHistory:row,desc:"searchOneUserStatusHistory succeed"});
            }
        }
    );
};

exports.updateUsername = function(username, newUserName, callback){
    var sql = "UPDATE statuscrumb SET username = '" + newUserName + "' WHERE username = '" + username + "'";
    db.run(sql, function(err){
        if(err){
            callback({status: false, desc: err});
            return;
        }else{
            callback({status: true, desc: "upate username succeed"});
        }
    });
};

exports.deleteAllStatus = function(callback) {
	db.run("DELETE FROM statuscrumb", function(err) {
		if (err) return callback({status: false, desc: err});
		return callback({status: true, desc: "all status deleted"});
	});
};
