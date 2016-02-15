var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDB.db');
var userModel = require('../models/UserModel');

exports.createMessageInfoTable = function(callback) {
	db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='messageinfo'", function(err, row) {
		if (err) return callback({status: false, desc: err});
		if (row) return callback({status: false, desc: "exists"});
		var sql_cmd = 'CREATE TABLE  "messageinfo" (';
		sql_cmd += '"messageType" TEXT, ';
		sql_cmd += '"author" TEXT, ';
		sql_cmd += '"target" TEXT, ';
		sql_cmd += '"postedAt" TEXT, ';
		sql_cmd += '"content" TEXT, ';
		sql_cmd += '"messageID" INTEGER PRIMARY KEY AUTOINCREMENT )';
		db.run(sql_cmd , function(err) {
			if (err) return callback({status: false, desc: "create failed"});
			console.log("Table 'messageinfo' created");
			callback({status: true, desc: "created"});
		});
	});
};

exports.createUserInfoTable = function(callback) {
	db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='userinfo'", function(err, row) {
		if (err) return callback({status: false, desc: err});
		if (row) return callback({status: false, desc: "exists"});
		var sql_cmd = 'CREATE TABLE "userinfo" (';
		sql_cmd += '"username" TEXT, ';
		sql_cmd += '"password" TEXT, ';
		sql_cmd += '"salt" TEXT, ';
		sql_cmd += '"firstname" TEXT, ';
		sql_cmd += '"lastname" TEXT, ';
		sql_cmd += '"location" TEXT, ';
		sql_cmd += '"coordinate" TEXT, ';
		sql_cmd += '"peopleiknow" TEXT, ';
		sql_cmd += '"createdAt" TEXT, ';
		sql_cmd += '"updatedAt" TEXT, ';
		sql_cmd += '"lastLoginAt" TEXT, ';
		sql_cmd += '"accountStatus" TEXT, ';
		sql_cmd += '"lastStatusCode" TEXT, ';
		sql_cmd += '"lastLogoutAt" TEXT, ';
		sql_cmd += '"privilege" TEXT, ';
		sql_cmd += '"image" BLOB )';
		db.run(sql_cmd, function(err) {
			if (err) return callback({status: false, desc: err});
			userModel.InitOriginAdmin("SSNAdmin", "admin", function(result){
				if (!result.status) return callback({status: false, desc: result.desc});
				console.log("Table 'userinfo' created.");
				callback({status: true, desc: "created"});
			});
		});
	});
};

exports.createStatusCrumbTable = function(callback) {
	db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='statuscrumb'", function(err, row) {
		if (err) return callback({status: false, desc: err});
		if (row) return callback({status: false, desc: "exists"});
		var sql_cmd = 'CREATE TABLE  "statuscrumb" (';
		sql_cmd += '"crumbID" INTEGER PRIMARY KEY AUTOINCREMENT, ';
		sql_cmd += '"username" TEXT, ';
		sql_cmd += '"statuscode" TEXT, ';
		sql_cmd += '"createdAt" TEXT, ';
		sql_cmd += '"location" TEXT )';
		db.run(sql_cmd, function(err) {
			if (err) return callback({status: false, desc: err});
			console.log("Table 'statuscrumb' created.");
			callback({status: true, desc: "created"});
		});
	});
};
