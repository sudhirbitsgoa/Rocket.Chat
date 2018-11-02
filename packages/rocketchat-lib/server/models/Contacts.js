
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
		const model = this.model.rawCollection();
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
		return model.findOne(query)
			.then(cont => {
				if (cont) {
					return model.update(query, update);
				}
				let newCont = {
					u: {
						_id: userId
					},
					contacts: userIds
				};
				return model.insert(newCont);
			});
	}
}
RocketChat.models.Contacts = new ModelContacts('contacts', true);
