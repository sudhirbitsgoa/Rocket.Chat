
RocketChat.API.v1.addRoute('getapplication', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		query.roles = ['bot'];
		const users = RocketChat.models.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return RocketChat.API.v1.success({
			users,
			count: users.length,
			offset,
			total: RocketChat.models.find(query).count(),
		});
	},
});
