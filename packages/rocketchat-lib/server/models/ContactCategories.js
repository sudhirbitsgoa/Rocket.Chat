class ModelContactCategories extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({
			'u._id': 1,
			category: 1,
		});
		this.tryEnsureIndex({
			contacts: 1,
		});
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
			'u._id': uId,
		};
		return this.find(query, {
			_id: 1,
		});
	}

	contactsCount(uId) {
		const query = {
			'u._id': uId,
		};
		return this.find(query).count();
	}

	// UPDATE
	addContactIds(userId, members, category) {
		console.log('the userids to insert', members.add);
		const model = this.model.rawCollection();
		const userIds = [].concat(members.add);
		const memToRemove = [].concat(members.remove);
		const query = {
			'u._id': userId,
			category,
		};
		const update = {
			$addToSet: {
				contacts: {
					$each: userIds,
				},
			},
		};
		const removeupdate = {
			$pull: {
				contacts: {
					$in: memToRemove,
				},
			},
		};
		return model.findOne(query)
			.then((cont) => {
				if (cont) {
					return model.update(query, update)
						.then(() => model.update(query, removeupdate));
				}
				const newCont = {
					u: {
						_id: userId,
					},
					contacts: userIds,
					category,
				};
				return model.insert(newCont);
			});
	}
}
RocketChat.models.ContactCategory = new ModelContactCategories('contact_categories', true);
