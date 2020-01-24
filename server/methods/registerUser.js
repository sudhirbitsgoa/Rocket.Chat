import s from 'underscore.string';
import speakeasy from 'speakeasy';
let window = 2; // minites

function sendSMS(toNumber, message, otp) {
	console.log('the otp is', otp);
	const apiKey = 'A932b8f7a2dac6ee5a679fa6b53ea8bae';
	let template = message || `%3C%23%3E \d\d\d\d is the OTP to log in to Chaturai App.  This is valid for ${window} minutes. ${process.env.SMSCODE}`;
	template = template.replace('\d\d\d\d', otp);
	template = template.replace(/\s/g, '+');
	let url2 = `https://api-alerts.solutionsinfini.com/v4/?method=sms&api_key=${apiKey}&to=${toNumber}&sender=CHATUR&message=${template}&format=json`;
    var res = HTTP.call('POST', url2);
    return res;
}

function generateToken(secret) {
	console.log('the secret used', secret);
	return token = speakeasy.totp({
	  secret,
	  encoding: 'base32'
	});
}
// var secrett = speakeasy.generateSecret(); // only for new users
// console.log('the secret', secrett);
// var tokenn = generateToken(secrett.base32);
// console.log('the token', tokenn)
// const verifiedd = speakeasy.totp.verify({ secret: secrett.base32,
//                                        encoding: 'base32',
//                                        token: tokenn,
//                                        window: 6 });

// console.log('the verifff', verifiedd);


Meteor.methods({
	registerUser(formData) {
		const AllowAnonymousRead = RocketChat.settings.get('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = RocketChat.settings.get('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
			const userId = Accounts.insertUserDoc({}, {
				globalRoles: [
					'anonymous',
				],
			});

			const { id, token } = Accounts._loginUser(this, userId);

			return { id, token };
		} else {
			check(formData, Match.ObjectIncluding({
				email: Match.Optional(String),
				pass: Match.Optional(String),
				name: Match.Optional(String),
				secretURL: Match.Optional(String),
				reason: Match.Optional(String),
				contact: Match.Optional(String)
			}));
		}

		if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' });
		} else if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))) {
			throw new Meteor.Error ('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
		}

		let secret,	importedUser, invitedUser;
		const userData = {
			password: formData.pass,
			name: formData.name,
			reason: formData.reason,
			phones: [{
				number: formData.contact,
				verified: false
			}]
		};
		if (formData.email) { // if email is present then only
			RocketChat.passwordPolicy.validate(formData.pass);
		} else {
			let randomPass = Math.random()*1000000;
			userData.password = formData.pass = `${randomPass}PASS`;
		}
		if (formData.contact) { // give priority to contact
			RocketChat.validateContactNumber(formData.contact);
			// for invited users when creating a group. We should check whether they are invited and update the user details. TODO
			invitedUser = RocketChat.models.Users.findOneByContactNumberandNotVerified(formData.contact);
		} else if (formData.email) {
			RocketChat.validateEmailDomain(formData.email);
			userData.email = s.trim(formData.email.toLowerCase());
			// Check if user has already been imported and never logged in. If so, set password and let it through
			importedUser = RocketChat.models.Users.findOneByEmailAddress(s.trim(formData.email.toLowerCase()));
		}
		// console.log('the imported user %j', importedUser);
		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else if (invitedUser) { // the user is already invited by a group admin
			userId = invitedUser._id;
			secret = invitedUser.services.sms;
			// Accounts.setPassword(invitedUser._id, userData.password);
		} else if (formData.contact && !invitedUser) {
			userData.username = formData.contact;
			secret = speakeasy.generateSecret().base32; // only for new users
			userId = Accounts.createUser(userData);
			RocketChat.models.Users.setContact(userId, formData.contact, secret);
			Accounts.setPassword(userId, userData.password);
		} else {
			userId = Accounts.createUser(userData);
		}

		RocketChat.models.Users.setName(userId, s.trim(formData.name));

		const reason = s.trim(formData.reason);
		if (manuallyApproveNewUsers && reason) {
			RocketChat.models.Users.setReason(userId, reason);
		}

		RocketChat.saveCustomFields(userId, formData);
		try {
			if (RocketChat.settings.get('Verification_Customized')) {
				const subject = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email_Subject') || '');
				const html = RocketChat.placeholders.replace(RocketChat.settings.get('Verification_Email') || '');
				Accounts.emailTemplates.verifyEmail.subject = () => subject;
				Accounts.emailTemplates.verifyEmail.html = (userModel, url) => html.replace(/\[Verification_Url]/g, url);
			}
			// the phone number validation should be done during registraion
			if (formData.contact) {
				const token = generateToken(secret);
				sendSMS(formData.contact, null, token);
			} else if (formData.email) {
				Accounts.sendVerificationEmail(userId, userData.email);
			}
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	},
	verifyToken({token, contact, username}) {
		const user = RocketChat.models.Users.findOneByContactNumberandNotVerified(contact);
		if (!user) {
			throw new Meteor.Error('error-not-allowed', 'contact number not registered', {
				method: 'users.verifyToken',
			});
			return;
		}
		const secret = user.services.sms;
		const verified = speakeasy.totp.verify({ secret: secret,
                                       encoding: 'base32',
                                       token: token });
		if (!verified) {
			throw new Meteor.Error('error-not-allowed', 'invalid otp', {
				method: 'users.verifyToken',
			});
			return;
		}
		RocketChat.models.Users.setContactVerified(user._id, this.bodyParams.contact);
		return user;
	}
});
