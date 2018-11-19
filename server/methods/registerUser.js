import s from 'underscore.string';
import speakeasy from 'speakeasy';

function sendSMS(toNumber, message, otp) {
	const apiKey = 'A932b8f7a2dac6ee5a679fa6b53ea8bae';
	let template = message || '\d\d\d\d is the OTP to log in to Chaturai App.  This is valid for 20 minutes.   Please do not share this OTP with anyone else.'
	template = template.replace(' ', '+');
	template = template.replace('\d\d\d\d', otp);
	let url2 = `https://api-alerts.solutionsinfini.com/v4/?method=sms&api_key=${apiKey}&to=${toNumber}&sender=CHATUR&message=${template}&format=json`;
    var res = HTTP.call('POST', url2);
    return res;
}

function generateToken({ secret }) {
	return token = speakeasy.totp({
	  secret,
	  encoding: 'base32'
	});
}

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
				pass: String,
				name: String,
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
			phone_contacts: [{
				contact: formData.contact,
				verified: false
			}]
		};

		RocketChat.passwordPolicy.validate(formData.pass);
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

		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else if (invitedUser) { // the user is already invited by a group admin
			userId = invitedUser._id;
			Accounts.setPassword(invitedUser._id, userData.password);
		} else if (formData.contact) {
			userData.username = formData.contact;
			secret = speakeasy.generateSecret(); // only for new users
			RocketChat.models.Users.setContact(userId, formData.contact, secret.base32);
			console.log('the user ffinserted %j', userData, userId);
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
			// this should be replaced with phone number validation
			if (formData.contact) {
				const token = generateToken({secret: userData.secret});
				sendSMS(formData.contact, null, token);
			} else if (formData.email) {
				Accounts.sendVerificationEmail(userId, userData.email);
			}
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	},
});
