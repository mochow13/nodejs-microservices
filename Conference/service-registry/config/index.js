const bunyan = require('bunyan'); // logging library
// Load package.json
const pjs = require('../package.json');

// Get some meta info from the package.json, it has name and version of service
const {
    name,
    version,
} = pjs;

// Set up a logger
const getLogger = (serviceName, serviceVersion, level) => bunyan.createLogger({
    name: `${serviceName}:${serviceVersion}`,
    level,
});

// Configuration options for different environments
module.exports = {
    development: {
        name,
        version,
        serviceTimeout: 30,
        log: () => getLogger(name, version, 'debug'),
    },
    production: {
        name,
        version,
        serviceTimeout: 30,
        log: () => getLogger(name, version, 'info'),
    },
    test: {
        name,
        version,
        serviceTimeout: 30,
        log: () => getLogger(name, version, 'fatal'),
    },
};