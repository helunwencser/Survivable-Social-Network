var expect = require('expect.js');
var dbInit = require('../models/DB_Init');
var dbInit_Test = require('../models/DB_InitTest.js');

suite('DB_Init test',function(){


   test('createMsgInfoTableForTest',function(done){
       dbInit_Test.createMsgInfoTableForTest(function(result){
           expect(result.status).to.be.ok();
           done();
       });
    });

    test('destoryTable succeed',function(done){
        dbInit_Test.destoryTable(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });


    test('destoryTable failed',function(done){
        dbInit_Test.destoryTable(function(result){
            expect(result.status).to.be.ok();
            done();
        });
    });


    test('create userinfo table failed',function(done){

        dbInit.createUserInfoTable(function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('create status table failed',function(done){

        dbInit.createStatusCrumbTable(function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });

    test('create messageinfo table failed',function(done){

        dbInit.createMessageInfoTable(function(result){
            expect(result.status).not.to.be.ok();
            done();
        });
    });


});
