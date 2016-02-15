var chatModel = require('../../models/ChatModel');
var userlistModel = require('../../models/UserModel');
var fs = require('fs');
var path = require('path');
var stopWords = require('fs').readFileSync(path.join(__dirname, "../../stopWords.txt"), 'utf8').toString().split(",");
var testCtrl = require('./testCtrl.js');

for (var i = 0; i < stopWords.length; i++)
	stopWords[i] = stopWords[i].toUpperCase();

function validateTime(time) {
    var isValidDateMsg = Date.parse(time);
    if (isNaN(isValidDateMsg)) {
        return 'Error: date and time must be in ISO format!';
    }
    return '';
}

function isAllStopWords(words){
	var allUndefined = true;
	for (var j = 0; j < words.length; j++){
		if (words[j])
			allUndefined = false;
	}
	if (allUndefined)
		return true;
	return false;
}

function isMactch(msg, words){
	for (var j = 0; j < words.length; j++){
		if (words[j] && msg.indexOf(words[j].toUpperCase()) < 0)
			return false;
	}
	return true;
}

module.exports.saveMessage = function(msg, callback) {
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
    if (msg.postedAt) {
        var errorMsg = validateTime(msg.postedAt);
        if (errorMsg) 
        	return callback({
            statusCode: 400,
            desc: errorMsg
        });
    }
    chatModel.saveMessage(msg.content, msg.author, msg.messageType, msg.target, msg.postedAt, function(result) {
        if (!result.status)
            callback({
                statusCode: 400,
                desc: result.desc
            });
        else
            callback({
                statusCode: 201,
                desc: "message has been saved"
            });
        return;
    });
};

module.exports.getPublicMessages = function(callback) {
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var isActive = {};
    chatModel.getPublicMessages(function(result) {
        if (!result.status) return callback({ statusCode: 400 });
		var publicMsgs = result.msgs;
		userlistModel.allUser(function(result){
			result.users.forEach(function(item){
				isActive[item.username] = (item.accountStatus === "Active");
			});
			publicMsgs = publicMsgs.filter(function(item, idx, arr){
				return isActive[item.author];
			});
			callback({
				statusCode: 200,
				msglist: publicMsgs
			});
		});
    });
};

module.exports.getPrivateMessages = function(author, target, callback) {
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var isActive = {};
    userlistModel.selectOneUser(author, function(result) {
        if (!result.status) {
            return callback({ statusCode: 404 });
        }
		isActive[result.user.username] = (result.user.accountStatus === "Active");
        userlistModel.selectOneUser(target, function(result) {
            if (!result.status) {
                return callback({ statusCode: 404 });
            }
			isActive[result.user.username] = result.user.accountStatus === "Active";
            chatModel.getPrivateMessages(author, target, function(result) {
                if (!result.status) {
                    return callback({ statusCode: 500 });
                }
				var activeMsgs = result.msgs.filter(function(item, idx, arr) {
					return (isActive[item.author] && isActive[item.target]);
				});
                callback({ statusCode: 200, msglist: activeMsgs });
            });
        });
    });
};

module.exports.getAnnouncements = function(callback) {
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var isActive = {};
    chatModel.getAnnouncements(function(result) {
        if (!result.status) return callback({ statusCode: 500 });
		var anns = result.msgs;
		userlistModel.allUser(function(result){
			result.users.filter(function(item){
				isActive[item.username] = (item.accountStatus === "Active");
			});
			anns = anns.filter(function(item, idx, arr){
				return isActive[item.author];
			});
			callback({ statusCode: 200, msglist: anns });
		});
    });
};

module.exports.getAnnouncementsByStringMatch = function(searchStr, offset, callback){
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var words = searchStr.split(' ');
	for (var i = 0; i < words.length; i++)
		words[i] = words[i].toUpperCase();
	for (i = 0; i < words.length; i++){
		if (stopWords.indexOf(words[i]) >= 0)
			delete words[i];
	}
	if (isAllStopWords(words)){
		callback({statusCode: 400});
		return;
	}
	chatModel.getAnnouncements(function(result){
		if (!result.status){
			callback({statusCode: 500});
			return;
		}
		else {
			var announcements = result.msgs;
			var count = 0;
			var msgs = [];
			for (var i = 0; i < announcements.length; i++) {
				var content = announcements[i].content.toUpperCase();
				if (isMactch(content, words)) {
					count++;
					if (count > offset) msgs.push(announcements[i]);
					if (msgs.length >= 10) break;
				}
			}
			callback({statusCode: 200, msglist: msgs});
			return;
		}
	});
};

module.exports.getPublicMessagesByStringMatch = function(searchStr, offset, callback){
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	var words = searchStr.split(' ');
	for (var i = 0; i < words.length; i++)
		words[i] = words[i].toUpperCase();
	for (i = 0; i < words.length; i++){
		if (stopWords.indexOf(words[i]) >= 0)
			delete words[i];
	}
	if (isAllStopWords(words)){
		callback({statusCode: 400});
		return;
	}
	chatModel.getPublicMessages(function(result){
		if (!result.status){
			callback({statusCode: 500});
			return;
		}else{
			var publicMsgs = result.msgs;
			var count = 0;
			var msgs = [];
			for (var i = 0; i < publicMsgs.length; i++){
				var content = publicMsgs[i].content.toUpperCase();
				if (isMactch(content, words)){
					count++;
					if (count > offset)
						msgs.push(publicMsgs[i]);
					if (msgs.length > 10)
						break;
				}
			}
			callback({statusCode: 200, msglist: msgs});
		}
	});
};

module.exports.getPrivateMessagesByStringMatch = function(username, searchStr, offset, callback){
	if (testCtrl.isTesting()){
		callback({statusCode: 400, desc: 'system is under testing, try again later'});
		return;
	}
	userlistModel.selectOneUser(username, function(result){
		if (!result.status){
			callback({statusCode: 400});
			return;
		}
		var words = searchStr.split(' ');
		for (var i = 0; i < words.length; i++)
			words[i] = words[i].toUpperCase();
		for (i = 0; i < words.length; i++){
			if (stopWords.indexOf(words[i]) >= 0)
				delete words[i];
		}
		if (isAllStopWords(words)){
			callback({statusCode: 400});
			return;
		}
		chatModel.searchPrivateMessageByAuthor(username, function(resultSearchAuthor){
			if (!resultSearchAuthor.status){
				callback({status: 500});
				return;
			}
			chatModel.searchPrivateMessageByTarget(username, function(resultSearchTarget){
				if (!resultSearchTarget.status){
					callback({status: 500});
					return;
				}
				var privateMsgs = resultSearchAuthor.msgs.concat(resultSearchTarget.msgs);
				privateMsgs.sort(function(a, b){
					if (a.postedAt < b.postedAt)
						return -1;
					else if (a.postedAt == b.postedAt)
						return 0;
					return 1;
				});
				var count = 0;
				var msgs = [];
				for (var i = 0; i < privateMsgs.length; i++){
					var content = privateMsgs[i].content.toUpperCase();
					if (isMactch(content, words)){
						count++;
						if (count > offset)
							msgs.push(privateMsgs[i]);
						if (msgs.length > 10)
							break;
					}
				}
				callback({statusCode: 200, msglist: msgs});
			});
		});
	});
};
