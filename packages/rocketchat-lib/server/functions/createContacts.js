RocketChat.createContacts = function(userId, usersData) {
	return RocketChat.models.Contacts.addImportIds(userId, usersData);
};
