/* Switch layout between "Sign up" and "Log in" */
function switchToLogin(speed){
	duration = (speed === "fast")? 0: 400;
	$('#submit .glyphicon').removeClass('glyphicon-user').addClass('glyphicon-log-in');
	$('#submit span:last-child').text("Log in");
	$('h2.hint').text("Log in");
	$('.hint div.signup').slideDown(duration);
	$('.hint div.login').slideUp(duration);
	$('div.form-group.signup').slideUp(duration);
}

function switchToSignup(speed){
	duration = (speed === "fast")? 0: 400;
	$('#submit .glyphicon').removeClass('glyphicon-log-in').addClass('glyphicon-user');
	$('#submit span:last-child').text("Sign up");
	$('h2.hint').text("Sign up");
	$('.hint div.signup').slideUp(duration);
	$('.hint div.login').slideDown(duration);
	$('div.form-group.signup').slideDown(duration);
}
/* Smoothly display the page */
setTimeout(function(){ $('body').fadeIn(); }, 100);

$(window).on('hashchange', function() {
	if (window.location.hash === "#login") {
		switchToLogin();
	}
	else if (window.location.hash === "#signup") {
		switchToSignup();
	}
});

/* Check hash to decide whether to switch to "Log in" page */
if (window.location.hash !== "#signup") {
	switchToLogin("fast");
}

/* Clear the alert-info section after 10 seconds */
setTimeout(function(){ $('div.alert-info').fadeOut(); }, 10000);

/* Toastr component configuration */
toastr.options = {
	closeButton: true,
	timeOut: 8000, // fade out in 8 seconds
	positionClass: "toast-bottom-full-width"
};

/* Extract message from server to toastr */
if ($('.error_msg').text() !== "") {
	toastr.error($('.error_msg').html());
	$('.error_msg').html('');
}

/* Log in or Sign up button handler */
$('#submit').click(function(event){
	event.preventDefault();
	$('.error_msg').hide();
	$('#submit').button('loading'); // change the button's looking
	var errmsg = false;
	// validate username length
	var username = $('#username').val().trim();
	if (username.length < 4 || username.length > 12) {
		errmsg = "Username must be of minimum length 4, and maximum length 12!";
		toastr.error($('.error_msg').html(errmsg).html());
		$('#username').focus();
		$('#submit').button('reset');
		return;
	}
	// validate username pattern
	var username_ptn = /^[A-Za-z]([\w\-\.])*[A-Za-z0-9]$/;
	if (!username.match(username_ptn)){
		errmsg = "Username must";
		var ul = $('<ul>');
		$('<li>').text('be of minimum length 4, and maximum length 12').appendTo(ul);
		$('<li>').text('contains only alphabets, numbers, or symbols including . _ -').appendTo(ul);
		$('<li>').text('start with an alphabet').appendTo(ul);
		$('<li>').text('end with an alphabet or a number').appendTo(ul);
		$('#username').focus();
		toastr.error($('.error_msg').html(errmsg).append(ul).html());
		$('#submit').button('reset');
		return;
	}
	// validate password
	var password = $('#password').val();
	if (password === "") {
		errmsg = "Password cannot be empty.";
		toastr.error($('.error_msg').html(errmsg).html());
		$('#submit').button('reset');
		return;
	}
	/* try logging in */
	var args = {password: password, lastLoginAt: new Date().toISOString()};
	$.ajax({
		url: '/user/login/' + username,
		method: 'POST',
		data: args,
		success: function() {
			// Redirect to Main Page
			window.location.assign('/home');
		},
		error: function(xhr, textStatus, errorThrown) {
			var resbody = $.parseJSON(xhr.responseText);
			var errmsg = false;
			if (xhr.status == 401) {
				// errmsg for signing up
				errmsg = 'User "' + username + '" exists. Please try another username.';
				if (window.location.hash !== "#signup") {
					// errmsg for logging in
					errmsg = "Unable to login using the username and password. Please try again.";
				}
			}
			else if (xhr.status != 404) {
				// any error except user not found
				errmsg = resbody.desc.join('<br>');
			}
			else if (window.location.hash !== "#signup") {
				// user not found and currently at "log in" layout
				var signup_link = '<strong><a class="alert-link" href="#signup">Sign up</a></strong>';
				errmsg = 'This username does not exist. Do you want to ' + signup_link + '?';
			}
			else {
				/* try sign up */
				// validate passwords
				var password2 = $('#password2').val();
				if (password !== password2) {
					errmsg = "Passwords are different! Please input passwords again.";
					$('#password').focus();
				}
				else if (password.length < 5 || password.length > 30) {
					errmsg = "Password must be of minimum length 5, and maximum length 30!";
					$('#password').focus();
				}
			}
			if (errmsg) {
				// if errmsg is set, display errmsg and stop signing up
				toastr.error($('.error_msg').html(errmsg).html());
				$('#submit').button('reset');
				return;
			}
			args.createdAt = new Date().toISOString();
			$.ajax({
				url: '/user/signup/' + username,
				method: 'POST',
				data: args,
				success: function(){
					// Redirect to Main Page
					console.log("sadasdasd");
					window.location.assign('/uploadPicture');
					//window.location.assign('/home');
				},
				error: function(xhr, textStatus, errorThrown) {
					var resbody = $.parseJSON(xhr.responseText);
					var errmsg = "Something went wrong... Please try again.";
					if (xhr.status == 403) {
						errmsg = "This username exists. Please try another username.";
						$('#username').focus();
					}
					else {
						errmsg = resbody.desc.join('<br>');
					}

					toastr.error($('.error_msg').html(errmsg).html());
					$('#submit').button('reset');
				}
			});
		}
	});
});
