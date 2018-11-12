RocketChat.settings.addGroup('Accounts', function() {
	this.section('Two Factor Authentication', function() {
		this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
			type: 'boolean',
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			public: true,
			i18nLabel: 'Accounts_TwoFactorAuthentication_MaxDelta',
			enableQuery: {
				_id: 'Accounts_TwoFactorAuthentication_Enabled',
				value: true,
			},
		});
	});

	this.section('SMS based authentication', function() {
		this.add('SMS_Auth_MaxDelta', 60*20, {
			type: 'int',
			public: true
		});
	});
});


