// AWS Lambda function that submits a deploy marker when a deploy is complete.
// Use cloudwatch rule trigger that matches the success of a Deploy action:
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/CloudWatchEventsandEventPatterns.html
// ex:
// {
//     "source": [
//       "aws.codepipeline"
//     ],
//     "detail-type": [
//       "CodePipeline Action Execution State Change"
//     ],
//     "detail": {
//       "state": [
//         "SUCCEEDED"
//       ],
//       "type": {
//         "category": [
//           "Deploy"
//         ]
//       }
//     }
// }

// No external dependencies; can be installed directly in the AWS Console

const http = require('https');
const AWS = require('aws-sdk');

exports.handler = (event) => {

    const options = {
        hostname: 'api.newrelic.com',
        path: `/v2/applications/${process.env['NEW_RELIC_APP_ID']}/deployments.json`,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-Api-Key': process.env['NEW_RELIC_API_KEY']
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
            deployment: {
                revision: data.pipelineExecution.artifactRevisions[0].revisionId,
                description: data.pipelineExecution.artifactRevisions[0].revisionSummary
              }
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
            reject(`Deployment request failed: ${e}`);
            });

            // write data to request body
            req.write(JSON.stringify(payload));
            req.end();
            
        });
    });  
};


