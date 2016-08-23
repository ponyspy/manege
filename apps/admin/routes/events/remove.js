var rimraf = require('rimraf');
var async = require('async');

module.exports = function(Model) {
	var module = {};

	var Event = Model.Event;
	var Ticket = Model.Ticket;


	module.index = function(req, res, next) {
		var id = req.body.id;

		async.waterfall([
			function(callback) {
				Event.findByIdAndRemove(id).exec(callback);
			},
			function(result, callback) {
				Event.distinct('_id', {'program.parent': id}).exec(callback);
			},
			function(ids, callback) {
				Ticket.find({'events': { $in: ids.reduce(function(memo, id) { memo.push(id.toString()); return memo; }, [id]) } }).exec(callback);
			},
			function(tickets, callback) {
				async.reduce(tickets, [], function(del_tickets, ticket, callback_reduce) {
					ticket.events.pull(id);

					if (ticket.events.length === 0) {
						del_tickets.push(ticket._id);
					}

					ticket.save(function(err) {
						callback_reduce(err, del_tickets);
					});
				}, callback);
			},
			function(del_tickets, callback) {
				Ticket.remove({'_id': { '$in': del_tickets } }).exec(callback);
			},
			function(result, callback) {
				Event.remove({'program.parent': id}).exec(callback);
			},
			function(result, callback) {
				Event.update({'program.children': id}, { '$pull': { 'program.children': id } }, { multi: true }).exec(callback);
			},
			function(result, callback) {
				rimraf(__app_root + '/public/cdn/images/events/' + id, { glob: false }, callback);
			}
		], function(err) {
			if (err) return next(err);

			res.send('ok');
		});
	};


	return module;
};