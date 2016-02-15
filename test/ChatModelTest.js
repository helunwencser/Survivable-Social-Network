var expect = require('expect.js');
var dbInit = require('../models/DB_Init');
var ChatModel = require('../models/ChatModel.js');
var UserModel = require('../models/UserModel.js');

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;
suite('ChatModel Test', function(){
    test('init', function(done) {
        dbInit.createMessageInfoTable(function(result){
            dbInit.createUserInfoTable(function(result){
				UserModel.addNewUser("Social","AAA",function(result){
					ChatModel.saveMessage("AAA","A","Private","B","2015-01-01", function (result) {
						done();
					});
				});
            });
        });
    });

    test('searchPrivateMessageByAuthor ',function(done){
        ChatModel.searchPrivateMessageByAuthor("A",function(result){
            expect(result.status).to.be.ok();
            expect(result.msgs).not.to.equal(undefined);
            done();
        });
    });

    test('searchPrivateMessageByTarget ',function(done){
        ChatModel.searchPrivateMessageByTarget("B",function(result){
            expect(result.status).to.be.ok();
            expect(result.msgs).not.to.equal(undefined);
            done();
        });
    });

    test('searchPrivateMessageByAuthor not found',function(done){
        ChatModel.searchPrivateMessageByAuthor("no user",function(result){
            expect(result.status).to.be.ok();
            expect(result.msgs[0]).to.equal(undefined);
            done();
        });
    });

    test('searchAuthorMessage',function(done){
        ChatModel.searchAuthorMessage("A",function(result){
            expect(result.status).to.be.ok();
            expect(result.messageCB.length).to.above(0);
            done();
        });
    });

    test('searchAuthorMessage not found',function(done){
        ChatModel.searchAuthorMessage("no user",function(result){
            expect(result.status).to.be.ok();
            expect(result.messageCB.length).not.to.above(0);
            done();
        });
    });

    test('GetAnnouncement', function(done){
        ChatModel.getAnnouncements(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('GetPublicMessage', function(done){
        ChatModel.getPublicMessages(function(result){
            expect(result.status).to.be.ok();
            done();
		});
    });

    test('GetPrivateMessageFail', function(done){
        ChatModel.getPrivateMessages("ee","VV",function(result){
            expect(result.status).to.be.ok();
            expect(result.msgs.length).to.be(0);
            done();
        });
    });

    test('GetPrivateMessage', function(done){
        ChatModel.getPrivateMessages("A","B",function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('DeleteMessagebyID', function(done){
        ChatModel.deleteMessagebyid("0",function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('DeleteMessagebyInvalidID', function(done){
        ChatModel.deleteMessagebyid("-11",function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('GetEmptyPrivateMessage', function(done){
        ChatModel.getPrivateMessages("AAA","B",function(result){
            expect(result.status).to.be.ok();
            expect(result.msgs.length).to.be(0);
            done();
        });
    });

    test('DeleteAllMessages', function(done){
        ChatModel.deleteAllMessages(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('DeleteAllUsers', function(done){
        UserModel.deleteAllUsers(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });
});
