const assert = require('assert');
const testConfig = require('./test-config');

const NUM_TESTS = 100

const FAIL_MODE = (process.env['FAIL_MODE'] !== undefined) ? (process.env['FAIL_MODE'] == 'true') : testConfig.failMode; 
const FAIL_RATE = (process.env['FAIL_RATE'] !== undefined) ? parseFloat(process.env['FAIL_RATE']) : testConfig.failRate;

describe(`generating ${NUM_TESTS} tests`, () => {
    for (let i = 0; i < NUM_TESTS; i++) {
        it(`Test #${i}`, () => {
            if(FAIL_MODE) {
                assert(Math.random() > FAIL_RATE);
            } else {
                assert(true);
            }
        });
    }
});