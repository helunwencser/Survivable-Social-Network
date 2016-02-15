var expect = require('expect.js');
var dbInit = require('../models/DB_Init');
var UserModel = require('../models/UserModel.js');
var Helper =require('../models/Helper.js');

// don't know how to generate failure excuting SQL in sqlite

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('UserModel Test', function() {
    test('init', function(done) {
        dbInit.createUserInfoTable(function(result){
			UserModel.addNewUser("Social","AAA",function(result){
				done();
			});
        });
    });
	
    test('adduser Test',function(done){
        UserModel.addNewUser("hakan","dddd",function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('SelectOneExistedUser',function(done){
        UserModel.selectOneUser("hakan", function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('SelectOneNonExistedUser', function(done){
        UserModel.selectOneUser("kahan",function(result) {
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('allUsers Test true',function(done){
        UserModel.allUser(function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('updateUser Test true',function(done){
        UserModel.updateUser("hakan",{"firstname":"Hakan"},function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('updateUser Test fail',function(done){
        UserModel.updateUser("nahak",{"bar":"aaaaaaa","foo":"34567"},function(result) {
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('LastLogoutTime', function(done){
        var info = { lastLogoutAt: "2015-01-10T04:14:59.000Z" };
        UserModel.updateUser("Social",info,function(result){
            expect(result.status).to.be.ok();
            done();
        });

    });

    test('LastLogoutTimeFail', function(done){
        var info = { lastLogoutAt: "2015-01-10T04:14:59.000Z" };
        UserModel.updateUser("SA",info,function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('InitOriginAdmin Test true',function(done){
        UserModel.InitOriginAdmin("SSNAdmin","admin",function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });
	
    test('DeleteUser',function(done){
        UserModel.deleteUser("hakan", function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });

    test('test helper',function(done){

       expect(Helper.sqlite_escape("aa\n\r")).to.eql("aa\\n\\r");
        done();
    });

    test('DeleteAllUsers',function(done){
        UserModel.deleteAllUsers(function(result) {
            expect(result.status).to.be.ok();
            done();
        });
    });
});

