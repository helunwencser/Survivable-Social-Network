/* SERVICES */
var userService = require('./service/userService');
var messageService = require('./service/messageService');
var systemService = require('./service/systemService');
var searchService = require('./service/searchService');
var monitorService = require('./service/monitorService');

module.exports = function(app) {

    /* SYSTEM LEVEL APIs */
    app.get('/', systemService.isUnderTesting, systemService.handleRootContext);

    app.get('/home', systemService.isUnderTesting, systemService.handleHomeContext);

    app.get('/uploadPicture', systemService.isUnderTesting, systemService.handlePictureUpload);

    app.get('/views/:pageid', systemService.isUnderTesting, systemService.handleViewContext);

    /* USER LEVEL APIs */
    app.post('/user/signup/:username', userService.signup);

    app.post('/user/login/:username', userService.login);

    app.post('/user/logout', userService.logout);

    app.get('/users', systemService.isUserLoggedIn, userService.getUsers);

    app.get('/user/:username', systemService.isUserLoggedIn, userService.getUser);

    app.put('/user/:username', systemService.isUserLoggedIn, userService.updateUser);

	// Just for system testing, not an public API
    app.delete('/user/:username', userService.deleteUser);

    app.post('/user/picture/:username', systemService.isUserLoggedIn, userService.postProfilePicture);

    app.get('/user/picture/:username', userService.getProfilePicture);

    app.post('/status/:username', systemService.isUserLoggedIn, userService.shareStatus);

    app.get('/status/all/:username', systemService.isUserLoggedIn, userService.getStatusHistory);

    /* MESSAGING APIs */
    app.get('/announcements', systemService.isUserLoggedIn, messageService.getAnnouncements);

    app.get('/messages/wall', systemService.isUserLoggedIn, messageService.getWallMessages);

    app.post('/messages/wall', systemService.isUserLoggedIn, messageService.putMessageOnWall);

    app.get('/messages/:username', systemService.isUserLoggedIn, messageService.getPrivateMessagesWithUser);

    /* SEARCH INFORMATION APIs */
    app.get('/search/users', systemService.isUserLoggedIn, searchService.searchUsers);

    app.get('/search/announcements', systemService.isUserLoggedIn, searchService.searchAnnouncements);

    app.get('/search/publicMessages', systemService.isUserLoggedIn, searchService.searchPublicMessages);

    app.get('/search/privateMessages', systemService.isUserLoggedIn, searchService.searchPrivateMessages);

    /* PERFORMANCE MONITORING APIs */
    app.post('/admin/test/start', systemService.isUserLoggedIn, monitorService.startPerformanceTest);

    app.post('/admin/test/stop', systemService.isUserLoggedIn, monitorService.stopPerformanceTest);

};
