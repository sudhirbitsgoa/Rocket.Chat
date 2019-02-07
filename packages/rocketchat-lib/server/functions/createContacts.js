RocketChat.createContacts = function(userId, userIds) {
	return RocketChat.models.Contacts.addUsersToContacts(userId, userIds);
};
