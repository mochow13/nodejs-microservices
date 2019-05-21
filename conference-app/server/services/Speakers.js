/* eslint-disable class-methods-use-this */
const axios = require('axios');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');

// promisify fs.exists, used later
const fsexists = util.promisify(fs.exists);
const CircuitBreaker = require('../lib/CircuitBreaker');

const circuitBreaker = new CircuitBreaker();

class SpeakersService {
    constructor({ serviceRegURL, serviceVersionId }) {
        this.serviceRegURL = serviceRegURL;
        this.serviceVersionId = serviceVersionId;
        this.cache = {};
    }

    async getNames() {
        // ask for the ip-port of speakers-service
        const { ip, port } = await this.getService('speakers-service');
        // call the service using the info and return the result
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/names`,
        });
    }

    async getListShort() {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/list-short`,
        });
    }

    async getList() {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/list`,
        });
    }

    // following functions are pretty similar

    async getAllArtwork() {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/artwork`,
        });
    }

    async getSpeaker(shortname) {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/speaker/${shortname}`,
        });
    }

    async getArtworkForSpeaker(shortname) {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            url: `http://${ip}:${port}/artwork/${shortname}`,
        });
    }

    async getService(servicename) {
        // calling the service-registry service to for the data of 'servicename'
        const res = await axios.get(`${this.serviceRegURL}/find/${servicename}/${this.serviceVersionId}`);
        return res.data;
    }

    async callService(reqOptions) {
        // get the path only
        const servicePath = url.parse(reqOptions.url).path;
        // get a hashed cache-key
        const cacheKey = crypto.createHash('md5').update(reqOptions.method + servicePath).digest('hex');

        let cacheFile = null;

        // if we want an image, set the file name
        if (reqOptions.responseType && reqOptions.responseType === 'stream') {
            cacheFile = `${__dirname}/../../_imagecache/${cacheKey}`;
        }

        // calling the service we want to call via circuit-breaker!
        const result = await circuitBreaker.callService(reqOptions);

        if (!result) {
            // no result, unavailable or error, check the cache
            if (this.cache[cacheKey]) return this.cache[cacheKey];
            // we wanted image, so check if file exists
            if (cacheFile) {
                const exists = await fsexists(cacheFile);
                if (exists) return fs.createReadStream(cacheFile);
            }
            // nothing found, fail
            return false;
        }

        if (!cacheFile) {
            // we wanted simple data, not image
            this.cache[cacheKey] = result;
        } else {
            // we wanted image, so write on the file
            const ws = fs.createWriteStream(cacheFile);
            result.pipe(ws);
        }
        return result;
    }

    async getImage(path) {
        const { ip, port } = await this.getService('speakers-service');
        return this.callService({
            method: 'get',
            responseType: 'stream', // important for image
            url: `http://${ip}:${port}/images/${path}`,
        });
    }
}

module.exports = SpeakersService;