import { DeliveryReceipts } from '../../imports/message-delivery-status/server/lib/DeliveryReceipts';

Meteor.methods({
	deliverMessages(rid) {
		check(rid, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deliverMessages',
			});
		}

		// this prevents cache from updating object reference/pointer
		const userSubscription = Object.assign({}, RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, userId));

		RocketChat.models.Subscriptions.setAsDeliveredByRoomIdAndUserId(rid, userId);
		console.log('the user subscripiton', userSubscription.ls)
		Meteor.defer(() => {
			DeliveryReceipts.markMessagesAsRead(rid, userId, userSubscription.ls);
		});
	},
});
