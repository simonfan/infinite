define(['jquery','backbone','infinite'],
function(  $    , Backbone , Infinite ) {


	var Tweets = Backbone.Collection.extend({
		model: Backbone.Model,
		url: function () {
			return 'http://search.twitter.com/search.json?&callback=?'
		},
		// Because twitter doesn't return an array of models by default we need
		// to point Backbone.js at the correct property
		parse: function(resp, xhr) {
			return resp.results;
		},
	});


	window.tweets = new Tweets();
	window.infinite = new Backbone.Infinite({
		item: {
			template: function(tweet) {
				return '<li>' + tweet.text + '</li>';
			}
		},
		collection: tweets,
		datasource: {
			q: 'party'
		},

		el: $('#infinite'),

		$frame: $('#infinite-frame'),

		itemHtmlParser: function($el) {
			console.log($el.prop('id'))

			return {
				id: $el.prop('id'),
				text: $el.html()
			};
		},
	});
});