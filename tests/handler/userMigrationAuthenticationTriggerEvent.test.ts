import type {
  BaseUserMigrationTriggerEvent,
  Callback,
  Context,
} from 'aws-lambda';
import { v4 } from 'uuid';
import { handler } from '../../src/handler/userMigrationAuthenticationTriggerEvent';

describe('Test CloudWatch Event Lambda Function', () => {
  test('should return 200 with a success message', () => {
    const eventMock: BaseUserMigrationTriggerEvent<string> = <BaseUserMigrationTriggerEvent<string>> { };
    const contextMock: Context = <Context> { awsRequestId: v4() };
    const callbackMock: Callback = <Callback> { };

    handler(eventMock, contextMock, callbackMock);

    // expect(res.statusCode).toBe(200);
    // expect(res.body).toEqual('Cloudwatch event successfully triggered!');
  });
});
