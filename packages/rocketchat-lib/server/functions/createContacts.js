/* globals Gravatar */
import _ from 'underscore';
import s from 'underscore.string';

RocketChat.createContacts = function(userId, usersData) {
	console.log('the bulk save user method');
	return RocketChat.models.Contacts.addImportIds(userId, usersData);
};
