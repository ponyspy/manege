$(document).ready(function() {

	var socket = null;

	var slider_opts = {
			speed: 600,
			manualSpeed: 600,
			fx: 'scrollHorz',   //flipHorz, scrollHorz
			timeout: 4000,
			// paused: true,
			autoHeight: false,
			manualTrump: false,
			slides: '> .flip_item',
			log: false
	};

	$('.flip_block').cycle(slider_opts);


	// Slides Block


	$('.play').on('click', function() {
		$('.flip_block').cycle('resume');
	});

	$('.pause').on('click', function() {
		$('.flip_block').cycle('pause');
	});

	$('.back').on('click', function() {
		$('.flip_block').cycle('prev');
	});

	$('.next').on('click', function() {
		$('.flip_block').cycle('next');
	});


	// Connect Block


	$('.update').on('click', function() {
		socket.emit('update', { status: 'update' });
	});


	$('.reload').on('click', function() {
		socket.emit('reload', { my: 'data' });
	});


	$('.connect').on('click', function() {
		if (socket) {
			socket.disconnect();
			$('.flip_block').cycle('destroy').empty().cycle(slider_opts);
			socket = null;
		}

		socket = io.connect('', {
			port: 3002,
			forceNew: true,
			query: {
				area: $('.area_select').val()
			}
		});


		socket.on('events', function (data) {
			var $flips = null;

			if (data.status == 'update') {
				$flips = $(data.events).addClass('new');
			} else {
				$flips = $(data.events);
			}

			$('.flip_block').children('.flip_item').addClass('old').end()
											.cycle('add', $flips).on('cycle-after', removeOld);
		});

		socket.on('push_reload', function (data) {
			location.reload();
		});
	});


	// Slider Block


	var removeOld = function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
		if ($(incomingSlideEl).hasClass('new')) {
			$('.flip_block').cycle('destroy')
											.children('.old').remove().end()
											.children('.new').removeClass('new').end()
											.cycle(slider_opts)
											.off('cycle-after');
		}
	};


});