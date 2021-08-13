# cognito-user-miration-lambda

A Lambda to be invoked by AWS Cognito, to migrate users from an LDAP source.

Can handle both `UserMigration_Authentication` and `UserMigration_ForgotPassword` events from AWS Cognito as referenced in https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-migrate-user.html

## Configuration

Configure the Lambda using **environment variables**:

### LDAP_URL

A valid LDAP URL (proto/host/port only).

#### Example
```text
ldap://example.net:389
```

### LDAP_ADMIN_DN

The FQDN for the admin user to search and obtain user objects.

#### Example
```text
cn=admin,dc=localdev,dc=dvsa
```

### LDAP_ADMIN_PASSWORD

The password/credential used to authenticate the ADMIN user.

#### Example
```text
password
```

### LDAP_USER_SEARCH_BASE

The LDAP base DN to search the user.

#### Example
```text
dc=example,dc=com
```

### LDAP_USERNAME_ATTRIBUTE

The LDAP search equality attribute name corresponding to the user's username. LDAP_USER_BASE is appended when searching and authenticating.

#### Example
```text
cn
```

### LDAP_OBJECT_FILTER_MAP

JSON string containing a filter map transforming the object from LDAP to Cognito user attributes:

**Key:** LDAP entry field  =>  **Value:** Cognito user attribute field

Attributes not defined are ignored and not given to Cognito.

#### Example
```json
{
  "mail": "email",
  "cn": "username"
}
```

## Requirements

- node v14.17.3
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)


## Build

- `npm i`
- `npm run build:dev`

## Watch

To watch for changes and automatically trigger a new build:
- `npm run watch:dev`


## Run Lambdas Locally

- Ensure you have an LDAP instance running (`docker-compose up`)
- Build the files first
- Set environment variables in `env.json` (see `env.example.json` for an example)
- To run CloudWatch Event lambdas:
  ```
  npm run invoke -- --env-vars env.json -e ./event/userMigrationAuthenticationTriggerEvent.event.json
  ```

## Tests

- The [Jest](https://jestjs.io/) framework is used to run tests and collect code coverage
- To run the tests, run the following command within the root directory of the project: `npm test`
- Coverage results will be displayed on terminal and stored in the `coverage` directory
    - The coverage requirements can be set in `jest.config.js`
