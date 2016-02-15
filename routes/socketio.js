var chatCtrl = require('./controller/chatCtrl');
var testCtrl = require('./controller/testCtrl');
var connectedUsers = {};

module.exports.startSocket = function(io) {
    io.on('connection', function(socket) {

        /* Sends new chat message to the controller for db insertion, and also broadcast the same to all client. */
        socket.on('public chat', function(msgObj) {
            if (testCtrl.isTesting()) return;
            msgObj.messageType = "Public";
            chatCtrl.saveMessage(msgObj, function(result) {
                if (result.statusCode > 400) {
                    console.error(result.desc);
                }
            });
            socket.broadcast.emit('public chat', msgObj);
        });

        socket.on('private chat', function(msgObj) {
            if (testCtrl.isTesting()) return;
            msgObj.messageType = "Private";
            chatCtrl.saveMessage(msgObj, function(result) {});
            if (connectedUsers[msgObj.target]) {
                connectedUsers[msgObj.target] = connectedUsers[msgObj.target].filter(function(userSocket, idx) {
                    return userSocket.connected;
                });
                connectedUsers[msgObj.target].forEach(function(userSocket, idx) {
                    userSocket.emit('private chat', msgObj);
                });
            }
        });

        socket.on('announcement', function(msgObj) {
            if (testCtrl.isTesting()) return;
            chatCtrl.saveMessage(msgObj, function(result) {});
            socket.broadcast.emit('announcement', msgObj);
        });


        socket.on('logout', function(user) {
            if (testCtrl.isTesting()) return;
            socket.broadcast.emit('logout', user);
            var usrIdx = connectedUsers[user.username].indexOf(socket);
            // remove the socket from the array
            if (usrIdx >= 0) connectedUsers[user.username].splice(usrIdx, 1);
        });

        socket.on('login', function(user) {
            if (testCtrl.isTesting()) return;
            socket.broadcast.emit('login', user);
            if (!(user.username in connectedUsers)) {
                connectedUsers[user.username] = [];
            }
            connectedUsers[user.username].push(socket);
        });

        socket.on('shareStatus', function(msgObj) {
            if (testCtrl.isTesting()) return;
            socket.broadcast.emit('shareStatus', msgObj);
        });
    });
};

module.exports.logoutUser = function(username) {
	console.log('force logout ' + username);
	if (connectedUsers[username]) {
		connectedUsers[username] = connectedUsers[username].filter(function(userSocket, idx) {
			return userSocket.connected;
		});
		connectedUsers[username].forEach(function(userSocket, idx) {
			userSocket.emit('force logout', {username: username});
			console.log('force logout ' + username + ' at socket ' + idx);
		});
	}
};
