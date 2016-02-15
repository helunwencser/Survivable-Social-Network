var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDBTest.db');
var helper = require('./Helper');

module.exports.savePublicMessage = function(content, author, messageType, target, postedAt, callback){
    msg = helper.sqlite_escape(content);
    sql_cmd = "INSERT INTO 'msginfoTest' (content, author, messageType, target, postedAt)";
    sql_cmd += " VALUES (";
    sql_cmd += "'" + msg + "', ";
    sql_cmd += "'" + author + "', ";
    sql_cmd += "'" + messageType + "', ";
    sql_cmd += "'" + target + "', ";
    sql_cmd += "'" + postedAt + "')";
    db.run(sql_cmd, function(err){
        if(err){
            callback({status: false, desc: err});
        }else{
            callback({status: true, desc: 'insert success'});
        }
    });
};

module.exports.getPublicMessages=function(callback){
    var messageType = "Public";
    db.all("SELECT * FROM msginfoTest WHERE messageType='" + messageType + "'ORDER BY msginfoTest.postedAt ASC", function(err, rows) {
        if(err) {
            callback({status: false, msgs: null, desc: err});
            return;
        }
        else {
            callback({status: true, msgs: rows, desc: 'get public message success'});
            return;
        }
    });

};
