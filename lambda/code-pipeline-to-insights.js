// AWS Lambda function that formats a CodeDeploy pipeline state change event https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html// into an Insights event

// No external dependencies; can be installed directly in the AWS Console

const http = require('https');
const AWS = require('aws-sdk');

exports.handler = (event) => {

    const options = {
        hostname: 'insights-collector.newrelic.com',
        path: `/v1/accounts/${process.env['NEW_RELIC_ACCOUNT_ID']}/events`,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-Insert-Key': process.env['NEW_RELIC_INSERT_KEY']
        }
    }

    const codepipeline = new AWS.CodePipeline();

    // have to get the artifact information from the api, as it is not part of the event from CloudWatch
    return codepipeline.getPipelineExecution({
        pipelineExecutionId: event.detail['execution-id'],
        pipelineName: event.detail.pipeline
    })
    .promise()
    .then((data) => {

        const payload = { 
            eventType: 'codepipeline:statechange',
            id: event.id,
            version: event.version,
            detailType: event['detail-type'],
            source: event.source,
            account: event.account,
            time: event.time,
            region: event.region,
            'artifactRevision.name': data.pipelineExecution.artifactRevisions[0].name,
            'artifactRevision.revisionId': data.pipelineExecution.artifactRevisions[0].revisionId,
            'artifactRevision.revisionChangeIdentifier': data.pipelineExecution.artifactRevisions[0].revisionChangeIdentifier,
            'artifactRevision.revisionSummary': data.pipelineExecution.artifactRevisions[0].revisionSummary,
            'artifactRevision.created': data.pipelineExecution.artifactRevisions[0].created,
            'artifactRevision.revisionUrl': data.pipelineExecution.artifactRevisions[0].revisionUrl,
            'detail.pipeline': event.detail.pipeline,
            'detail.version': event.detail.version,
            'detail.executionId': event.detail['execution-id'],
            'detail.stage': event.detail.stage,
            'detail.action': event.detail.action,
            'detail.state': event.detail.state,
        };
        
        if (event.detail.type !== undefined) {
            payload['detail.type.owner'] = event.detail.type.owner;
            payload['detail.type.category'] = event.detail.type.category;
            payload['detail.type.provider'] = event.detail.type.provider;
            payload['detail.type.version'] = event.detail.type.version;
        }
        
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
    });  
};


