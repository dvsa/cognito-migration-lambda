// eslint-disable-next-line max-classes-per-file
import { Entry } from 'ldapts';
import { v4 } from 'uuid';
import type {
  Context,
  UserMigrationAuthenticationTriggerEvent,
  UserMigrationForgotPasswordTriggerEvent, UserMigrationTriggerEvent,
} from 'aws-lambda';
import * as handler from '../../src/handler/cognitoUserMigrationEvent';

jest.mock('../../src/util/logger');

describe('Test cognitoUserMigrationEventHandler', () => {
  afterEach(() => {
    jest.resetModules();
  });

  describe('Event Triggers', () => {
    test('Event trigger UserMigration_Authentication', async () => {
      const eventMock: UserMigrationAuthenticationTriggerEvent = <UserMigrationAuthenticationTriggerEvent> {
        triggerSource: 'UserMigration_Authentication',
      };
      const contextMock: Context = <Context>{ awsRequestId: v4() };
      const spy = jest.spyOn(handler, 'migrateUserAuthentication').mockImplementation(
        () => Promise.resolve(<UserMigrationAuthenticationTriggerEvent> {}),
      );

      await handler.lambdaHandler(eventMock, contextMock);
      expect(spy).toHaveBeenCalled();
    });
    test('Event trigger UserMigration_ForgotPassword', async () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
      };
      const contextMock: Context = <Context>{ awsRequestId: v4() };
      const spy = jest.spyOn(handler, 'migrateUserForgotPassword').mockImplementation(
        () => Promise.resolve(<UserMigrationForgotPasswordTriggerEvent> {}),
      );

      await handler.lambdaHandler(eventMock, contextMock);
      expect(spy).toHaveBeenCalled();
    });
    test('Unknown event trigger throws error', async () => {
      const eventMock: UserMigrationTriggerEvent = <UserMigrationTriggerEvent><unknown>{
        triggerSource: 'SomeUnknownTriggerSource',
      };
      const contextMock: Context = <Context>{ awsRequestId: v4() };

      await expect(async () => {
        await handler.lambdaHandler(eventMock, contextMock);
      }).rejects.toThrow(Error);
    });
  });
  describe('User Migration event response', () => {
    test('LDAP entry maps to Cognito ignoring undefined properties', () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
        response: {
          userAttributes: {},
        },
      };

      process.env.LDAP_OBJECT_FILTER_MAP = JSON.stringify({
        mail: 'email',
        cn: 'username',
      });

      const entry: Entry = <Entry> {
        dn: 'dn-test',
        cn: 'cn-test',
        mail: 'mail-test',
      };

      const result: UserMigrationTriggerEvent = handler.generateMigrationEventResponse(entry, eventMock);

      expect(result.response.userAttributes).toHaveProperty('email');
      expect(result.response.userAttributes).toHaveProperty('username');
      expect(result.response.userAttributes).not.toHaveProperty('dn');

      expect(result.response.userAttributes.username).toEqual(entry.cn);
      expect(result.response.userAttributes.email).toEqual(entry.mail);
    });
    test('Email Verified is set and set to true', () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
        response: {
          userAttributes: {},
        },
      };

      process.env.LDAP_OBJECT_FILTER_MAP = JSON.stringify({
        mail: 'email',
        cn: 'username',
      });

      const entry: Entry = <Entry> {
        dn: 'dn-test',
        cn: 'cn-test',
        mail: 'email-test',
      };

      const result: UserMigrationTriggerEvent = handler.generateMigrationEventResponse(entry, eventMock);

      expect(result.response.userAttributes).toHaveProperty('email_verified');
      expect(result.response.userAttributes.email_verified).toBe('true');
    });
    test('Email Verified is NOT set when no email', () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
        response: {
          userAttributes: {},
        },
      };

      process.env.LDAP_OBJECT_FILTER_MAP = JSON.stringify({
        cn: 'username',
      });

      const entry: Entry = <Entry> {
        dn: 'dn-test',
        cn: 'cn-test',
        mail: 'email-test',
      };

      const result: UserMigrationTriggerEvent = handler.generateMigrationEventResponse(entry, eventMock);

      expect(result.response.userAttributes).not.toHaveProperty('email_verified');
    });
    test('FinalUserStatus is set to confirmed', () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
        response: {
          userAttributes: {},
        },
      };

      process.env.LDAP_OBJECT_FILTER_MAP = JSON.stringify({});

      const entry: Entry = <Entry> {};

      const result: UserMigrationTriggerEvent = handler.generateMigrationEventResponse(entry, eventMock);

      expect(result.response).toHaveProperty('finalUserStatus');
      expect(result.response.finalUserStatus).toBe('CONFIRMED');
    });
    test('MessageAction is set to suppress', () => {
      const eventMock: UserMigrationForgotPasswordTriggerEvent = <UserMigrationForgotPasswordTriggerEvent> {
        triggerSource: 'UserMigration_ForgotPassword',
        response: {
          userAttributes: {},
        },
      };

      process.env.LDAP_OBJECT_FILTER_MAP = JSON.stringify({});

      const entry: Entry = <Entry> {};

      const result: UserMigrationTriggerEvent = handler.generateMigrationEventResponse(entry, eventMock);

      expect(result.response).toHaveProperty('messageAction');
      expect(result.response.messageAction).toBe('SUPPRESS');
    });
  });
});
