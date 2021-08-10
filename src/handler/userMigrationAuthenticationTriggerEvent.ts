import type {
  BaseUserMigrationTriggerEvent,
  Callback,
  Context,
} from 'aws-lambda';
import { createLogger, Logger } from '../util/logger';
import { UserStoreService } from '../service/userStoreService';

/**
 * Lambda Handler
 *
 * @param {BaseUserMigrationTriggerEvent} event
 * @param {Context} context
 * @param callback
 * @returns void
 */
export const handler = (
  event: BaseUserMigrationTriggerEvent<string>,
  context: Context,
  callback: Callback,
): void => {
  const logger: Logger = createLogger(null, context);
  const userStoreService = new UserStoreService(logger);
  const authenticationResult = userStoreService.authenticate(event.userName, event.request.password);

  if (event.triggerSource !== 'UserMigration_Authentication') {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Bad triggerSource ${event.triggerSource}`);
  }

  if (authenticationResult.success === true) {
    if (authenticationResult.user.mail !== undefined && authenticationResult.user.mail !== '') {
      event.response.userAttributes = {
        email: authenticationResult.user.mail,
        email_verified: 'true',
      };
    }
    event.response.finalUserStatus = 'CONFIRMED';
    event.response.messageAction = 'SUPPRESS';
    context.succeed(event);
  }
  callback('Invalid Credentials');
};
