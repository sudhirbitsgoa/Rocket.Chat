/* globals RocketChat */
import { HTTP } from 'meteor/http'
class Twilio {
    constructor() {
        this.apiKey = RocketChat.settings.get('SMS_Chatur_Api_key');
        this.baseUrl = RocketChat.settings.get('SMS_Chatur_base_url');
    }
    parse(data) {
        let numMedia = 0;

        const returnData = {
            from: data.From,
            to: data.To,
            body: data.Body,

            extra: {
                toCountry: data.ToCountry,
                toState: data.ToState,
                toCity: data.ToCity,
                toZip: data.ToZip,
                fromCountry: data.FromCountry,
                fromState: data.FromState,
                fromCity: data.FromCity,
                fromZip: data.FromZip,
            },
        };

        if (data.NumMedia) {
            numMedia = parseInt(data.NumMedia, 10);
        }

        if (isNaN(numMedia)) {
            console.error(`Error parsing NumMedia ${ data.NumMedia }`);
            return returnData;
        }

        returnData.media = [];

        for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
            const media = {
                url: '',
                contentType: '',
            };

            const mediaUrl = data[`MediaUrl${ mediaIndex }`];
            const contentType = data[`MediaContentType${ mediaIndex }`];

            media.url = mediaUrl;
            media.contentType = contentType;

            returnData.media.push(media);
        }

        return returnData;
    }
    send(toNumber, message, otp) {
    	let template = message || '\d\d\d\d is the OTP to log in to Chaturai App.  This is valid for 20 minutes.   Please do not share this OTP with anyone else.'
    	template = template.replace(' ', '+');
    	template = template.replace('\d\d\d\d', otp);
    	let url2 = `https://api-alerts.solutionsinfini.com/v4/?method=sms&api_key=${this.apiKey}&to=${toNumber}&sender=CHATUR&message=${template}&format=json`;
        var res = HTTP.call('POST', url2);
        return res;
    }
    response( /* message */ ) {
        return {
            headers: {
                'Content-Type': 'text/xml',
            },
            body: '<Response></Response>',
        };
    }
    error(error) {
        let message = '';
        if (error.reason) {
            message = `<Message>${ error.reason }</Message>`;
        }
        return {
            headers: {
                'Content-Type': 'text/xml',
            },
            body: `<Response>${ message }</Response>`,
        };
    }
}

// RocketChat.SMS.registerService('chatur', Twilio);

// var service = RocketChat.SMS.getService('chatur');
// // var chaturSMS = new service();
// service.send('8861844413', null, '43212');
