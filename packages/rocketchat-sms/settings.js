Meteor.startup(function() {
	RocketChat.settings.addGroup('SMS', function() {
		this.add('SMS_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
		});

		this.add('SMS_Service', 'twilio', {
			type: 'select',
			values: [{
				key: 'twilio',
				i18nLabel: 'Twilio',
			}],
			i18nLabel: 'Service',
		});

		this.section('Twilio', function() {
			this.add('SMS_Twilio_Account_SID', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'twilio',
				},
				i18nLabel: 'Account_SID',
			});
			this.add('SMS_Twilio_authToken', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'twilio',
				},
				i18nLabel: 'Auth_Token',
			});
		});

		this.section('Chatur', function() {
			this.add('SMS_Chatur_Api_key', 'A932b8f7a2dac6ee5a679fa6b53ea8bae', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'chatur',
				},
				i18nLabel: 'Account_SID',
			});
			this.add('SMS_Chatur_base_url', 'https://api-alerts.solutionsinfini.com/v4', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'chatur',
				},
				i18nLabel: 'Auth_Token',
			});
		});
	});
});
