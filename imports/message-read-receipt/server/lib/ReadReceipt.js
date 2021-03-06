import { Random } from 'meteor/random';
import ModelReadReceipts from '../models/ReadReceipts';

const rawReadReceipts = ModelReadReceipts.model.rawCollection();

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
	RocketChat.models.Messages.setAsRead(roomId, firstSubscription.ls);
}));

export const ReadReceipt = {
	markMessagesAsRead(roomId, userId, userLastSeen) {
		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { lm: 1 } });

		// if users last seen is greadebounceByRoomIdter than room's last message, it means the user already have this room marked as read
		if (userLastSeen > room.lm) {
			return;
		}

		if (userLastSeen) {
			this.storeReadReceipts(RocketChat.models.Messages.findUnreadMessagesByRoomAndDate(roomId, userLastSeen), roomId, userId);
		}

		updateMessages(roomId);
	},

	markMessageAsReadBySender(message, roomId, userId) {
		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		// this will usually happens if the message sender is the only one on the room
		const firstSubscription = RocketChat.models.Subscriptions.getMinimumLastSeenByRoomId(roomId);
		if (message.unread && message.ts < firstSubscription.ls) {
			RocketChat.models.Messages.setAsReadById(message._id, firstSubscription.ls);
		}

		this.storeReadReceipts([{ _id: message._id }], roomId, userId);
	},

	storeReadReceipts(messages, roomId, userId) {
		if (RocketChat.settings.get('Message_Read_Receipt_Store_Users')) {

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
                RocketChat.models.Messages.incViewedCount(message._id, userId);
                RocketChat.Notifications.notifyRoom(roomId, 'stream-notify-room', { readBy: userId });
                return null;
            });

			if (receipts.length === 0) {
				return;
			}

			try {
				rawReadReceipts.insertMany(receipts);
			} catch (e) {
				console.error('Error inserting read receipts per user');
			}
			messages.map(message => {
				// for private rooms once the message is read by all
                // then delete the message
                console.log('the deletion of message', room);
                if (room.t === 'p') {
                	// find if all the users read the message
                	const readReciptsCount = rawReadReceipts.count({ messageId: message._id});
                	readReciptsCount
                		.then(count => {
                			if (count === room.usersCount) {
                				RocketChat.models.Messages.removeById(message._id);
                			}
                		});
                }
			});
		}
	},

	getReceipts(message) {
		return ModelReadReceipts.findByMessageId(message._id).map((receipt) => ({
			...receipt,
			user: RocketChat.models.Users.findOneById(receipt.userId, { fields: { username: 1, name: 1 } }),
		}));
	},
};
