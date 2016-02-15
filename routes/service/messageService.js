var chatCtrl = require('../controller/chatCtrl');
var testCtrl = require('../controller/testCtrl');


module.exports.getPrivateMessagesWithUser = function(req, res) {
    chatCtrl.getPrivateMessages(req.user.username, req.params.username, function(result) {
        res.status(result.statusCode);
        if (result.msglist) {
            return res.send(result.msglist);
        }
		delete result.statusCode;
		res.send(result);
    });
};

module.exports.getAnnouncements = function(req, res) {
    chatCtrl.getAnnouncements(function(result) {
        res.status(result.statusCode);
        if (result.msglist) {
            return res.send(result.msglist);
        }
		delete result.statusCode;
		res.send(result);
    });
};

module.exports.getWallMessages = function(req, res) {
    if (testCtrl.isTesting()) {
        testCtrl.getPublicMessages(function(result) {
            res.status(result.statusCode);
            if (result.msglist) {
                return res.send(result.msglist);
            }
			delete result.statusCode;
			res.send(result);
        });
    } else {
        chatCtrl.getPublicMessages(function(result) {
            res.status(result.statusCode);
            if (result.msglist) {
                return res.send(result.msglist);
            }
			delete result.statusCode;
			res.send(result);
        });
    }
};

module.exports.putMessageOnWall = function(req, res) {
    var postMessageRequest = {
        content: req.body.content,
        author: req.user.username,
        messageType: "Public",
        postedAt: req.body.postedAt,
    };

    if (testCtrl.isTesting()) {
        testCtrl.putPublicMessage(postMessageRequest, function(result) {
            res.status(result.statusCode);
            delete result.statusCode;
            res.send(result);
        });
    } else {
        chatCtrl.saveMessage(postMessageRequest, function(result) {
            res.status(result.statusCode);
            delete result.statusCode;
            res.send(result);
        });
    }
};
