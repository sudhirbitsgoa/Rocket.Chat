
RocketChat.API.v1.addRoute('getapplication', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		query.roles = ['bot'];
		const users = RocketChat.models.Users.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields: fields || {
				services: -1,
			},
		}).fetch();
		users.map((e) => {
			e.t = 'd';
			return e;
		});

		return RocketChat.API.v1.success({
			users,
			count: users.length,
			offset,
			total: RocketChat.models.Users.find(query).count(),
		});
	},
});
