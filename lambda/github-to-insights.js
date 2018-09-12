// AWS Lambda function that formats GitHub's push event payload (https://developer.github.com/v3/activity/events/types/#pushevent)
// into an Insights event

// No external dependencies; can be installed directly in the AWS Console

const http = require('https');

exports.handler = (event) => {
    
    let body = JSON.parse(event.body);

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
        eventType: 'github:push',
        ref: body.ref,
        before: body.before,
        after: body.after,
        created: body.created,
        deleted: body.deleted,
        forced: body.forced,
        base_ref: body.base_ref,
        compare: body.compare,
        'repository.id': body.repository.id,
        'repository.full_name': body.repository.full_name,
        'repository.html_url': body.repository.html_url,
        'repository.open_issues_count': body.repository.open_issues_count,
        'pusher.name': body.pusher.name,
        'pusher.email': body.pusher.email,
        'committer.name': body.head_commit.committer.name,
        'committer.email': body.head_commit.committer.email
        
    };
    
    
    return new Promise((resolve, reject) => {

        const req = http.request(options, (res) => {
            var responseBody = '';
            res.on('data',(chunk) => responseBody = responseBody += chunk);
            res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseBody
                    });
            });
        });

        req.on('error', (e) => {
          reject(`Insights insert request failed: ${e}`);
        });

        // write data to request body
        req.write(JSON.stringify(payload));
        req.end();
        
    });   
};


