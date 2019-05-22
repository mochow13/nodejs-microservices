/* eslint-disable class-methods-use-this */
/* circuit-breaker basically ensures that the browser does not
hold up loading if a service is not responding for an endpoint.
The idea is to store three states of circuit breaker for a service:
    - CLOSED => the circuit breaker will let query go to the service endpoint
    - OPEN => the circuit breaker won't let a query go to the service endpoint
    - HALF => the circuit breaker will let on query go to see if the service endpoint works now
We could use the circuit-breaker in the backend, also as a separate service, but
in this case we have written it inside the conference-app
*/
const axios = require('axios');

class CircuitBreaker {
    constructor() {
        this.states = {}; // contains various endpoints of the service as key and info about it
        this.failThresh = 5; // how many faild attempts before going OPEN?
        this.cooldown = 10; // cooldown period after which, circuit breaker half-opens
        this.reqTimeout = 1; // timeout to return
    }

    async callService(reqOptions) {
        const endpoint = `${reqOptions.method}:${reqOptions.url}`;
        // cannot request to the service, return false
        if (!this.canRequest(endpoint)) {
            return false;
        }
        // eslint-disable-next-line no-param-reassign
        reqOptions.timeout = this.reqTimeout * 1000;
        try {
            const res = await axios(reqOptions);
            // if res is successful, we update circuit breaker properties for the service
            this.onSuccess(endpoint);
            return res.data;
        } catch (err) {
            // handles if res is failed
            this.onFailure(endpoint);
            return false;
        }
    }

    onSuccess(endpoint) {
        // success, so reinitialize everything
        this.initState(endpoint);
    }

    onFailure(endpoint) {
        const state = this.states[endpoint];
        // failed, so increase failure count for the particular endpoint
        state.failures += 1;
        // handle the case if failures is more than failThresh
        if (state.failures > this.failThresh) {
            state.circuit = 'OPEN'; // open the circuits
            // fix when to try next, after the cooldown
            state.nextTry = new Date() / 1000 + this.cooldown;
            console.log('ALERT!!! Circuit open for', endpoint);
        }
    }

    canRequest(endpoint) {
        // initialize endpoint infos if it's not in the circuit breaker table
        if (!this.states[endpoint]) {
            this.initState(endpoint);
        }
        const state = this.states[endpoint];
        // circuit-breaker is closed, so return true
        if (state.circuit === 'CLOSED') return true;
        const now = new Date() / 1000;
        // time has passed to make the circuit half open
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