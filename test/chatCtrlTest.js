var expect = require('expect.js');
var chatCtrl = require('../routes/controller/chatCtrl.js');
var userModel = require('../models/UserModel.js');

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('Test chatCtrl', function() {
	var msg = {
		content: "msg",
		author: "user",
		messageType: "Private",
		target: "anotherUser",
		postedAt: "2014-12-10"
	};

	test('saveMessage', function(done){
		chatCtrl.saveMessage(msg, function(result){
			expect(result.statusCode).to.eql(201);
			expect(result.desc).to.eql("message has been saved");
			done();
		});
	});

	test('saveMessageWithWrongTimeFormat', function(done){
		msg.postedAt = "2014/23/23";
		chatCtrl.saveMessage(msg,function(result){
			expect(result.desc).to.eql("Error: date and time must be in ISO format!");
			expect(result.statusCode).to.eql(400);
			msg.postedAt = "2014-12-10";
			done();
		});
	});

	test('getPublicMessage', function(done){
		msg.messageType = "Public";
		chatCtrl.saveMessage(msg, function(result){
			chatCtrl.getPublicMessages(function(result){
				expect(result.statusCode).to.eql(200);
//				expect(result.msglist.length).to.be.above(0);
				done();
			});
		});
	});

	test('getPrivateMessageWithAuthorNotExits', function(done){
		chatCtrl.getPrivateMessages('someUserNotExists', 'user', function(result){
			expect(result.statusCode).to.eql(404);
			done();
		});
	});

	test('getPrivateMessagesWithTargetNotExits', function(done){
		userModel.addNewUser('someUser', 'password', function(result){
			chatCtrl.getPrivateMessages('someUser', 'somerUserNotExists', function(result){
				expect(result.statusCode).to.eql(404);
				done();
			});
		});
	});

	test('getPrivateMessages', function(done){
		userModel.addNewUser('anotherUser', 'password', function(result){
			msg.author = 'someUser';
			msg.target = 'anotherUser';
			msg.messageType = "Private";
			chatCtrl.saveMessage(msg, function(result){
				chatCtrl.getPrivateMessages('someUser', 'anotherUser', function(result){
					expect(result.statusCode).to.eql(200);
					done();
				});
			});
		});
	});

	test('getAnnouncements', function(done){
		msg.messageType = "Announcement";
		chatCtrl.saveMessage(msg, function(result){
			chatCtrl.getAnnouncements(function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.msglist.length).to.be.above(0);
				done();
			});
		});
	});

	test('getAnnouncementsByStringMatch', function(done){
		msg.content = "new Announcement has published";
		msg.messageType = "Announcement";
		chatCtrl.saveMessage(msg, function(result){
			chatCtrl.getAnnouncementsByStringMatch('new Announcement', 0, function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.msglist.length).to.above(0);
				expect(result.msglist[0].content).to.eql('new Announcement has published');
				done();
			});
		});
	});

	test('getAnnouncementsByStringMatchWithAllStopWords', function(done){
		chatCtrl.getAnnouncementsByStringMatch('my and', 0, function(result){
			expect(result.statusCode).to.eql(400);
			done();
		});
	});

	test('getPublicMessagesByStringMatchWithAllStopWord', function(done){
		chatCtrl.getPublicMessagesByStringMatch('my and', 0, function(result){
			expect(result.statusCode).to.eql(400);
			done();
		});
	});

	test('getPublicMessagesByStringMatch', function(done){
		msg.messageType = "Public";
		msg.content = "new public messages";
		chatCtrl.saveMessage(msg, function(result){
			chatCtrl.getPublicMessagesByStringMatch('new public', 0, function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.msglist.length).to.above(0);
				done();
			});
		});
	});

	test('getPrivateMessagesByStringMatchWithStopsWords', function(done){
		chatCtrl.getPrivateMessagesByStringMatch('user', 'my and', 0, function(result){
			expect(result.statusCode).to.eql(400);
			done();
		});
	});

	test('getPrivateMessagesByStringMatch', function(done){
		msg.content = 'new private message 1';
		msg.messageType = 'Private';
		msg.author = 'user1';
		msg.target = 'user2';
		chatCtrl.saveMessage(msg, function(result){
			msg.content = 'new private message 2';
			msg.author = 'user2';
			msg.target = 'user1';
			msg.messageType = 'Private';
			chatCtrl.saveMessage(msg, function(result){
				userModel.addNewUser('user1', 'password', function(result){
					chatCtrl.getPrivateMessagesByStringMatch('user1', 'new private message', 0, function(result){
						expect(result.statusCode).to.eql(200);
						expect(result.msglist.length).to.above(0);
						done();
					});
				});
			});
		});
	});

	test('getPrivateMessagesByStringMatchWithIllegalUserName', function(done){
		chatCtrl.getPrivateMessagesByStringMatch('newUser', 'new message', 0, function(result){
			expect(result.statusCode).to.eql(400);
			done();
		});
	});

    test('deleteAllUsers', function(done){
    	userModel.deleteAllUsers(function(result){
			expect(result.status).to.be.ok();
			done();
		});
    });
});

