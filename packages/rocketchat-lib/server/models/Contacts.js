
class ModelContacts extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
        this.tryEnsureIndex({ 'u._id': 1 });
        this.tryEnsureIndex({ contacts: 1 });
	}

    // FIND
    findByUserId(userId) {
        const query = {
			'u._id': userId,
		};
        return this.findOne(query);
    }

	// UPDATE
	addImportIds(userId, userIds) {
		console.log('the userids to insert', userIds);
        userIds = [].concat(userIds);

        const query = {
			'u._id': userId
		};
		const update = {
			$addToSet: {
				contacts: {
					$each: userIds,
				},
			},
		};
		console.log('the query %j', update);
		return this.update(query, update)
		.catch(err => console.log('the err %j', err))
	}
}
RocketChat.models.Contacts = new ModelContacts('contacts', true);
