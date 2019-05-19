/* eslint-disable class-methods-use-this */
const url = require('url');
const axios = require('axios');
const crypto = require('crypto');

const CircuitBreaker = require('../lib/CircuitBreaker');

const circuitBreaker = new CircuitBreaker();

class FeedbackService {
    constructor({
        serviceRegURL,
        serviceVersionId,
    }) {
        this.serviceRegURL = serviceRegURL;
        this.serviceVersionId = serviceVersionId;
        this.cache = {};
    }

    async getList() {
        // console.log('Here');
        const {
            ip,
            port,
        } = await this.getService('feedback-service');
        console.log(ip, port);
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/list`,
        });
    }

    async callService(requestOptions) {
        const parsedUrl = url.parse(requestOptions.url);
        const cacheKey = crypto.createHash('md5').update(requestOptions.method + parsedUrl.path).digest('hex');

        const result = await circuitBreaker.callService(requestOptions);

        if (!result) {
            if (this.cache[cacheKey]) {
                return this.cache[cacheKey];
            }
            return null;
        }

        this.cache[cacheKey] = result;
        return result;
    }

    async getService(servicename) {
        const response = await axios.get(`${this.serviceRegURL}/find/${servicename}/${this.serviceVersionId}`);
        return response.data;
    }
}

module.exports = FeedbackService;