var express = require('express');

var Model = require(__app_root + '/models/main.js');

var Params = {
	locale: require('../_params/locale'),
	upload: require('../_params/upload')
};

var tickets = require('../tickets/_tickets.js');
var program = require('../program/_program.js');


var events = {
	list: require('./list.js')(Model),
	add: require('./add.js')(Model, Params),
	edit: require('./edit.js')(Model, Params),
	remove: require('./remove.js')(Model),
	tuzik: require('./tuzik.js')(Model),
};

module.exports = (function() {
	var router = express.Router();

	router.route('/')
		.get(events.list.index)
		.post(events.list.get_list);

	router.route('/add')
		.get(events.add.index)
		.post(events.add.form);

	router.route('/edit/:event_id')
		.get(events.edit.index)
		.post(events.edit.form);

	router.use('/edit/:event_id/tickets', tickets);
	router.use('/edit/:event_id/program', program);

	router.route('/remove')
		.post(events.remove.index);

	router.route('/tuzik')
		.post(events.tuzik.index);

	return router;
})();