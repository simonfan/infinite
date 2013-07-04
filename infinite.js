define(['jquery','backbone','underscore','_.mixins'],
function(   $   , Backbone , undef      , undef      ) {

	Backbone.Infinite = Backbone.View.extend({
		tagName: 'ul',
		className: 'infinite-list',

		initialize: function(options) {
			_.interface(options, {
				id: 'Backbone.Infinite View initialize',
				typeofs: {
					item: {
						view: ['function','undefined'],
						template: ['function','undefined']
					},

					collection: ['function','object','undefined'],
					url: ['string','undefined'],
					datasource: ['object', 'function', 'undefined'],

					$frame: ['object','undefined'],
					$el: ['object','undefined'],

					initialpage: ['number','undefined'],

					itemHtmlParser: ['function','undefined'],

					triggerdistance: ['number', 'undefined']
				}
			});

			_.bindAll(this);

			// item
			this.item = options.item;
			this.itemHtmlParser = options.itemHtmlParser;

			// datasource
			this.datasource = options.datasource || {};

			// trigger distance
			this.triggerdistance = options.triggerdistance || 200;

			// collection
			if (!options.collection) {
				this.collection = new Backbone.Collection([], {
					model: Backbone.Model,
					url: options.url
				});
			} else {
				this.collection = typeof options.collection === 'object' ? options.collection : new options.collection();
			}

			// frame and container
			this.$frame = options.$frame || $(window);

			// paging
			this.page = options.initialpage || 1;

			this._build();

			// start things up
			this._fillUpFrame();
		},

		// loads data if the height is not yet enough to reach the bottom of the frame.
		_fillUpFrame: function() {
			var elH = this.$el.height(),
				frameH = this.$frame.height();

			console.log(elH, frameH)

			if (elH < frameH) {
				this.request();
			}
		},

		_build: function() {
			this._setupEvents();

			// if there are li items to be parsed and there is an itemHtmlParser function
			// do the parsing
			if (this.$el.find('li').length > 0 && typeof this.itemHtmlParser === 'function') {
				this._parseHtmlIntoCollection();
			}

			// build the frame
			this._buildFrame();

			// build the $ul
			this._buildUl();
		},

		_parseHtmlIntoCollection: function() {
			var _this = this;

			_.each(this.$el.children('li'), function(el, index) {
				var $el = $(el),
					modeldata = _this.itemHtmlParser($el);

				console.log(modeldata);

				_this.collection.add(modeldata, { silent: true });
			});
		},

		// sets the styles for the frame element
		_buildFrame: function() {
			this.$frame.css({ overflow: 'auto' });
		},

		// builds the $ul
		_buildUl: function() {
			this.$clearfix = $('<li class="clearfix" style="float: none; clear: both; height: 0; overflow: hidden;"></li>');

			// append the list to the frame object
			this.$el
				.append(this.$clearfix)
				.appendTo(this.$frame);
		},

		_setupEvents: function() {

			// collection events
			this.listenTo(this.collection, 'add', this._add);

			// scroll event
			this.$frame.scroll(this._handleScroll);
		},


		// builds item view and adds to display
		_add: function(model) {
			var item = this.item.view ? new this.item.view({ model: model }).el : this.item.template( model.attributes );

			$(item).insertBefore(this.$clearfix);
		},



		// handle scrolling
		_handleScroll: function(e) {
			var listH = this.$el.height(),
				scrolled = this.$frame.scrollTop(),
				frameH = this.$frame.height(),
				bottom = listH - scrolled - frameH;
/*
			console.log('listH:' + listH)
			console.log('scrolled:' + scrolled);
			console.log('bottom:' + bottom);
*/
			if (bottom < this.triggerdistance) {
				this.trigger('near-bottom');

				this.request();
			}
		},




		// request handling
		// request response handling
		_requestSent: function(xhr) {
			console.log(xhr);

			// set this request's status as 'sent',
			this.isLoading = true;

			this.trigger('request-sent', xhr);
		},

		_requestDone: function(data, textStatus, jqXHR) {

			// change the request status
			this.isLoading = false;

			this._fillUpFrame();	
			this.page += 1;

			this.trigger('request-done', data, textStatus, jqXHR);
		},

		_requestFail: function(jqXHR, textStatus, errorThrown) {
			this.trigger('request-fail', jqXHR, textStatus, errorThrown);
		},

		_requestAlways: function(data_jqXHR, textStatus, jqXHR_errorThrown) {
			this.trigger('request-always', data_jqXHR, textStatus, jqXHR_errorThrown);
		},

		///////////////////
		/////// API ///////
		///////////////////

		// request next page
		request: function() {
			if (this.isLoading) { return; }

			var _this = this,
				internalData = {
					count: this.collection.length,
					page: this.page,
				},
				externalData = typeof this.datasource === 'function' ? this.datasource(internalData) : this.datasource,
	
				options = {
					beforeSend: this._requestSent,
					data: _.extend( internalData, externalData),

					// backbone set option:
					remove: false,
				};

			this.collection
				.fetch(options)
				.done(this._requestDone)
				.fail(this._requestFail)
				.always(this._requestAlways);
		},

	});
});