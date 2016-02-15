var db = require('../../models/DB_InitTest.js');
var testModel = require('../../models/TestModel.js');
var isTesting = false;

module.exports.isTesting = function(){
	return isTesting;
};

module.exports.initTestDB = function(callback){
	isTesting = true;
	db.createMsgInfoTableForTest(function(result){
		if(!result.status){
			callback({statusCode: 500, desc: result.desc});
			return;
		}else{
			callback({statusCode: 200, desc: "create database for testing successed."});
		}
	});
};

module.exports.putPublicMessage = function(msg, callback){
	testModel.savePublicMessage(msg.content, msg.author, msg.messageType, msg.target, msg.postedAt, function(result){
		if(!result.status){
			callback({statusCode: 500, desc: result.desc});
			return;
		}else{
			callback({statusCode: 200, desc: 'save public message successed.'});
			return;
		}
	});
};

module.exports.getPublicMessages = function(callback){
	testModel.getPublicMessages(function(result){
		if(!result.status){
			callback({statusCode: 500, msglist: null, desc: result.desc});
			return;
		}else{
			callback({statusCode: 200, msglist: result.msgs, desc: 'get public message successed.'});
			return;
		}
	});
};

module.exports.finishTest = function(callback){
	isTesting = false;
	db.destoryTable(function(result){
		if(!result.status){
			callback({statusCode: 500, desc: result.desc});
			return;
		}else{
			callback({statusCode: 200, desc: 'destory table successed.'});
			return;
		}
	});
};
