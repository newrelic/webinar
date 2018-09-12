# Buildspecs

Configuration files used by Amazon CodeBuild Actions

https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html

## Tag Source
[tag-source.yml](./tag-source.yml)

Extracts metadata from the CodeBuild environment and pipes it to a file that can be picked up by the app

## Unit Tests
[unit-tests.yml](./unit-tests.yml)

Runs the application's unit tests, saves the results, and executes a script that will then send them to New Relic Insights.
