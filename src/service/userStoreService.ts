import { authenticate, LdapAuthenticationError } from 'ldap-authentication';
import { InvalidCredentialsError } from 'ldapjs/lib/errors';
import { Logger } from '../util/logger';
import { User } from '../type/user';
import { AuthenticationResult } from '../type/authenticationResult';

export class UserStoreService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public authenticate(userName: string, password: string): AuthenticationResult {
    const options = {
      ldapOpts: {
        url: process.env.LDAP_URL,
        log: this.logger,
      },
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      userSearchBase: process.env.LDAP_USER_SEARCH_BASE,
      usernameAttribute: process.env.LDAP_USERNAME_ATTRIBUTE,
      username: userName,
      userPassword: password,
    };

    this.logger.debug(`Attempting LDAP authentication with options: ${JSON.stringify(options)}`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      const user: User = authenticate(options);
      return {
        success: true,
        message: 'Authentication Success',
        user,
      } as AuthenticationResult;
    } catch (e) {
      this.logger.debug(`Exception raised when attempting LDAP authentication: ${JSON.stringify(e)}`);
      if (e instanceof InvalidCredentialsError || e instanceof LdapAuthenticationError) {
        return {
          success: false,
          message: 'Invalid Credentials',
        } as AuthenticationResult;
      }
      throw (e);
    }
  }
}
