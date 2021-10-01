import type {
  UserMigrationTriggerEvent,
  Context, UserMigrationAuthenticationTriggerEvent, UserMigrationForgotPasswordTriggerEvent,
} from 'aws-lambda';
import { Entry } from 'ldapts';
import { createLogger, Logger } from '../util/logger';
import { LdapUserStoreService } from '../service/ldapUserStoreService';

export const generateMigrationEventResponse = (
  user: Entry,
  event: UserMigrationTriggerEvent,
): UserMigrationTriggerEvent => {
  const map: Record<string, string> = JSON.parse(process.env.LDAP_OBJECT_FILTER_MAP) as Record<string, string>;
  const attributes: Record<string, string> = {};
  for (let i = 0; i < Object.keys(user).length; i++) {
    const key: string = Object.keys(user)[Number(i)];
    if (key in map) {
      attributes[map[key.toString()]] = user[key.toString()].toString();
      if (key === 'mail') {
        const email = user[key.toString()];
        if (email != null && email.length > 0) {
          attributes.email_verified = 'true';
        }
      }
    }
  }
  event.response.userAttributes = attributes;
  event.response.finalUserStatus = 'CONFIRMED';
  event.response.messageAction = 'SUPPRESS';

  return event;
};

export const migrateUserAuthentication = async (
  event: UserMigrationAuthenticationTriggerEvent,
  logger: Logger,
): Promise<UserMigrationAuthenticationTriggerEvent> => {
  const userStoreService = new LdapUserStoreService(logger);
  const user = await userStoreService.authenticate(event.userName, event.request.password);
  return generateMigrationEventResponse(user, event) as UserMigrationAuthenticationTriggerEvent;
};

export const migrateUserForgotPassword = async (
  event: UserMigrationForgotPasswordTriggerEvent,
  logger: Logger,
): Promise<UserMigrationForgotPasswordTriggerEvent> => {
  const userStoreService = new LdapUserStoreService(logger);
  const user = await userStoreService.getUser(event.userName);
  return generateMigrationEventResponse(user, event) as UserMigrationForgotPasswordTriggerEvent;
};

/**
 * Lambda Handler
 *
 * @param {UserMigrationTriggerEvent} event
 * @param {Context} context
 * @returns void
 */
export const lambdaHandler = async (
  event: UserMigrationTriggerEvent,
  context: Context,
): Promise<UserMigrationTriggerEvent> => {
  const logger: Logger = createLogger(context);

  switch (event.triggerSource) {
    case 'UserMigration_Authentication':
      return migrateUserAuthentication(event, logger);
    case 'UserMigration_ForgotPassword':
      return migrateUserForgotPassword(event, logger);
    default:
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Bad triggerSource: ${event.triggerSource}`);
  }
};
