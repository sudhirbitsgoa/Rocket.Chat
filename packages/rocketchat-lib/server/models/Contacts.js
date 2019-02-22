
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

    // find all contacts
    findAllByUserId(uId) {
    	const query = {
    		'u._id' : uId
    	}
    	return this.find(query, {_id:1});
    }

    contactsCount(uId) {
    	const query = {
    		'u._id': uId
    	};
    	return this.find(query).count();
    }

	// UPDATE
	addUsersToContacts(userId, userIds) {
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

	addUsersToBlockContacts(userId, userIds) {
		const model = this.model.rawCollection();
        userIds = [].concat(userIds);

        const query = {
			'u._id': userId
		};
		const update = {
			$addToSet: {
				block_contacts: {
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
					block_contacts: userIds
				};
				return model.insert(newCont);
			});
	}

	removeBlockContacts(userId, userIds) {
		const model = this.model.rawCollection();
        userIds = [].concat(userIds);

        const query = {
			'u._id': userId
		};
		const update = {
			$pull: {
				block_contacts: {
					$in: userIds,
				},
			},
		};
		return model.update(query, update);
	}
}
RocketChat.models.Contacts = new ModelContacts('contacts', true);
