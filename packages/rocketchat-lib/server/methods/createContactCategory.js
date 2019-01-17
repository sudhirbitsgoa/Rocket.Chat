Meteor.methods({
	createContactCategory(category, members) {
		console.log('the members %j', members);
		check(name, String);
		check(members, {
			add: Match.Optional([String]),
			remove: Match.Optional([String]),
		});
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}
		return RocketChat.models.ContactCategory.addContactIds(Meteor.userId(), members, category);
	},
});
