var agent = require("superagent").agent();
var assert = require("chai").assert;
var app = require('../app');

var port = Math.floor(1000 + 10000*Math.random());
var HOST = "http://localhost:" + port;

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('Integration Tests', function() {
	test('startServer', function(done) {
		app.startServer(port, function(error) {
			throw error;
		}, done);
	});

	test('isServerUp', function(done) {
		agent.get(HOST + "/")
			.end(function(err, res) {
				assert.equal(res.statusCode, 200);
				done();
			});
	});

	test('testSignup', function(done) {
		agent
			.post(HOST + "/user/signup/testuser")
			.send({
				password: "ssnoc",
				createdAt: "2015-11-04T02:15:34.515Z"
			})
			.end(function(err, res) {
				assert.equal(res.statusCode, 201);
				done();
			});
	});

	test('signupFailsWithSameUsername', function(done) {
		agent
			.post(HOST + "/user/signup/testuser")
			.send({
				password: "testpassword",
				createdAt: "2015-11-04T02:15:34.515Z"
			})
			.end(function(err, res) {
				assert.equal(res.statusCode, 401);
				done();
			});
	});

	test('testLogout1', function(done) {
		var redirects = [];
		agent
			.post(HOST + "/user/logout")
			.send({
				logoutTime: "2015-11-05T03:15:34.515Z"
			})
			.on('redirect', function(res){
				redirects.push(res.headers.location);
			})
			.end(function(err, res) {
				assert.equal(redirects[0], "/");
				done();
			});
	});

	test('testUpdateUserWithoutLogin', function(done) {
		agent
			.put(HOST + "/user/testuser")
			.send({
				firstname: "Ming-Yuan",
				lastname: "Jian",
				updatedAt: "2015-11-05T02:15:34.515Z"
			})
			.end(function(err, res) {
				assert.equal(res.statusCode, 403);
				done();
			});
	});

	test('testLogin', function(done) {
		agent
			.post(HOST + "/user/login/testuser")
			.send({
				password: "ssnoc",
				lastLoginAt: "2015-11-05T02:15:34.515Z"
			})
			.end(function(err, res) {
				assert.equal(res.statusCode, 200);
				done();
			});
	});

	test('testUpdateUser', function(done) {
		agent
			.put(HOST + "/user/testuser")
			.send({
				firstname: "Ming-Yuan",
				lastname: "Jian",
				location: "CMU-SV B23",
				coordinate: "37.412353, -122.058460",
				updatedAt: "2015-11-05T02:15:34.515Z"
			})
			.end(function(err, res) {
				assert.equal(res.statusCode, 200);
				done();
			});
	});

    test('testGetUsers', function(done) {
        agent
            .get(HOST + "/users")
            .end(function(err, res) {
                assert.equal(res.statusCode, 200);
                assert.equal(res.body[0].username, "SSNAdmin");
                done();
            });
    });

	test('testLogout2', function(done) {
		var redirects = [];
		agent
			.post(HOST + "/user/logout")
			.send({
				logoutTime: "2015-11-05T03:15:34.515Z"
			})
			.on('redirect', function(res){
				redirects.push(res.headers.location);
			})
			.end(function(err, res) {
				assert.equal(redirects[0], "/");
				done();
			});
	});

	test('testDeleteUser', function(done) {
		agent
			.del(HOST + "/user/testuser")
			.end(function(err, res) {
				assert.equal(res.statusCode, 200);
				done();
			});
	});

	/*test('testShareStatus', function(done) {
		agent
			.post(HOST + "/status/testuser")
			.send({
				updatedAt: "2015-11-05T02:15:34.515Z",
				statusType: "OK"
			})
			.expect("Content-type", /json/)
			.end(function(err, res) {
				res.status.should.equal(200);
				res.body.desc.should.equal("add status successfully.");
				done();
			});
	});

	test('testGetAllSharedStatus', function(done) {
		agent
			.get(HOST + "/status/all/testuser")
			.expect("Content-type", /json/)
			.end(function(err, res) {
				res.status.should.equal(200);
				res.body.length.should.aboveOrEqual(1);
				done();
			});
	});

	test('testGetAnnouncements', function(done) {
		agent
			.get(HOST + "/announcements")
			.expect("Content-type", /json/)
			.end(function(err, res) {
				res.status.should.equal(200);
				res.body.length.should.aboveOrEqual(0);
				done();
			});
	});

	test('testPostPublicMessage', function(done) {
		agent
			.post(HOST + "/messages/wall")
			.expect("Content-type", /json/)
			.send({
				content: "HELLO",
				messageType: "Public",
				postedAt: "2015-11-07T02:15:34.515Z"
			})
			.end(function(err, res) {
				res.status.should.equal(201);
				done();
			});
	});

	test('testGetPublicMessages', function(done) {
		agent
			.get(HOST + "/messages/wall")
			.expect("Content-type", /json/)
			.end(function(err, res) {
				res.status.should.equal(200);
				res.body.length.should.aboveOrEqual(1);
				done();
			});
	});

	test('testSearchUsers', function(done) {
		agent
			.get(HOST + "/search/users?username=t")
			.expect("Content-type", /json/)
			.end(function(err, res) {
				res.status.should.equal(200);
				res.body[0].username.should.equal("testuser");
				done();
			});
	});

    var base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8JHfL2zBfdAAABL0lEQVRYw+2XMQ6DMAxFP2LIyBE4Sm4W6M04So6QMQOK+50UWrWdG1fiSyDBW4xjfxvg0qXfSlTbKAIX4fShmCE7r2kDvL4gBIIdMsk+tailuLhItEZ4H/JslWzMaLBG6mmPsqGSjzroSVqXaNQuhi/905M0jQmlhvyhnkQS2CLMqOR5BZZsiNSQPTM6iNzyzIyudkhzl+TrsSssdgj8Dk8OMOQ45LNL+hO6y1gbhWR1ms5/IFqdSa2n8Hu0TOfVDklofl1nicizDgwQGiI87/WFjrpghyS1bEbNAl1EXpyxPzmdsXVOsETanBM59oP8NoN7krYfsI9RzznAEjn20UNnRu0QrcRB/frsYCsEjx8MGvPbptqVtNPmqNN/DF347JBnl+g++jqD+5NLl/rrDicsvrgw3HVeAAAAAElFTkSuQmCC";
    test('testPictureUpload', function(done) {
        server
            .post("/user/picture/testuser")
            .send({
                image: base64Image
            })
            .expect("Content-type", /json/)
            .end(function(err, res) {
                res.status.should.equal(200);
                done();
            });
    });

    test('getUploadedPicture', function(done) {
        server
            .get("/user/picture/testuser")
            .send()
            .expect("Content-type", /html/)
            .end(function(err, res) {
                res.status.should.equal(200);
                done();
            });
    });

    test('testLogout', function(done) {
        server
            .post("/user/logout")
            .send({
                logoutTime: "2015-11-05T03:15:34.515Z"
            })
            .expect("Content-type", /json/)
            .end(function(err, res) {
                res.status.should.equal(302);
                done();
            });
    });*/
});
