Meteor.methods({
	addRocketChatUsersAsContact(members) {
		console.log('the members %j', members);
		check(members, [String]);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		return RocketChat.models.Contacts.addUsersToContacts(Meteor.userId(), members);
	},
});
