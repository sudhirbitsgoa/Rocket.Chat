RocketChat.addUserToRoom = function(rid, user, inviter, silenced) {
	const now = new Date();
	const room = RocketChat.models.Rooms.findOneById(rid);

	// Check if user is already in room
	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (subscription) {
		return;
	}

	if (room.t === 'c' || room.t === 'p') {
		RocketChat.callbacks.run('beforeJoinRoom', user, room);
	}

	const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
	if (muted) {
		RocketChat.models.Rooms.muteUsernameByRoomId(rid, user.username);
	}

	// for now the adding to room dont need approval from user or admin
	// the requirement is to change and add approvals.
	if (room.u._id !== user._id) { // the admin of the room adding himself so allow
		// if not the admin of the room then need approval from admin

		// if user adding himself then need admin approval
		let needUserApproval = false;
		let needAdminApproval = false;
		if (Meteor.userId() === user._id) { // user adding himself
			needAdminApproval = true;
		} else { // some one else adding to the room
			needUserApproval = true;
		}
		RocketChat.models.Subscriptions.createWithRoomAndUserNotAproved(room, user, {
			ts: now,
			open: true,
			alert: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
		}, {
			needAdminApproval,
			needUserApproval
		});

	} else {
		RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
			ts: now,
			open: true,
			alert: true,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			agreed: false
		});
	}

	if (!silenced) {
		if (inviter) {
			RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rid, user, {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
			});
		} else {
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function() {
			RocketChat.callbacks.run('afterJoinRoom', user, room);
		});
	}

	return true;
};
// TO_DO get list of admin approvals needed for the room
// TO_DO get list of user approvals needed for the room
