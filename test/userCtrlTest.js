var expect = require('expect.js');
var userCtrl = require('../routes/controller/userCtrl.js');
var userModel = require('../models/UserModel.js');
var db_init = require('../models/DB_InitTest.js');

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('User Ctrl', function(){

	var updateInfo = {
            lastLoginAt: '2015-11-10',
            createdAt: '2015-11-08'
    };

	test('updateValidateLastLoginAt', function(done){
		updateInfo.lastLoginAt = "20141220";
		updateInfo.createdAt = '2014-12-20';

		userCtrl.update('username', updateInfo, true, function(result){
			expect(result.statusCode).to.eql(400);
			expect(result.desc).to.eql('Error: date and time must be in ISO format!');
			done();
		});
	});

	test('updateValidateCreatedAt', function(done){
		updateInfo.lastLoginAt = "2014-12-20";
		updateInfo.createdAt = "20141220";

	    userCtrl.update('username', updateInfo, true, function(result){
	    	expect(result.statusCode).to.eql(400);
	    	expect(result.desc).to.eql('Error: date and time must be in ISO format!');
			done();
	    });
	});

	test('updateNotExistsUser', function(done){
		updateInfo.lastLoginAt = "2014-12-20";
		updateInfo.createdAt = "2014-12-20";

		userCtrl.update('someUserNotExists', updateInfo, true, function(result){
			expect(result.statusCode).to.eql(404);
			expect(result.desc).to.eql('user not exists!');
			done();
		});
	});

	test('updateExistsUser', function(done){
		updateInfo.firstname = "Ming-Yuan";
		updateInfo.lastname = "Jian";
		updateInfo.location = "CMU-SV B19";
		updateInfo.coordinate = "37.412353, -122.058460";
		updateInfo.peopleiknow = "myjian";
		userModel.addNewUser('myjian1', 'password', function(result){
			userCtrl.update('myjian1', updateInfo, true, function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.desc).to.eql("update user success!");
				done();
			});
		});
	});

	test('getUsersWithUserAdded', function(done){
		userModel.addNewUser('someUserForGetUsers', 'password', function(result){
			userCtrl.getUsers(function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.users.length).to.be.greaterThan(0);
				done();
			});
		});
	});

	test('getUserWithUserAdded', function(done){
		userModel.addNewUser('someUserForGetUser', 'password', function(result){
			userCtrl.getUser('someUserForGetUser', function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.user.username).to.eql('someUserForGetUser');
				done();
			});
		});
	});

	var updateStatusRequest = {
        updatedAt: '2014-12-20',
        statusType: 'OK',
        location: 'SFO'
    };

    test('updateStatusWithUserNotExists', function(done){
		userCtrl.updateStatus('someUserForUpdateStatusWithUserNotExists', updateStatusRequest, function(result){
			expect(result.statusCode).to.eql(404);
			expect(result.desc).to.eql("user not exists");
			done();
		});
    });

    test('updateStatusWithInvalidStatusType', function(done){
		userModel.addNewUser('someUser', 'password', function(result){
			updateStatusRequest.statusType = "unknownType";
			userCtrl.updateStatus('someUser', updateStatusRequest, function(result){
				expect(result.statusCode).to.eql(400);
				expect(result.desc).to.eql("Invalide status code");
				done();
			});
		});
    });

    test('updateStatus', function(done){
		userModel.addNewUser('someUserForUpdateStatus', 'password', function(result){
			updateStatusRequest.statusType = "OK";
			userCtrl.updateStatus('someUserForUpdateStatus', updateStatusRequest, function(result){
				expect(result.statusCode).to.eql(200);
				expect(result.desc).to.eql('add status successfully.');
				done();
			});
		});
    });

    test('getUserStatusHistoryWithUserNotExists', function(done){
		userCtrl.getUserStatusHistory('someUserForGetUserStatusHistoryWithUserNotExists', function(result){
			expect(result.statusCode).to.eql(400);
			expect(result.desc).to.eql("user not exists!");
			done();
		});
    });

    test('getUserStatusHistory', function(done){
    	userModel.addNewUser('someUserForGetUserStatusHistory', 'password', function(result){
    		userCtrl.updateStatus('someUserForGetUserStatusHistory', updateStatusRequest, function(result){
    			userCtrl.getUserStatusHistory('someUserForGetUserStatusHistory', function(result){
    				expect(result.statusCode).to.eql(200);
    				expect(result.desc).to.eql("get user status history successfully");
					done();
    			});
    		});
    	});
    });

    test('updateLastLogoutTimeWithUserNotExists', function(done){
    	userCtrl.updateLastLogoutTime('someUserNotExists', null, function(result){
			expect(result.statusCode).to.eql(400);
			expect(result.desc).to.eql('user not exists');
			done();
		});
    });

    test('updateLastLogoutTimeWithUserAdded', function(done){
    	userModel.addNewUser('someUserForUpdateLastLogoutTime', 'password', function(result){
    		var updateInfo = {lastLogoutAt: "2014-12-20T08:20:30.000Z"};
    		userCtrl.update('someUserForUpdateLastLogoutTime', updateInfo, true, function(result){
    			expect(result.statusCode).to.eql(200);
    			expect(result.desc).to.eql("update user success!");
				done();
    		});
    	});
    });

    test('getUsersByUserNameMatch', function(done){
    	userModel.addNewUser('someUserForGetUserByUserNameMatch', 'password', function(result){
    		updateInfo.lastLoginAt = "2014-12-10";
    		updateInfo.lastLogoutAt = "2014-12-11";
    		userCtrl.update('someUserForGetUserByUserNameMatch', updateInfo, true, function(result){
    			userCtrl.getUsersByUserNameMatch('someUserForGetUserByUserNameMatch', function(result){
    				expect(result.statusCode).to.eql(200);
    				expect(result.desc).to.eql('get matched users successfully.');
    				expect(result.users.length).to.above(0);
    				done();
    			});
    		});

    	});
    });

    test('getUserByWrongStatusName', function(done){
    	userCtrl.getusersByStatusNameMatch('status', function(result){
    		expect(result.statusCode).to.eql(400);
    		expect(result.users).to.eql(null);
    		expect(result.desc).to.eql('invalide status name');
    		done();
    	});
    });

    test('getusersByStatusNameMatch', function(done){
    	userModel.addNewUser('someUserForGetUserByStatusNameMatch', 'password', function(result){
    		userCtrl.updateStatus('someUserForGetUserByStatusNameMatch', updateStatusRequest, function(result){
    			userCtrl.getusersByStatusNameMatch('ok', function(result){
    				expect(result.statusCode).to.eql(200);
    				expect(result.desc).to.eql('get users by status success');
    				expect(result.users.length).to.above(0);
    				done();
    			});
    		});
    	});
    });

    test('deleteOneUser', function(done){
    	userCtrl.deleteUser('someUser', function(result){
			expect(result.statusCode).to.eql(200);
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
