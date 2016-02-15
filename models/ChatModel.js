var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./SSNocDB.db');
var helper = require('./Helper');

// Sometimes only by check the db can we know if input is correct
//whether the callback is suitable for the controller is judged in controller
//Identifier is user or id ? maybe I will achieve both.In this module version,I used id except searchUserMessage

exports.saveMessage =function(contents,authors,messageTypes,targets,postedAts, callback){
    contents = helper.sqlite_escape(contents);
    sql_cmd = "INSERT INTO 'messageinfo' (content, author, messageType, target, postedAt)";
    sql_cmd += " VALUES (";
    sql_cmd += "'" + contents + "', ";
    sql_cmd += "'" + authors + "', ";
    sql_cmd += "'" + messageTypes + "', ";
    sql_cmd += "'" + targets + "', ";
    sql_cmd += "'" + postedAts + "')";
    db.run(sql_cmd, function(err){
        if (err) return callback({status: false, desc: err});
		callback({status: true});
    });
};

exports.searchPrivateMessageByAuthor = function(author, callback){
    db.all("SELECT * FROM messageinfo WHERE author = '" + author + "' AND messageType = 'Private'", function(err, rows){
        if(err){
            console.log(err);
            callback({status: false, desc: "search private message by author failed"});
        }
        else
            callback({status: true, msgs: rows, desc: "search private message by author success"});
    });
};

exports.searchPrivateMessageByTarget = function(target, callback){
    db.all("SELECT * FROM messageinfo WHERE target = '" + target + "' AND messageType = 'Private'", function(err, rows){
        if(err)
            callback({status: false, desc: "search private message by target failed"});
        else
            callback({status: true, msgs: rows, desc: "search private message by target success"});
    });
};

exports.searchAuthorMessage=function (authors, callback){
    db.all("SELECT * FROM messageinfo WHERE author='" + authors + "'",function(err,row) {
            if (err) {
                callback({status:false, desc:"searchAuthorMessage failed"});
            }else{
                callback({status:true,messageCB:row,desc:"searchAuthorMessage succeed"});
            }
        }
    );
};

exports.getPublicMessages=function(callback){
    var messageType = "Public";
    db.all("SELECT * FROM messageinfo WHERE messageType='" + messageType + "'ORDER BY messageinfo.postedAt ASC", function(err, row) {
        if(err) {

            callback({status: false, desc: err});
        }
        else {
            callback({status: true, msgs: row});
        }
    });
};

exports.getPrivateMessages=function(usernames1,usernames2,callback){
    var private="Private";
    db.all("SELECT * FROM messageinfo WHERE messageType='" + private + "'AND ((author='"+usernames1+"'AND target='"+usernames2+"')OR(author='"+usernames2+"'AND target='"+usernames1+"'))ORDER BY messageinfo.postedAt ASC", function(err, rows) {
        if(err){

            callback({status:false,desc:"getPrivateMessages failed"});
        }
        else {

			callback({status: true, msgs: rows, desc: "getPrivateMessages succeed"});
        }
    });
};

exports.getAnnouncements=function(callback){
    var messageType = "Announcement";
    db.all("SELECT * FROM messageinfo WHERE messageType='" + messageType + "'ORDER BY messageinfo.postedAt ASC", function(err, row) {
        if (err) {
            callback({status: false, desc: err});
        }
        else {
            callback({status: true, msgs: row});
        }
    });
};

//exports.deleteMessagebyid=function(messageIDs, callback){
//    db.get("SELECT content FROM messageinfo WHERE messageID='" + messageIDs + "'",function(err,row){
//        if(err !== null) {
//
//            callback({status:false,desc:messageIDs+"pinpoint Message failed"});
//        }else
//        {
//
//           if(row===undefined){
//
//               callback({status:false,desc:messageIDs+"has No such message in db"});
//           }else{
//
//                   db.run("DELETE FROM messageinfo WHERE messageID='" + messageIDs + "'",
//                       function(err) {
//                           if(err !== null) {
//
//                               callback({status:false,desc:messageIDs+"delete Message by id failed"});
//                           }else
//                           {
//
//                               callback({status:true,desc:messageIDs+"delete Message by id succeed"});
//                           }
//                       });
//           }
//
//        }
//
//    });
//};


//exports.updateOneMessagebyid=function(contents,authors,messageTypes,targets,postedAts,messageIDs, callback){
//    db.get("SELECT content FROM messageinfo WHERE messageID='" + messageIDs + "'",function(err,row) {
//        if (err !== null) {
//            callback({status: false, desc: messageIDs + "pinpoint Message failed"});
//        } else {
//            if (row === undefined) {
//
//                callback({status: false, desc: messageIDs + " has No such message in db"});
//            } else {
//                contents = helper.sqlite_escape(contents);
//                db.run("UPDATE messageinfo SET content = '" + contents + "',author='" + authors + "',messageType='" + messageTypes +
//                    "',target='" + targets +
//                    "',postedAt='" + postedAts + "' WHERE messageID='" + messageIDs + "'",
//                    function (err) {
//                        if (err !== null) {
//
//                            callback({status: false, desc: messageIDs + "update One Message by id failed"});
//                        } else {
//
//                            callback({status: true, desc: messageIDs + "update One Message by id succeed"});
//                        }
//                    });
//            }
//        }
//
//}

exports.deleteMessagebyid=function(messageIDs, callback){
	db.get("SELECT content FROM messageinfo WHERE messageID='" + messageIDs + "'", function(err, row){
        if (err) return callback({ status: false, desc: err });
		if (!row) return callback({ status: false, desc: "No message with ID " + messageIDs });
        db.run("DELETE FROM messageinfo WHERE messageID='" + messageIDs + "'", function(err) {
            if (err) return callback({status:false,desc:messageIDs+"delete Message by id failed"});
		    callback({status:true,desc:messageIDs+"delete Message by id succeed"});
        });
    });
};

exports.updateAuthor = function(username, newUsername, callback){
    var sql = "UPDATE messageinfo SET author = '" + newUsername + "' WHERE author = '" + username + "'";
    db.run(sql, function(err){
        if(err){
            callback({status: false, desc: err});
            return;
        }else{
            callback({status: true, desc: "update author succeed"});
            return;
        }
    });
};

exports.updateTarget = function(username, newUsername, callback){
    var sql = "UPDATE messageinfo SET target = '" + newUsername + "' WHERE target = '" + username + "'";
    db.run(sql, function(err){
        if(err){
            callback({status: false, desc: err});
            return;
        }else{
            callback({status: true, desc: "update target succeed"});
            return;
        }
    });  
};

exports.deleteAllMessages = function(callback){
    var sql = "DELETE FROM messageinfo";
    db.run(sql, function(err){
        if (err){
            return callback({status: false, desc: err});
        }
        callback({status: true, desc: "all messages deleted"});
    });  
};
