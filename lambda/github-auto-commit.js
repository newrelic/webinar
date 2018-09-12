// this is a utility function that is used to simulate user SCM activity.  It is not required to measure any parts
// of the code pipeline.

const http = require('https');

const committers = [
    {
        name: 'Developer One',
        email: 'developerone@example.com'
    },
    {
        name: 'Developer Two',
        email: 'developertwo@example.com'
    },
    {
        name: 'Developer Three',
        email: 'Developerthree@example.com'
    },
    {
        name: 'Developer Four',
        email: 'developerfour@example.com'
    }
];

exports.handler = (event) => {

    const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];
    const OWNER = process.env['OWNER'];
    const REPO = process.env['REPO'];
    const FILE_PATH = process.env['FILE_PATH'];
    const SHOULD_FAIL = parseFloat(process.env['SHOULD_FAIL']);

    const getContentsOptions = {
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
        method: 'GET',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'AWS Lambda Autocommit'
        }
    }

    const updateContentsOptions = {
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'AWS Lambda Autocommit'
        }
    }

    return new Promise((resolve, reject) => {

        const req = http.request(getContentsOptions, (res) => {
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
          reject(`Guthub get content request for ${getContentsOptions.path} failed: ${e}`);
        });

        req.end();
        
    })
    .then((getContentsResult) => {
        if (getContentsResult.statusCode != 200) {
            throw new Error(`Error returned from GitHub when getting ${getContentsOptions.path}, code: ${getContentsResult.statusCode}, body: ${getContentsResult.body}`);
        }
        
        const jsonBody = JSON.parse(getContentsResult.body);

        const fileContents = new Buffer(jsonBody.content, 'base64').toString('ascii');
        const parsedContents = JSON.parse(fileContents);

        const newContents = {};

        if (parsedContents.failMode == true) {
            // tests are failing, use the same committer to fix them
            newContents.failMode = false;
            newContents.failRate = 0.0;
            newContents.commit = {
                committer: {
                    date: new Date().toISOString(),
                    name: parsedContents.commit.committer.name,
                    email: parsedContents.commit.committer.email
                }
            };
        } else {
            const newCommitter = committers[Math.floor(Math.random() * committers.length)];
            
            newContents.commit = {
                committer: {
                    date: new Date().toISOString(),
                    name: newCommitter.name,
                    email: newCommitter.email
                }
            };

            // will this committer introduce failing tests?
            if (Math.random() < SHOULD_FAIL) {
                newContents.failMode = true;
                newContents.failRate = Math.random();
            } else {
                newContents.failMode = false;
                newContents.failRate = 0.0
            }

        }

        return new Promise((resolve, reject) => {

            const payload = {
                message: `auto commit from AWS Lambda event:
                ${JSON.stringify(event, null, 4)}`,
                committer: {
                    name: newContents.commit.committer.name,
                    email: newContents.commit.committer.email
                },
                content: new Buffer(JSON.stringify(newContents, null, 4)).toString('base64'),
                sha: jsonBody.sha
            }

            const req = http.request(updateContentsOptions, (res) => {
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
              reject(`Github PUT content request for ${updateContentsOptions.path} failed: ${e}`);
            });
    
            req.write(JSON.stringify(payload));
            req.end();
            
        }) 
    });   

}