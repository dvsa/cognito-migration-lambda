import type {
  UserMigrationTriggerEvent,
  Context, UserMigrationAuthenticationTriggerEvent, UserMigrationForgotPasswordTriggerEvent,
} from 'aws-lambda';
import { createLogger, Logger } from '../util/logger';
import { UserStoreService } from '../service/userStoreService';

async function migrateUserAuthentication(
  event: UserMigrationAuthenticationTriggerEvent,
  logger: Logger,
): Promise<UserMigrationAuthenticationTriggerEvent> {
  const userStoreService = new UserStoreService(logger);
  const authenticationResult = await userStoreService.authenticate(event.userName, event.request.password);

  if (authenticationResult.success === false) {
    throw new Error('Invalid Credentials');
  }

  const { user } = authenticationResult;

  // TODO: Make configurable.
  const map = {
    email: user.mail,
    email_verified: 'true',
  };

  event.response.userAttributes = map;
  event.response.finalUserStatus = 'CONFIRMED';
  event.response.messageAction = 'SUPPRESS';

  return event;
}

async function migrateUserForgotPassword(
  event: UserMigrationForgotPasswordTriggerEvent,
  logger: Logger,
): Promise<UserMigrationForgotPasswordTriggerEvent> {
  const userStoreService = new UserStoreService(logger);
  const authenticationResult = await userStoreService.authenticate(event.userName, event.request.password);

  throw new Error('Not Implemented');

  return event;
}

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
  const logger: Logger = createLogger(null, context);

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
