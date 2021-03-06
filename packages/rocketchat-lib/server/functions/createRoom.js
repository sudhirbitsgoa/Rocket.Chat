/* globals RocketChat */
import _ from 'underscore';
import s from 'underscore.string';
import speakeasy from 'speakeasy';

// function generateToken({ secret }) {
// 	return token = speakeasy.totp({
// 	  secret,
// 	  encoding: 'base32'
// 	});
// }

// function verifySMSToken({secret, token}) {
// 	const delta = RocketChat.settings.get('SMS_Auth_MaxDelta');
// 	const verified = speakeasy.totp.verifyDelta({
// 		secret,
// 		encoding: 'base32',
// 		token,
// 		window: delta,
// 	});

// 	return verified;
// }

// function sendSMS(toNumber, message, otp) {
// 	const apiKey = 'A932b8f7a2dac6ee5a679fa6b53ea8bae';
// 	let template = message || '\d\d\d\d is the OTP to log in to Chaturai App.  This is valid for 20 minutes.   Please do not share this OTP with anyone else.'
// 	template = template.replace(' ', '+');
// 	template = template.replace('\d\d\d\d', otp);
// 	let url2 = `https://api-alerts.solutionsinfini.com/v4/?method=sms&api_key=${apiKey}&to=${toNumber}&sender=CHATUR&message=${template}&format=json`;
//     var res = HTTP.call('POST', url2);
//     return res;
// }

RocketChat.createRoom = function(type, name, owner, members, readOnly, extraData = {}) {
	name = s.trim(name);
	owner = s.trim(owner);
	members = [].concat(members);

	if (!name) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'RocketChat.createRoom' });
	}
	owner = RocketChat.models.Users.findOneByUsername(owner, { fields: { username: 1 } });
	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'RocketChat.createRoom' });
	}

	if (!_.contains(members, owner.username)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();
	let room = Object.assign({
		name: RocketChat.getValidRoomName(name),
		fname: name,
		t: type,
		msgs: 0,
		usersCount: 0,
		u: {
			_id: owner._id,
			username: owner.username,
		},
	}, extraData, {
		ts: now,
		ro: readOnly === true,
		sysMes: readOnly !== true,
	});

	if (type === 'd') {
		room.usernames = members;
	}

	if (Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreatePrevent', room));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-creation', 'A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateExtend', room));
		result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateModify', result));

		if (typeof result === 'object') {
			room = Object.assign(room, result);
		}
	}

	if (type === 'c') {
		RocketChat.callbacks.run('beforeCreateChannel', owner, room);
	}

	room = RocketChat.models.Rooms.createWithFullRoomData(room);

	for (const username of members) {
		let member;
		if (typeof username === 'object') {
			member = username.username;
			member = RocketChat.models.Users.findOneByUsername(member, { fields: { username: 1, 'settings.preferences': 1 } });
			const secret = speakeasy.generateSecret();
			if (!member) {
				const userDetails = {
					name: username.name,
					username: username.username,
					emails: [{
						address: username.email,
						verified: true
					}],
					phone_contacts: [{
						contact: username.contact,
						verified: false
					}],
					type: 'user',
					roles: [
						'user'
					],
					requirePasswordChange: false,
					services: {
						sms: {
							secret: secret.base32
						}
					}
				};
				userDetails.importIds = [1];
				member = RocketChat.models.Users.create(userDetails);
				// const token = generateToken({secret: secret.base32});
				// sendSMS(username.contact, null, token);
				// console.log('the member created prior is %j', member, token);
				username._id = member;
				member = username;
				console.log('the member created is %j', member);
			}
		} else {
			member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1, 'settings.preferences': 1 } });
		}
		console.log('the member found is %j', member);

		const isTheOwner = username === owner.username;
		if (!member) {
			continue;
		}

		// make all room members (Except the owner) muted by default, unless they have the post-readonly permission
		if (readOnly === true && !RocketChat.authz.hasPermission(member._id, 'post-readonly') && !isTheOwner) {
			RocketChat.models.Rooms.muteUsernameByRoomId(room._id, username);
		}

		const extra = { open: true };

		if (username === owner.username) {
			extra.ls = now;
		}

		RocketChat.models.Subscriptions.createWithRoomAndUser(room, member, extra);
	}

	RocketChat.authz.addUserRoles(owner._id, ['owner'], room._id);

	if (type === 'c') {
		Meteor.defer(() => {
			RocketChat.callbacks.run('afterCreateChannel', owner, room);
		});
	} else if (type === 'p') {
		Meteor.defer(() => {
			RocketChat.callbacks.run('afterCreatePrivateGroup', owner, room);
		});
	}
	Meteor.defer(() => {
		RocketChat.callbacks.run('afterCreateRoom', owner, room);
	});

	if (Apps && Apps.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges().getListenerBridge().roomEvent('IPostRoomCreate', room);
	}

	return {
		rid: room._id,
		name: room.name,
	};
};
