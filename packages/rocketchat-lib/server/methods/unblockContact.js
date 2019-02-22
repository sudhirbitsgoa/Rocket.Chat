Meteor.methods({
	unblockContacts(uIds) {
		check(uIds, [String]);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unblockContact' });
		}
		RocketChat.models.Contacts.removeBlockContacts(Meteor.userId(), uIds);
		return true;
	},
});
