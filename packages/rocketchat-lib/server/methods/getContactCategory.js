Meteor.methods({
	getContactCategory() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		const contactCategory = RocketChat.models.ContactCategory.findAllByUserId(Meteor.userId());
		let contacts = [];
		for(let i=0; i<contactCategory.length; i++) {
			contacts = contacts.concat(contactCategory[i].contacts);
		}

		const users = RocketChat.models.Users.findByIds(contacts).fetch();

		const usersHash = {};
		for(let i=0; i<users.length; i++) {
			const user = users[i];
			usersHash[user._id] = user;
		}
		for(let i=0; i<contactCategory.length; i++) {
			const userIds = contactCategory[i].contacts;
			contactCategory[i].users = [];
			userIds.forEach(uId => {
				contactCategory[i].users.push(usersHash[uId]);
			});
		}
		return contactCategory;
	},
});
