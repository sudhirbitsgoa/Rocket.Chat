import { Meteor } from 'meteor/meteor';

import { DeliveryReceipts } from '../../lib/DeliveryReceipts';

Meteor.methods({
	getDeliveryStatus({ messageId }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getDeliveryStatus' });
		}

		if (!messageId) {
			throw new Meteor.Error('error-invalid-message', 'The required \'messageId\' param is missing.', { method: 'getDeliveryStatus' });
		}

		const message = RocketChat.models.Messages.findOneById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'getDeliveryStatus' });
		}

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getDeliveryStatus' });
		}

		return DeliveryReceipts.getReceipts(message);
	},
});
