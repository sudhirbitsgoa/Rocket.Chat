import { DeliveryReceipts } from './lib/DeliveryReceipts';

RocketChat.callbacks.add('afterSaveMessage', (message, room) => {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	// set subscription as read right after message was sent
	RocketChat.models.Subscriptions.setAsDeliveredByRoomIdAndUserId(room._id, message.u._id);

	// mark message as read as well
	DeliveryReceipts.markMessageAsDeliveredBySender(message, room._id, message.u._id);
});
