global.__app_root = __dirname.replace('/app', '');

var express = require('express'),
		cookieParser = require('cookie-parser'),
		app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

var i18n = require('i18n');
var moment = require('moment');

app.set('views', __app_root + '/views');
app.set('view engine', 'jade');

if (process.env.NODE_ENV != 'production') {
	app.use(express.static(__app_root + '/public'));
	app.locals.pretty = true;
	app.set('json spaces', 2);
}

i18n.configure({
	locales: ['ru', 'en'],
	defaultLocale: 'ru',
	cookie: 'locale',
	directory: __app_root + '/locales'
});

app.use(cookieParser());
app.use(i18n.init);
app.locals.moment = moment;

app.use(function(req, res, next) {
	res.locals.session = req.session;
	res.locals.host = req.hostname;
	res.locals.url = req.originalUrl;
	res.locals.locale = req.cookies.locale || 'ru';
	req.locale = req.cookies.locale || 'ru';
	next();
});


var globals = require('../routes/globals/_globals.js');
var monitors = require('../routes/monitors/_monitors.js');
var socket = require('../routes/monitors/_socket.js')(io, i18n);


app.use('/', monitors);
app.use(globals);

io.on('connection', socket.get);

var check_interval = setInterval(socket.interval, 1000 * 60 * 5);	// 5 minutes 1000 * 60 * 5


// ------------------------
// *** Connect server Block ***
// ------------------------


server.listen(process.env.PORT || 3002);
console.log('http://127.0.0.1:3002')