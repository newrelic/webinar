// takes the test results written by CodeBuild and sends them to Insights

const http = require('https');
const testStats = require('./testStats');

const options = {
    hostname: 'insights-collector.newrelic.com',
    path: `/v1/accounts/${process.env['NEW_RELIC_ACCOUNT_ID']}/events`,
    method: 'POST',
    headers: {
        'Content-type': 'application/json',
        'X-Insert-Key': process.env['NEW_RELIC_INSERT_KEY']
    }
}

const payload = {
    eventType: 'testResults',
    numberTests: testStats.stats.tests,
    passes: testStats.stats.passes,
    failures: testStats.stats.failures,
    duration: testStats.stats.duration,
    commitSha: process.env['CODEBUILD_RESOLVED_SOURCE_VERSION'],
    buildId: process.env['CODEBUILD_BUILD_ID'],
    repoUrl: process.env['CODEBUILD_SOURCE_REPO_URL']
}

console.log("SENDING PAYLOAD:", payload);
const req = http.request(options, (res) => {
    var responseBody = '';
    res.on('data',(chunk) => responseBody = responseBody += chunk);
    res.on('end', () => {
        console.log('Instights Request Completed with code', res.statusCode);
        console.log('Body:')
        console.log(responseBody);
    });
});

req.on('error', (e) => {
    console.error(`Insights insert request failed: ${e}`);
});

// write data to request body
req.write(JSON.stringify(payload));
req.end();
