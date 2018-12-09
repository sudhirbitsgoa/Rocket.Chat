Meteor.methods({
	approveUserToJoinRoom(rid, uId) {
		check(rid, String);
		// console.log('approve user to join the room', rid, uId);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		// TODO we should have a 'beforeJoinRoom' call back so external services can do their own validations
		const user = Meteor.user();

		if (room.u._id !== user._id) { // if the person is not admin to the room cant join users
			throw new Meteor.Error('error-not-allowed', 'Not authorized to allow', { method: 'joinRoom' });
			return;
		}
		const toAddUser = RocketChat.models.Users.findOneById(uId);
		if (!toAddUser) {
			throw new Meteor.Error('error-not-allowed', 'Not valid user Id', { method: 'joinRoom' });
			return;
		}
		// console.log('how the user is getting added to the subscription');
		return RocketChat.models.Subscriptions.updateSubscriptionAfterApproval(rid,uId);
	},
});
