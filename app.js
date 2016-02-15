var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');

var express = require('express');
var app = express();
var http = require('http');
var passport = require('passport');
var socketio = require('socket.io');
var stylus = require('stylus');
var nib = require('nib');

var restAPI = require('./routes/rest');
var socketCtrl = require('./routes/socketio');
var dbInit = require('./models/DB_Init');


function startServer(port, errorHandler, ready) {
	//generate the sqlite and create tables needed
	dbInit.createUserInfoTable(function(result){ });
	dbInit.createMessageInfoTable(function(result){ });
    dbInit.createStatusCrumbTable(function(result){ });

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.locals.pretty = true;
	app.use(flash());
	app.use(stylus.middleware({
		src: path.join(__dirname, 'public'),
		compile: function(str, path) {
			return stylus(str).set('filename', path).use(nib());
		}
	}));

	// uncomment after placing your favicon in /public
	//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
	app.use(logger('dev'));
	app.use(session({ secret: 'sredoC-laicoS-2AS-CoNSS-51F-ESF', resave: false, saveUninitialized: false }));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));

	// routes (controllers)
	restAPI(app);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handlers
	app.set('env', 'development');

	if (app.get('env') === 'development') {
		// development error handler
		// will print stacktrace
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				title: err.message,
				error: err.stack
			});
		});
	}
	else {
		// production error handler
		// no stacktraces leaked to user
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				title: err.message,
			});
		});
	}

	var server = http.createServer(app);
	// Listen on provided port, on all network interfaces.
	server.listen(port);

	server.on('error', errorHandler);
	server.on('listening', function() {
		var addr = server.address();
		var bind = typeof addr === 'string'? 'pipe ' + addr
			: 'port ' + addr.port;
		console.log('Listening on ' + bind);
		if (ready) ready();
	});
	var io = socketio(server);
	socketCtrl.startSocket(io);
}

module.exports.startServer = startServer;

// when directly executed
if (require.main === module) {
	console.info('NOTE: Please use `npm start` to start the server.');
	startServer(5000, function(error) {
		throw error;
	});
}
