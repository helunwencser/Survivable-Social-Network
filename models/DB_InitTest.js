var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDBTest.db');

module.exports.createMsgInfoTableForTest = function (callback) {
    db.run('DROP TABLE IF EXISTS msginfoTest', function(err){
        if (err) return callback({status: false, desc: err});
        db.run('CREATE TABLE  "msginfoTest" (' +
            '"content" TEXT, ' +
            '"author" TEXT, ' +
            '"messageType" TEXT, ' +
            '"target" TEXT, ' +
            '"postedAt" TEXT, ' +
            '"messageID" INTEGER PRIMARY KEY AUTOINCREMENT )', function(err) {
            if (err) return callback({status:false, desc:"create failed"});
			callback({status:true, desc:"create succeed"});
        });
    });
};

module.exports.destoryTable = function(callback){
    db.run('DROP TABLE IF EXISTS msginfoTest', function(err){
        if (err) return callback({status: false, desc: err});
		callback({status: true, desc: 'test table delete success'});
    });
};
