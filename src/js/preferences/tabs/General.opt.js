define([], function() {
	var Model = Backbone.Model.extend({
		defaults: {
			enableSyncScroll: true,
			playKeypressSound: false,
			enableAutoComplete: false,
			enableLastFileRestore: true,
			displayLanguage: window.navigator.language.toLowerCase(),
			dateFormat: 'LLL'
		},

		initialize: function() {
			var opt = localStorage.getItem('General');

			this.bind('change', function() {
				store.set('General', this.toJSON());
			});

			if (opt) {
				this.set(JSON.parse(opt));
			} else {
				this.set(this.defaults);
				store.set('General', this.toJSON());
			}
		}
	});

	return new Model();
});