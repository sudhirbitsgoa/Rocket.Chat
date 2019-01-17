import _ from 'underscore';

Meteor.publish('userAutocomplete', function(selector) {
	if (!this.userId) {
		return this.ready();
	}

	if (!_.isObject(selector)) {
		return this.ready();
	}

	const options = {
		fields: {
			name: 1,
			username: 1,
			status: 1,
		},
		sort: {
			username: 1,
		},
		limit: 10,
	};

	const pub = this;
	const exceptions = selector.exceptions || [];
	const contactIds = RocketChat.models.Contacts.findAllByUserId(this.userId)
		.map((cont) => cont._id);

	// should restrict the scope with in contacts
	const cursorHandle = RocketChat.models.Users.findActiveByUsernameOrNameRegexWithExceptions(selector.term, exceptions, options, contactIds).observeChanges({
		added(_id, record) {
			return pub.added('autocompleteRecords', _id, record);
		},
		changed(_id, record) {
			return pub.changed('autocompleteRecords', _id, record);
		},
		removed(_id, record) {
			return pub.removed('autocompleteRecords', _id, record);
		},
	});

	this.ready();

	this.onStop(function() {
		return cursorHandle.stop();
	});
});
