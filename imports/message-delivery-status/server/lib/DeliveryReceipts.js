import { Random } from 'meteor/random';
import ModelDeliveryStatus from '../models/ReadReceipts';

const rawDeliveryStatus = ModelDeliveryStatus.model.rawCollection();

// debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once
const list = {};
const debounceByRoomId = function(fn) {
	return function(roomId, ...args) {
		clearTimeout(list[roomId]);
		list[roomId] = setTimeout(() => { fn.call(this, roomId, ...args); }, 2000);
	};
};

const updateMessages = debounceByRoomId(Meteor.bindEnvironment((roomId) => {
	// @TODO maybe store firstSubscription in room object so we don't need to call the above update method
	const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);
	RocketChat.models.Messages.setAsDelivered(roomId, firstSubscription.ls);
}));

export const DeliveryReceipts = {
	markMessagesAsRead(roomId, userId, userLastSeen) {
		console.log('the mark as delivered called', roomId)
		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { lm: 1 } });
		// if users last seen is greadebounceByRoomIdter than room's last message, it means the user already have this room marked as read
		console.log('the ', userLastSeen, room.lm)
		if (userLastSeen > room.lm) {
			return;
		}

		if (userLastSeen) {
			this.storeReadReceipts(RocketChat.models.Messages.findUnDeliveredMessagesByRoomAndDate(roomId, userLastSeen), roomId, userId);
		}

		updateMessages(roomId);
	},

	markMessageAsDeliveredBySender(message, roomId, userId) {
		// this will usually happens if the message sender is the only one on the room
		const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);
		if (message.unread && message.ts < firstSubscription.ls) {
			RocketChat.models.Messages.setAsDeliveredById(message._id, firstSubscription.ls);
		}

		this.storeReadReceipts([{ _id: message._id }], roomId, userId);
	},

	storeReadReceipts(messages, roomId, userId) {
		const ts = new Date();
		const receipts = messages.map((message) => ({
			_id: Random.id(),
			roomId,
			userId,
			messageId: message._id,
			ts,
		}));
		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { usersCount: 1, t: 1} });

		messages.map((message) => {
			// need to change incViewedcunt to delivered count
            RocketChat.models.Messages.incDeliveredCount(message._id, userId);
            RocketChat.Notifications.notifyRoom(roomId, 'stream-notify-room', { deliveredTo: userId });
            return null;
        });

		if (receipts.length === 0) {
			return;
		}

		try {
			rawDeliveryStatus.insertMany(receipts);
		} catch (e) {
			console.error('Error inserting delivery receipts per user');
		}
	},

	getReceipts(message) {
		return ModelDeliveryStatus.findByMessageId(message._id).map((receipt) => ({
			...receipt,
			user: RocketChat.models.Users.findOneById(receipt.userId, { fields: { username: 1, name: 1 } }),
		}));
	},
};
