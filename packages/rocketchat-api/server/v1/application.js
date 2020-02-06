// import { API } from '../api';
// import { Users } from '../../../models/server';
// import { hasPermission } from '../../../authorization';

RocketChat.API.v1.addRoute('getapplication', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
			return RocketChat.API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		const params = this.requestParams();
		console.log("params value are",params.interect);
		let result;
		let botUsers = [];
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('rooms/get', {}); });
		result.map(function(username){
			if(username.t == 'd'){
				if(username.usernames && username.usernames.length){
					username.usernames.map(function(user){
						botUsers.push(user);
					})
				}
			}	
		})
		query.roles = ['bot'];
		if(params.interect){
			query.username = {
				$regex: new RegExp(params.nameFilter, 'i'),
				$in: botUsers
			};
		}else{
			query.username = {
				$regex: new RegExp(params.nameFilter, 'i'),
				$nin: botUsers
			};
		}
        
		const users = RocketChat.models.Users.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();
		users.map(function(e){
			e.t = "d";
			e.fname = e.name
	   });

		return RocketChat.API.v1.success({
			users,
			count: users.length,
			offset,
			total: RocketChat.models.Users.find(query).count(),
		});
	},
});
