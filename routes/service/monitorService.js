var testCtrl = require('../controller/testCtrl');
var userWhoStartedTheTest = false;

module.exports.getUserWhoStartedTheTest = function() {
	return userWhoStartedTheTest;
};

module.exports.startPerformanceTest = function(req, res) {
    if (req.user.privilege !== "Monitor" && req.user.privilege !== "Admin"){
        res.status(401);
        res.send({
            desc: 'Only a Monitor/Admin can start a performance test!'
        });
		return;
    }

    userWhoStartedTheTest = req.user.username;
    testCtrl.initTestDB(function(result) {
        res.status(result.statusCode);
        delete result.statusCode;
        res.send(result);
    });
};

module.exports.stopPerformanceTest = function(req, res) {
    if (req.user.privilege !== "Monitor" && req.user.privilege !== "Admin"){
        res.status(401);
        res.send({
            desc: 'Only a Monitor/Admin can stop a performance test!'
        });
        return;
    }
    if (userWhoStartedTheTest !== req.user.username && req.user.privilege !== "Admin") {
        res.status(401);
        res.send("Only an admin or the monitor who started the test, can proceed to stop it!");
        return;
    }
    userWhoStartedTheTest = false;

    testCtrl.finishTest(function(result) {
        res.status(result.statusCode);
        delete result.statusCode;
        res.send(result);
    });
};
