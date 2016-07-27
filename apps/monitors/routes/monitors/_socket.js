var jade = require('jade');
var mongoose = require('mongoose');
var moment = require('moment');

var Model = require(__app_root + '/models/main.js');

var Query = {
	News: require('./queries/news.js').News,
	Events: require('./queries/events.js').Events
}

module.exports = function(io, i18n) {
	var module = {};
	var Event = Model.Event;
	var Area = Model.Area;

	var get_areas = function(ids, callback) {

		var date_now = moment().toDate();
		// var date_last_of_month = moment().endOf('month').toDate();

		Query.Events(date_now, ids, function(err, areas) {
			var paths = [
				{path:'complex', select: 'type price _id', model: 'Ticket'},
				{path:'events.halls', select: 'title', model: 'Hall'},
				{path:'events.categorys', select: 'title', model: 'Category'},
				{path:'events.members.ids', select: 'name', model: 'Member'},
				{path:'events.tickets.ids', select: 'type price _id', model: 'Ticket'},
			];

			Event.populate(areas, paths, function(err, areas) {
				Area.populate(areas, {path: 'area', model: 'Area'}, function(err, areas) {
					callback(null, areas);
				});
			});
		});
	};

	var areas_compile = function(areas, callback) {
		var get_locale = function(option, lang) {
			return ((option.filter(function(locale) {
				return locale.lg == lang;
			})[0] || {}).value || '');
		};

		var arr_equals = function(arr1, arr2) {
			return arr1.sort().toString() === arr2.sort().toString();
		};

		var i18n_locale = function() {
			return i18n.__.apply(null, arguments);
		};

		var i18n_plurals_locale = function() {
			return i18n.__n.apply(null, arguments);
		};

		var opts = {
			areas: areas,
			arr_equals: arr_equals,
			get_locale: get_locale,
			__: i18n_locale,
			__n:i18n_plurals_locale,
			i18n: i18n,
			moment: moment,
			compileDebug: false, debug: false, cache: false, pretty: false
		};

		callback(null, jade.renderFile(__app_root + '/apps/monitors/views/monitor/monitor.jade', opts));
	};

	module.get = function(socket) {
		var area_id = socket.handshake.query.area;
		socket.join(area_id);

		get_areas(area_id, function(err, areas) {
			if (areas.length > 0 && areas[0].events && areas[0].events.length > 6) {
				areas_compile(areas, function(err, compile) {
					io.to(area_id).emit('events', { areas: compile, status: 'start' });
				});
			} else {
				get_areas('all', function(err, areas) {
					areas_compile(areas, function(err, compile) {
						io.to(area_id).emit('events', { areas: compile, status: 'start' });
					});
				});
			}
		});


		socket.on('update', function(data) {
			get_areas(area_id, function(err, areas) {
				if (areas.length > 0 && areas[0].events && areas[0].events.length > 6) {
					areas_compile(areas, function(err, compile) {
						io.to(area_id).emit('events', { areas: compile, status: data.status });
					});
				} else {
					get_areas('all', function(err, areas) {
						areas_compile(areas, function(err, compile) {
							io.to(area_id).emit('events', { areas: compile, status: data.status });
						});
					});
				}
			});
		});

		socket.on('disconnect', function(data) {
			socket.leave(area_id);
		});

		socket.on('reload', function(data) {
			io.emit('push_reload');
		});
	};

	module.interval = function() {
		var rooms = Object.keys(io.sockets.adapter.rooms);
		// console.log('Connections: ' + io.engine.clientsCount);
		// console.log('Rooms: ' + Object.keys(io.sockets.adapter.rooms));

		get_areas('all', function(err, areas_all) {
			get_areas(rooms, function(err, areas_rooms) {
				if (areas_rooms && areas_rooms.length > 0) {
					areas_rooms.forEach(function(area) {
						var room_id = area.area._id.toString();
						var check_rooms = rooms.some(function(c_room) {
							return c_room == room_id;
						});

						if (check_rooms && area.events && area.events.length > 6) {
							areas_compile([area], function(err, compile) {
								io.to(room_id).emit('events', { areas: compile, status: 'update' });
							});
						}
						else {
							areas_compile(areas_all, function(err, compile) {
								io.to(room_id).emit('events', { areas: compile, status: 'update' });
							});
						}
					});
				}
			});
		});
	};


	return module;
};