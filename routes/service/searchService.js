var userCtrl = require('../controller/userCtrl');
var chatCtrl = require('../controller/chatCtrl');


module.exports.searchUsers = function(req, res) {

    if (req.query.username) {
        userCtrl.getUsersByUserNameMatch(req.query.username, function(result) {
            res.status(result.statusCode);
            if (result.statusCode == 200) {
                res.send(result.users);
            } else {
                //delete result.statusCode;
                res.send(result);
            }
        });

    } else if (req.query.statusType) {
        userCtrl.getusersByStatusNameMatch(req.query.statusType, function(result) {
            res.status(result.statusCode);
            if (result.statusCode == 200) {
                res.send(result.users);
            } else {
                delete result.statusCode;
                res.send(result);
            }
        });

    } else {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting either "username" OR "statusType" as query parameters.'
        });
        return;
    }
};

module.exports.searchAnnouncements = function(req, res) {

    if (req.query.content) {
        /* Setting offset to zero, in case not provided */
        var offset = 0;
        if (req.query.offset) {
            offset = req.query.offset;
        }

        chatCtrl.getAnnouncementsByStringMatch(req.query.content, offset, function(result) {
            res.status(result.statusCode);
            if (result.statusCode == 200) {
                res.send(result.msglist);
            } else {
                //delete result.statusCode;
                res.send(result);
            }
        });

    } else {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "content" as a query parameter.'
        });
        return;
    }
};

module.exports.searchPublicMessages = function(req, res) {

    if (req.query.content) {
        /* Setting offset to zero, in case not provided */
        var offset = 0;
        if (req.query.offset) {
            offset = req.query.offset;
        }

        chatCtrl.getPublicMessagesByStringMatch(req.query.content, offset, function(result) {
            res.status(result.statusCode);
            if (result.statusCode == 200) {
                res.send(result.msglist);
            } else {
                //delete result.statusCode;
                res.send(result);
            }
        });

    } else {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "content" as a query parameter.'
        });
        return;
    }
};

module.exports.searchPrivateMessages = function(req, res) {

    if (req.query.content) {
        /* Setting offset to zero, in case not provided */
        var offset = 0;
        if (req.query.offset) {
            offset = req.query.offset;
        }

        chatCtrl.getPrivateMessagesByStringMatch(req.user.username, req.query.content, offset, function(result) {
            res.status(result.statusCode);
            if (result.statusCode == 200) {
                res.send(result.msglist);
            } else {
                //delete result.statusCode;
                res.send(result);
            }
        });

    } else {
        res.status(400);
        res.json({
            desc: 'Invalid input arguments. Expecting "content" as a query parameter.'
        });
        return;
    }
};
