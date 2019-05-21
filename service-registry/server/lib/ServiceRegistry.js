// Semver means semantic-version. Standard for version naming.
const semver = require('semver');

class ServiceRegistry {
    constructor(log) {
        this.log = log;
        this.services = {};
        this.timeout = 30;
    }

    get(name, version) {
        // cleanup removes those services if their timeout is more than this.timeout
        // we cleanup frequently to ensure that a service is not returned if decided to be dead
        this.cleanup();
        // semver to compare versions of services
        const candidates = Object.values(this.services)
            .filter(service => service.name === name && semver.satisfies(service.version, version));
        // some randomization to introduce very basic load balancing
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    register(name, version, ip, port) {
        this.cleanup(); // cleanup before
        // a key to uniquely identify each service
        const key = name + version + ip + port;

        if (!this.services[key]) {
            // add a new service
            this.services[key] = {
                timestamp: Math.floor(new Date() / 1000),
                ip,
                port,
                name,
                version,
            };
            this.log.debug(`Service added ${name}, version ${version} at ${ip}:${port}`);
            return key;
        }
        // The service already exists, update the time
        this.services[key].timestamp = Math.floor(new Date() / 1000);
        this.log.debug(`Service updated ${name}, version ${version} at ${ip}:${port}`);
        return key;
    }

    // If a service is going down, if it is possible, it should unregister means
    // it should let the service-registry know that it's going down so that service-registry
    // can update its data
    unregister(name, version, ip, port) {
        const key = name + version + ip + port;
        delete this.services[key];
        this.log.debug(`Service unregistered ${name}, version ${version} at ${ip}:${port}`);
        return key;
    }

    // cleanup the possibly unresponsive services
    cleanup() {
        const now = Math.floor(new Date() / 1000);
        Object.keys(this.services).forEach((key) => {
            if (this.services[key].timestamp + this.timeout < now) {
                delete this.services[key];
                this.log.debug(`Removed service ${key}`);
            }
        });
    }
}

module.exports = ServiceRegistry;