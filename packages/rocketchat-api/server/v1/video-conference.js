import { Meteor } from 'meteor/meteor';

RocketChat.API.v1.addRoute('video-conference/jitsi.update-timeout', { authRequired: true }, {
	post() {
		const Rooms = RocketChat.models.Rooms;
		const API = RocketChat.API;
		const { roomId } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The "roomId" parameter is required!');
		}

		const room = Rooms.findOneById(roomId);
		if (!room) {
			return API.v1.failure('Room does not exist!');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:updateTimeout', roomId));

		return API.v1.success({ jitsiTimeout: Rooms.findOneById(roomId).jitsiTimeout });
	},
});