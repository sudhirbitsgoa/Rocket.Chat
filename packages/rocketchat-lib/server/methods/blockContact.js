Meteor.methods({
	blockContacts(uIds) {
		check(uIds, [String]);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockContact' });
		}
		RocketChat.models.Contacts.addUsersToBlockContacts(Meteor.userId(), uIds);
		return true;
	},
});
