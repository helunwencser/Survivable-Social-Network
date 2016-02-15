var expect = require('expect.js');
var testCtrl = require('../routes/controller/testCtrl.js');
var testModel = require('../models/TestModel.js');

if (typeof(suite) === "undefined") suite = describe;
if (typeof(test) === "undefined") test = it;

suite('Test Ctrl', function(){
	/*test('init test db', function(done){
		testCtrl.initTestDB(function(result){
			expect(result.statusCode).to.eql(200);
			expect(result.desc).to.eql("create database for testing successed.");
			expect(testCtrl.isTesting).to.eql(true);
			testCtrl.finishTest(function(result){});
			done();
		});
	});*/
});

