var setActiveNavItem = function(event) {
	$('ul.nav.navbar-nav li').removeClass('active');
	$('a[href="' + location.hash + '"]').parent('li').addClass('active');
	$('a.list-group-item').removeClass('active');
	$('a[href="' + location.hash + '"]').addClass('active');
};
$(window).on('hashchange', setActiveNavItem);

/* People list configuration */
$("div#people_menu").navigation({
	label: false,
	type: 'overlay',
	gravity: 'left',
	maxWidth: '767px'
});
$('#menu_toggle').click(function() {
	$('#real_menu_toggle').click();
});
$("div#people_menu").on('click', 'a', function() {
	$("div#people_menu").navigation("close");
});
$('#actions_toggle').click(function(){
	$("div#people_menu").navigation("close");
});

/* Close the nav menu after user choose an action */
$('#navbar-collapse-1').on('click', 'a:not(.dropdown-toggle)', function() {
	$('#navbar-collapse-1').collapse('hide');
});

/* Toastr component configuration */
var toastrOptions = {
	bottomCenter: {
		closeButton: true,
		timeOut: 3000,
		positionClass: 'toast-bottom-center'
	},
	topCenter: {
		closeButton: true,
		timeOut: 1000,
		positionClass: 'toast-top-center'
	}
};
toastr.options = toastrOptions.bottomCenter;

/* Main Application */
var socket = io();

var esnApp = angular.module('EmergencySocialNetwork', ['ngRoute', 'ngAnimate']);

esnApp.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider
		.when('/directory', {
			templateUrl: 'views/directory',
			controller: 'DirectoryCtrl',
		})
		.when('/user/:username', {
			templateUrl: 'views/user',
			controller: 'UserCtrl',
		})
		.when('/profile', {
			templateUrl: 'views/profile',
			controller: 'ProfileCtrl',
		})
		.when('/chat/:target', {
			templateUrl: 'views/chat',
			controller: 'ChatCtrl',
		})
		.when('/monitor/performance', {
			templateUrl: 'views/monitor-measure-performance',
			controller: 'MeasurePerformanceCtrl'
		})
		.otherwise({
			templateUrl: 'views/welcome',
			controller: 'AnnouncementCtrl',
		});
		$locationProvider.hashPrefix();
	}
]);

esnApp.animation('.view-animate', function() {
	return {
		enter: function(element, done) {
			element.css('display', 'none');
			element.fadeIn(500, done);
			return function() {
				element.stop();
			};
		},
		leave: function(element, done) {
			element.css('width', $('.view-animate').width());
			element.addClass('ng-leave');
			element.fadeOut(500, done);
			return function() {
				element.stop();
			};
		}
	};
});

/* Factory for Status */
esnApp.factory('statusType', function() {
	var statusTypeFactory = {};
	statusTypeFactory.list = [{
		title: 'OK',
		desc: 'I am OK, I do not need help.',
		color: 'success',
		icon: 'glyphicon-heart'
	}, {
		title: 'Help',
		desc: 'I need help, but this is not a life threatening emergency.',
		color: 'warning',
		icon: 'glyphicon-bell'
	}, {
		title: 'Emergency',
		desc: 'I need help now, as this is a life threatening emergency!',
		color: 'danger',
		icon: 'glyphicon-alert'
	}];
	return statusTypeFactory;
});

/* Factory for People */
esnApp.factory('people', function($rootScope, $http, $timeout, statusType) {
	var getDistance = function(lat1, lon1, lat2, lon2){
		var R = 3958.75587; // miles
		var dLat = (lat1 - lat2) * Math.PI / 180;
		var dLon = (lon1 - lon2) * Math.PI / 180;
		lat1 = lat1 * Math.PI / 180;
		lat2 = lat2 * Math.PI / 180;

		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		return R * c;
	};
	var peopleFactory = {};
	peopleFactory.list = {};
	peopleFactory.parse = function(user, idx, arr) {
		if (!user.username)
			throw "No username";
		user.createdAt_local = new Date(user.createdAt).toLocaleString();
		user.lastLoginAt_local = new Date(user.lastLoginAt).toLocaleString();
		if (user.lastStatusCode) {
			for (var i in statusType.list) {
				var st = statusType.list[i];
				if (st.title.toUpperCase() === user.lastStatusCode.toUpperCase()) {
					user.statusIcon = st.icon;
					user.color = st.color;
					break;
				}
			}
		}
		if (!user.statusIcon) {
			user.color = 'info';
			user.statusIcon = 'glyphicon-question-sign';
		}
		if (!user.image) {
			user.image = '/default-user.png';
		}
		if (!('login' in user)) {
			user.login = false;
			if (!user.lastLogoutAt || Date.parse(user.lastLogoutAt) < Date.parse(user.lastLoginAt)) {
				user.login = true;
			}
		}
		if (user.coordinate) {
			var crd = user.coordinate.split(', ');
			user.latitude = parseFloat(crd[0]).toFixed(4);
			user.longitude = parseFloat(crd[1]).toFixed(4);
		}
		if (user.peopleiknow) {
			user.peopleiknow_arr = user.peopleiknow.split(', ');
		}
		return user;
	};
	peopleFactory.refresh = function(callback) {
		$http.get('/users').then(function successCallback(res){
			var users = res.data;
			users.forEach(peopleFactory.parse);
			users.forEach(function(item){
				peopleFactory.list[item.username] = item;
			});
			if (!$rootScope.loginEventSent) {
				var meObj = users.filter(function(item){
					return item.username === $rootScope.my_username;
				})[0];
				socket.emit('login', meObj);
				$rootScope.loginEventSent = true;
			}
			if ($rootScope.me && $rootScope.me.latitude){
				users.forEach(function calculateDist(item){
					if (!item.latitude) return;
					item.distance = getDistance($rootScope.me.latitude, $rootScope.me.longitude, item.latitude, item.longitude);
					item.distance = item.distance.toFixed(2);
					console.log(item.distance);
				});
			}
			callback();
		}, function errorCallback(res) {
			console.error(res);
		});
	};
	peopleFactory.refreshMe = function(done) {
		$http({
			method: 'GET',
			url: '/user/' + $rootScope.my_username
		}).then(function successCallback(res) {
			var data = res.data;
			peopleFactory.parse(data);
			$rootScope.me = data;
			done();
		}, function errorCallback(res){
			console.error(res);
		});
	};
	peopleFactory.updateUser = function(person) {
		var exist = false;
		for (var i in peopleFactory.list){
			var u = peopleFactory.list[i];
			if (u.username !== person.username) {
				continue;
			}
			exist = true;
			if ('statusType' in person) {
				u.lastStatusCode = person.statusType;
				peopleFactory.parse(u);
			}
			if ('login' in person) {
				u.login = person.login;
			}
			angular.element('#people_menu').scope().$apply();
			angular.element('#content .view-animate').scope().$apply();
			break;
		}
		if (!exist) {
			console.log('user not found!');
			peopleFactory.refresh(function(){
				angular.element('#people_menu').scope().users = peopleFactory.list;
				angular.element('#content .view-animate').scope().users = peopleFactory.list;
			});
		}
	};
	socket.on('login', function(person) {
		person.login = true;
		peopleFactory.updateUser(person);
	});
	socket.on('logout', function(person) {
		console.log('on logout');
		person.login = false;
		peopleFactory.updateUser(person);
	});
	socket.on('shareStatus', function(person) {
		console.log('on shareStatus');
		peopleFactory.updateUser(person);
	});
	return peopleFactory;
});

/* Factory for Messages */
esnApp.factory('messages', function($rootScope, $http, statusType) {
	var msgFactory = {};
	msgFactory.publicMsgs = [];
	msgFactory.privateMsgs = {};
	msgFactory.parse = function(msgItem, idx, arr) {
		msgItem.postedAt = Date.parse(msgItem.postedAt);
		msgItem.postedAt_s = new Date(msgItem.postedAt).toLocaleString();
		return msgItem;
	};
	msgFactory.add = function(msgItem) {
		msgFactory.parse(msgItem);
		var target = "public";
		if (msgItem.target) {
			if (msgItem.author === $rootScope.my_username) { // msg from me
				if (!msgFactory.privateMsgs[msgItem.target])
					msgFactory.privateMsgs[msgItem.target] = [];
				msgFactory.privateMsgs[msgItem.target].push(msgItem);
				target = msgItem.target;
			}
			else { // msg to me
				if (!msgFactory.privateMsgs[msgItem.author])
					msgFactory.privateMsgs[msgItem.author] = [];
				msgFactory.privateMsgs[msgItem.author].push(msgItem);
				target = msgItem.author;
			}
		}
		else {
			msgFactory.publicMsgs.push(msgItem);
		}
		var current_a = $('a[href="#/chat/' + target + '"]');
		if (!current_a.hasClass('active')) {
			var badge = current_a.children('.badge');
			var unread_count = badge.text();
			if (unread_count === "") unread_count = 0;
			unread_count = parseInt(unread_count) + 1;
			badge.text(unread_count);
			if (msgItem.author !== $rootScope.my_username) {
				var div = $("<div>");
				var notification = msgItem.author + " sent a message to ";
				notification += (msgItem.target)? "you": "public chat";
				notification += ": ";
				if (msgItem.content.length > 20) {
					notification += msgItem.content.substr(0, 20) + " ...";
				}
				else {
					notification += msgItem.content;
				}
				div.html(notification).attr('data-hash', "#/chat/" + target);
				toastr.options = toastrOptions.topCenter;
				toastr.info(div);
				toastr.options = toastrOptions.bottomCenter;
			}
		}
		else {
			angular.element('#content .view-animate').scope().$apply();
			$('html, body').scrollTop($('#messages').height());
		}
	};
	msgFactory.send = function(event) {
		event.preventDefault();
		var msgText = $('#m').val();
		var username = $rootScope.my_username;
		if (msgText === '') return false;
		var msgItem = { content: msgText, author: username, postedAt: new Date().toISOString() };
		var target = $('#msg_target').val();
		if (target === 'public') {
			socket.emit('public chat', msgItem);
		}
		else {
			msgItem.target = target;
			socket.emit('private chat', msgItem);
		}
		if (!target || target !== username)
			msgFactory.add(msgItem);
		$('#m').val('');
	};
	msgFactory.refresh = function(target, callback){
		var url = '/messages/wall';
		if (target) {
			url = '/messages/' + target;
		}
		$http({
			method: 'GET',
			url: url
		}).then(function successCallback(response) {
			var data = response.data;
			data.forEach(msgFactory.parse);
			if (target)
				msgFactory.privateMsgs[target] = data;
			else
				msgFactory.publicMsgs = data;
			callback(data);
		}, function errorCallback(response) {
			console.error(response);
		});
	};
	socket.on('public chat', function(msgItem) {
		msgFactory.add(msgItem);
	});
	socket.on('private chat', function(msgItem) {
		msgFactory.add(msgItem);
	});
	return msgFactory;
});

/* Factory for announcement */
esnApp.factory('announcement',function($rootScope, $http, $sce, statusType){
	var announcementFactory = {};
	announcementFactory.list = [];
	announcementFactory.parse = function(item, idx, arr) {
		item.postedAt = Date.parse(item.postedAt);
		item.postedAt_s = new Date(item.postedAt).toLocaleString();
		item.content = item.content.replace(/\\n/g, '<br>');
		item.content = item.content.replace(/\n/g, '<br>');
		item.content = $sce.trustAsHtml(item.content);
		console.log(item);
	};
	announcementFactory.add = function(item) {
		announcementFactory.parse(item);
		announcementFactory.list.push(item);
		angular.element('#content .view-animate').scope().$apply();
	};
	announcementFactory.send = function(event) {
		event.preventDefault();
		var msgTextElem = $(event.target).find('textarea');
		var msgText = msgTextElem.val();
		var username = $rootScope.my_username;
		if (msgText === '') return false;
		var item = {
			author: username,
			messageType: 'Announcement',
			content: msgText,
			postedAt: new Date().toISOString()
		};
		console.log(item);
		socket.emit('announcement', item);
		announcementFactory.add(item);
		msgTextElem.val('');
	};
	announcementFactory.refresh = function(callback){
		$http({
			method: 'GET',
			url: '/announcements/'
		}).then(function successCallback(response) {
			var data = response.data;
			data.forEach(announcementFactory.parse);
			announcementFactory.list = data;
			callback(data);
		}, function errorCallback(response) {
			console.error(response);
		});
	};
	socket.on('announcement', function(item) {
		announcementFactory.add(item);
	});
	return announcementFactory;
});

/* Main Controller */
esnApp.controller('MainCtrl', function($rootScope, $scope, $http, statusType, people) {
	$rootScope.my_username = $('#name').val();
	// Get user profile
	people.refreshMe(function(){
		people.refresh(function() {
			$scope.users = people.list;
			setTimeout(setActiveNavItem, 500);
		});
	});
	$scope.statusTypes = statusType.list;
	socket.on('force logout', function(person) {
		console.log('got force logout');
		console.log(person);
		if (person.username === $rootScope.my_username) {
			toastr.warning("Account changed by Admin. You'll be logged out in 5 seconds.");
			setTimeout(function(){
				$('a.logout').click();
			}, 5000);
		}
	});
});

esnApp.directive('onStatusItemRender', function($rootScope, $http) {
	return function(scope, element, attrs) {
		angular.element(element).children('a').click(function(event) {
			event.preventDefault();
			var username = $('#name').val();
			var lnk = $(event.target);
			if (lnk.prop("tagName") !== 'A')
				lnk = lnk.parents('a');
			var args = {
				statusType: lnk.attr('data-title'),
				updatedAt: new Date().toISOString()
			};
			$rootScope.me.lastStatusCode = lnk.attr('data-title');
			$http({
				method: 'POST',
				url: '/status/' + username,
				data: args
			}).then(function successCallback(res) {
				toastr.success('Status Update succeeded');
				$('#status').text(' (' + args.statusType + ')').removeClass('ng-hide');
			}, function errorCallback(res) {
				toastr.warning('Status Update failed');
			});
			args.username = username;
			socket.emit('shareStatus', args);
		});
	};
});

/* Search Controller */
esnApp.controller('SearchCtrl', function($scope, $http, people, messages) {
	var searchTypes = ['users_username', 'users_statusType', 'announcements', 'publicMessages', 'privateMessages'];
	angular.element('#search_types li').on('click', function(event){
		$scope.result = {};
		searchTypes.forEach(function(target, idx, arr){
			if (target.indexOf('users') >= 0) {
				target = target.substr(0, 5);
			}
			$('div.search_result div.' + target).hide();
		});
		var searchTarget = $(event.target).attr('data-search');
		if (searchTarget === '') return;
		var searchTargets = [searchTarget];
		if (searchTarget === 'all') {
			searchTargets = searchTypes;
		}
		var searchPattern = $('#search_pattern').val();
		searchTargets.forEach(function(target, idx, arr){
			if (target.indexOf('users') >= 0) {
				$scope.result.users = {};
				var criteria = target.substr(6);
				var args = {};
				args[criteria] = searchPattern;
				$http({
					method: 'GET',
					url: '/search/users/',
					params: args
				}).then(function successCallback(res) {
					res.data.forEach(function(item){
						$scope.result.users[item.username] = people.parse(item);
					});
					console.log($scope.result.users);
				}, function errorCallback(res){
					console.error(res);
				});
				$('div.search_result div.users').slideDown();
			}
			else {
				// announcements, public/private msgs
				$scope.result[target] = [];
				$http({
					method: 'GET',
					url: '/search/' + target + '/',
					params: { content: searchPattern }
				}).then(function successCallback(res) {
					res.data.forEach(function(item){
						$scope.result[target].push(messages.parse(item));
					});
					console.log($scope.result[target]);
				}, function errorCallback(res){
					console.error(res);
				});
				$('div.search_result div.' + target).slideDown();
			}
		});
		$('div.search_result').show();
	});
	angular.element('div.search_result').on('click', 'a', function(event){
		$('#search_modal').modal('hide');
	});
});

/* Announcement Controller */
esnApp.controller("AnnouncementCtrl",function($rootScope, $scope, $http, $routeParams, announcement){
	announcement.refresh(function(list){
		$scope.announcements = list;
	});
	$('form.announcement_input').submit(announcement.send);
});

/* Directory Controller */
esnApp.controller('DirectoryCtrl', function ($scope, $http, people) {
	people.refresh(function() {
		$scope.users = people.list;
	});
	angular.element('.view-animate').on('click', '.profile_modal_toggle', function(event) {
		event.preventDefault();
		var lnk = $(event.target);
		if (lnk.prop("tagName") !== 'A')
			lnk = lnk.parents('a');
		var username = lnk.attr('data-user');
		var theUser = people.list[username];
		$scope.targetUser = theUser;
		$('#username_to_edit').text(username);
		$('#newUsername').val(username);
		$('label[for=radio' + theUser.accountStatus + ']').click();
		$('select[name=privilege]').val(theUser.privilege);
	});
	angular.element('form[name="profile"]').submit(function(event) {
		event.preventDefault();
		var updateInfo = {};
		var newUsername = $('#newUsername').val();
		if (newUsername !== $scope.targetUser.username) updateInfo.username = newUsername;
		var newPassword = $('#newPassword').val();
		if (newPassword !== "") updateInfo.password = newPassword;
		var newPrivilege = $('select[name=privilege]').val();
		if (newPrivilege !== $scope.targetUser.privilege) updateInfo.privilege = newPrivilege;
		var newAccountStatus = $('input:radio[name=accountStatus]:checked').val();
		if (newAccountStatus !== $scope.targetUser.accountStatus) updateInfo.accountStatus = newAccountStatus;
		if ($.isEmptyObject(updateInfo)) {
			toastr.success('All changes are up to date.');
			return;
		}
		$http({
			method: 'PUT',
			url: '/user/' + $scope.targetUser.username,
			data: updateInfo
		}).then(function successCallback(res) {
			toastr.success('Update success');
			if (updateInfo.username) {
				delete people.list[$scope.targetUser.username];
				people.list[updateInfo.username] = $scope.targetUser;
				$scope.targetUser.username = updateInfo.username;
			}
			if (updateInfo.privilege) $scope.targetUser.privilege = updateInfo.privilege;
			if (updateInfo.accountStatus) $scope.targetUser.accountStatus = updateInfo.accountStatus;
		}, function errorCallback(res) {
			toastr.error('Update failed');
		});
		$('#profile_modal').modal('hide');
	});
});

/* User Controller */
esnApp.controller('UserCtrl', function ($rootScope, $scope, $routeParams, $http, people) {
	if ($routeParams.username === $rootScope.my_username) {
		people.refreshMe(function(){
			$scope.user = $rootScope.me;
		});
	}
	else {
		$http({
			method: 'GET',
			url: '/user/' + $routeParams.username
		}).then(function successCallback(res) {
			var data = res.data;
			people.parse(data);
			$scope.user = data;
			people.list[$routeParams.username] = data;
		}, function errorCallback(res){
			console.error(res);
		});
	}
});

/* Profile Controller */
esnApp.controller('ProfileCtrl', function ($rootScope, $scope, $routeParams, $http, people) {
	var places = [{
		name: 'CMU-SV B23',
		latitude: 37.410439,
		longitude: -122.059762
	}, {
		name: 'CMU-SV B19',
		latitude: 37.412353,
		longitude: -122.058460
	}, {
		name: 'Village Lake Apartments',
		latitude: 37.4028,
		longitude: -122.0753
	}];

	// Initialization
	people.refresh(function() {
		$scope.users = people.list;
	});

	var updateLocation = function(latitude, longitude) {
		var crdStr = latitude + ", " + longitude;
		$('#coordinate').text(crdStr);
		var match = places.filter(function(place){
			if (Math.abs(place.latitude - latitude) > 0.005) return false;
			if (Math.abs(place.longitude - longitude) > 0.005) return false;
			return true;
		});
		if (match.length > 0) {
			var min_idx = 0;
			var min_diff = Math.abs(match[0].latitude - latitude) + Math.abs(match[0].longitude - longitude);
			for (var i = 1; i < match.length; i++) {
				var diff = Math.abs(match[i].latitude - latitude) + Math.abs(match[i].longitude - longitude);
				if (diff < min_diff) min_idx = i;
			}
			$('#location').val(match[min_idx].name);
		}
	};
	// click handler
	angular.element('form[name="profile"]').on('click', function(event) {
		var target = $(event.target);
		if (target.attr('id') === 'getCoordinate') {
			if (!navigator.geolocation) {
				console.log("Geolocation is not supported by this browser.");
			} else {
				$('#getCoordinate').button('loading'); // change the button's looking
				navigator.geolocation.getCurrentPosition(function(position) {
					updateLocation(position.coords.latitude, position.coords.longitude);
					$('#getCoordinate').button('reset');
				}, function showError(error) {
					switch (error.code) {
						case error.PERMISSION_DENIED:
							toastr.error("You denied the request for getting location.");
							break;
						case error.POSITION_UNAVAILABLE:
							toastr.error("Location information is unavailable.");
							break;
						case error.TIMEOUT:
							toastr.error("The request to get location timed out.");
							break;
						case error.UNKNOWN_ERROR:
							toastr.error("An unknown error occurred.");
							break;
					}
					$('#getCoordinate').button('reset');
				});
			}
		}
		else if (target.attr('id') === 'inputCoordinate') {
			latitude = window.prompt('Latitude?');
			if (latitude === null || latitude === '') return;
			longitude = window.prompt('Longitude?');
			if (longitude === null || longitude === '') return;
			updateLocation(latitude, longitude);
		}
	});

	// submit handler
	angular.element('form[name="profile"]').on('submit', function(event) {
		event.preventDefault();
		var toUpdate = {};
		var val = $('#firstname').val();
		if (val !== $rootScope.me.firstname) toUpdate.firstname = val;
		val = $('#lastname').val();
		if (val !== $rootScope.me.lastname) toUpdate.lastname = val;
		val = $('#location').val();
		if (val !== $rootScope.me.location) toUpdate.location = val;
		val = $('#coordinate').text();
		if (val !== $rootScope.me.coordinate) toUpdate.coordinate = val;
		val = $('#peopleiknow').val();
		val = (val === null)? '': val.join(', ');
		if (val !== $rootScope.me.peopleiknow) toUpdate.peopleiknow = val;
		toUpdate.updatedAt = new Date().toISOString();
		console.log(toUpdate);
		$http.put('/user/' + $rootScope.my_username, toUpdate).then(function successCallback(res){
			for (var i in toUpdate) {
				$rootScope.me[i] = toUpdate[i];
			}
			toastr.success("Changes Saved");
		}, function errorCallback(res){
			console.error(res);
			toastr.error("failed to update");
		});
	});
});

/* Chat Controller */
esnApp.controller('ChatCtrl', function ($rootScope, $scope, $http, $routeParams, messages) {
	$scope.target = $routeParams.target;
	$('a[href="#/chat/'+ $routeParams.target + '"]').children('.badge').text('');
	if ($scope.target === 'public') {
		$scope.msgs = messages.publicMsgs;
		if ($scope.msgs.length === 0) {
			// Get previous messages
			messages.refresh(null, function(publicMsgs) {
				$scope.msgs = publicMsgs;
			});
		}
	}
	else {
		$scope.msgs = messages.privateMsgs[$scope.target];
		if (!$scope.msgs) {
			messages.refresh($scope.target, function(privateMsgs) {
				$scope.msgs = messages.privateMsgs[$scope.target];
			});
		}
	}
	$('form.msg_input').submit(messages.send);
});

$('a.logout').click(function(event) {
	event.preventDefault();
	var usrObj = { username: $('#name').val() };
	socket.emit('logout', usrObj);
	var logoutForm = $('<form method="post">').attr('action', '/user/logout/');
	logoutForm.append($('<input type="hidden" name="logoutTime">').val(new Date().toISOString()));
	logoutForm.appendTo('body').submit();
});

