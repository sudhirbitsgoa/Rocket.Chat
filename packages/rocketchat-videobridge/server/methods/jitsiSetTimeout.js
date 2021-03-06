Meteor.methods({
	'jitsi:updateTimeout': (rid, tag, type) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:updateTimeout' });
		}
		const room = RocketChat.models.Rooms.findOneById(rid);
		const currentTime = new Date().getTime();

		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout <= currentTime || type === 'new') {
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(currentTime + 35 * 1000));
			const message = RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('jitsi_call_started', rid, '', Meteor.user(), {
				actionLinks : [
					{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), method_id: 'joinJitsiCall', params: '' },
				],
			});
			const room = RocketChat.models.Rooms.findOneById(rid);
		    message.msg = `Started a ${tag} call.`;
			//message.msg = TAPi18n.__('Started_a_video_call');
			message.tag = tag;
			const user = RocketChat.models.Users.findOne(Meteor.userId(), {
				fields: {
					username: 1,
				},
			});
			message.mentions = [
				{
					_id: Meteor.userId(),
					username: user.username,
				},
			];
			RocketChat.callbacks.run('afterSaveMessage', message, room);
		} else if ((jitsiTimeout - currentTime) / 1000 <= 15) {
			RocketChat.models.Rooms.setJitsiTimeout(rid, new Date(jitsiTimeout + 25 * 1000));
		}
	},
});
