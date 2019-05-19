/* eslint-disable class-methods-use-this */
const axios = require('axios');

class CircuitBreaker {
    constructor() {
        this.states = {};
        this.failThresh = 5;
        this.cooldown = 10;
        this.reqTimeout = 2;
    }

    async callService(reqOptions) {
        const endpoint = `${reqOptions.method}:${reqOptions.url}`;
        if (!this.canRequest(endpoint)) {
            return false;
        }
        // eslint-disable-next-line no-param-reassign
        reqOptions.timeout = this.reqTimeout * 1000;

        try {
            const res = await axios(reqOptions);
            this.onSuccess(endpoint);
            return res.data;
        } catch (err) {
            this.onFailure(endpoint);
            return false;
        }
    }

    onSuccess(endpoint) {
        this.initState(endpoint);
    }

    onFailure(endpoint) {
        const state = this.states[endpoint];
        // console.log(state);
        state.failures += 1;
        if (state.failures > this.failThresh) {
            state.circuit = 'OPEN';
            state.nextTry = new Date() / 1000 + this.cooldown;
            console.log('ALERT!!! Circuit open for', endpoint);
        }
    }

    canRequest(endpoint) {
        if (!this.states[endpoint]) {
            this.initState(endpoint);
        }
        const state = this.states[endpoint];
        if (state.circuit === 'CLOSED') return true;
        const now = new Date() / 1000;
        if (state.nextTry <= now) {
            state.circuit = 'HALF';
            return true;
        }
        return false;
    }

    initState(endpoint) {
        this.states[endpoint] = {
            failures: 0,
            cooldown: this.cooldown,
            circuit: 'CLOSED',
            nexTry: 0,
        };
    }
}

module.exports = CircuitBreaker;