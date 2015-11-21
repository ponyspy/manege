var express = require('express');

var Model = require(__app_root + '/models/main.js');

var Params = {
	locale: require('../_params/locale')
};

var partners = {
	list: require('./list.js')(Model),
	add: require('./add.js')(Model, Params),
	edit: require('./edit.js')(Model, Params),
	remove: require('./remove.js')(Model)
};

module.exports = (function() {
	var router = express.Router();

	router.route('/')
		.get(partners.list.index);

	router.route('/add')
		.get(partners.add.index)
		.post(partners.add.form);

	router.route('/edit/:id')
		.get(partners.edit.index)
		.post(partners.edit.form);

	router.route('/remove')
		.post(partners.remove.index);

	return router;
})();