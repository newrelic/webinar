// used by CodeBuild to write the build information to a file that can then be picked up
// by the app and attached to New Relic custom events.

const buildInfo = {
    commitSha: process.env['CODEBUILD_RESOLVED_SOURCE_VERSION'],
    buildId: process.env['CODEBUILD_BUILD_ID']
};

process.stdout.write(JSON.stringify(buildInfo, null, 2) + '\n');