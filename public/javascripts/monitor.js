esnApp.controller('MeasurePerformanceCtrl', function ($rootScope, $scope, $http, messages) {
	$scope.req_rate = 5; // 5 GET and 5 POST per second
	$scope.msg_len = 20; // 20 characters per message
	$scope.done = false;
	$scope.result = {};
	$scope.result.get_success = 0;
	$scope.result.get_failure = 0;
	$scope.result.post_success = 0;
	$scope.result.post_failure = 0;
	var charSource = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'/?!@#$%^&*()_+-";
	var randomString = function(len){
		str = "";
		while (len > 0) {
			str += charSource[Math.round(Math.random() * (charSource.length - 1))];
			len -= 1;
		}
		return str;
	};
	var updateProgress = function(){
		if ($scope.done) return true;
		var now = Date.now();
		if (now > $scope.test_end) {
			stopTest();
		}
		var used_sec = Math.round((now - $scope.test_start) / 1000);
		var total_sec = $scope.test_duration / 1000;
		var percent = 100.0 * used_sec / total_sec;
		percent += '%';
		$('#test_progress').css('width', percent).text(used_sec + '/' + total_sec);
	};
	var sendGetReq = function(){
		updateProgress();
		if ($scope.done) return;
		$http({
			method: 'GET',
			url: '/messages/wall'
		}).then(function successCallback(){
			$scope.result.get_success += 1;
			setTimeout(sendGetReq, 0);
		}, function errorCallback(){
			$scope.result.get_failure += 1;
			setTimeout(sendGetReq, 0);
		});
	};
	var sendPostReq = function(){
		updateProgress();
		if ($scope.done) return;
		var postMessageRequest = {
			content: randomString($scope.msg_len),
			postedAt: new Date().toISOString()
		};
		$http({
			method: 'POST',
			url: '/messages/wall',
			data: postMessageRequest
		}).then(function successCallback(){
			$scope.result.post_success += 1;
			setTimeout(sendPostReq, 0);
		}, function errorCallback(){
			$scope.result.post_failure += 1;
			setTimeout(sendPostReq, 0);
		});
	};
	var startTest = function(){
		$scope.test_start = Date.now();
		$scope.test_duration = parseInt($('#test_duration').val()) * 1000;
		if (isNaN($scope.test_duration)) {
			$scope.test_duration = 10000;
			console.log("Use system default test duration: 10 seconds");
		}
		$scope.test_end = Date.now() + $scope.test_duration;
		console.log('start: ' + $scope.test_start);
		console.log('duration: ' + $scope.test_duration);
		console.log('end: ' + $scope.test_end);
		$scope.done = false;
		$scope.result.get_success = 0;
		$scope.result.get_failure = 0;
		$scope.result.post_success = 0;
		$scope.result.post_failure = 0;
		for (var i = 0; i < $scope.req_rate; i += 1) {
			setTimeout(sendGetReq, 1000 * i / $scope.req_rate);
			setTimeout(sendPostReq, 1000 * i / $scope.req_rate);
		}
	};
	var stopTest = function(){
		$scope.done = true;
		$.ajax({
			url: '/admin/test/stop',
			method: 'POST',
			success: function(data){
			},
			error: function(xhr, textStatus, err){
				toastr.error('Failed to stop test.');
				console.error(err);
			}
		});
	};
	angular.element('form.measure_performance').submit(function(){
		$.ajax({
			url: '/admin/test/start',
			method: 'POST',
			success: function(data){
				setTimeout(startTest, 0);
			},
			error: function(xhr, textStatus, err){
				toastr.error('Failed to start test.');
				console.error(err);
			}
		});
	});
	angular.element('#end_test_btn').click(function(){
		stopTest();
	});
});
