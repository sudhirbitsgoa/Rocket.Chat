Meteor.methods({
	getContacts() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getContacts' });
		}

		const contactsFinal = RocketChat.models.Contacts.findByUserId(Meteor.userId());
		let contacts = [];
		console.log('the contacts final', contactsFinal);
		if (!contactsFinal) { // no contacts for the user
			return [];
		}
		contacts = contacts.concat(contactsFinal.contacts);

		const users = RocketChat.models.Users.findByIds(contacts).fetch();
		for (let i = users.length - 1; i >= 0; i--) {
			delete users[i].services;
			delete users[i].settings;
		}
		contactsFinal.users = users;
		return contactsFinal;
	},
});
