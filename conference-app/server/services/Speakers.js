/* eslint-disable class-methods-use-this */
const axios = require('axios');

class SpeakersService {
    constructor({ serviceRegURL, serviceVersionId }) {
        this.serviceRegURL = serviceRegURL;
        this.serviceVersionId = serviceVersionId;
    }

    async getNames() {
        const { ip, port } = await this.getService('speakers-service');
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
        const res = await axios.get(`${this.serviceRegURL}/find/${servicename}/${this.serviceVersionId}`);
        return res.data;
    }

    async callService(reqOptions) {
        const res = await axios(reqOptions);
        return res.data;
    }
}

module.exports = SpeakersService;