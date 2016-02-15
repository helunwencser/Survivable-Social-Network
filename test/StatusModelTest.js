var expect = require('expect.js');
var dbInit = require('../models/DB_Init');
var StatusModel = require('../models/StatusModel.js');

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('StatusModel Test', function() {
    test('init', function(done) {
		dbInit.createStatusCrumbTable(function(result){
			done();
		});
    });

	test('saveStatus Test', function (done) {
		StatusModel.saveStatus("uis", "Help", null, "SV", function (result) {
			expect(result.status).to.be.ok();
			done();
		});
	});

	test('searchOneUserStatus Test',function(done){
		StatusModel.searchOneUserStatusHistory("uis",function(result) {
			expect(result.status).to.be.ok();
			done();
		});
	});

    test('test update user name', function(done){
        StatusModel.saveStatus("testUser", "Help", null, "CMU-SV", function(result){
            StatusModel.updateUsername("testUser", "newUserName", function(result){
                expect(result.status).to.be.ok();
                done();
            });
        });
    });

    test('DeleteAllStatus', function(done){
        StatusModel.deleteAllStatus(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });
});
