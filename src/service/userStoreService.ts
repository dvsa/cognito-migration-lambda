import { Client, Entry } from 'ldapts';
import { Logger } from '../util/logger';
import { AuthenticationResult } from '../type/authenticationResult';

export class UserStoreService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async authenticate(userName: string, password: string): Promise<AuthenticationResult> {
    const client = new Client({
      url: process.env.LDAP_URL,
    });

    const bindDn = `${process.env.LDAP_USERNAME_ATTRIBUTE}=${userName},${process.env.LDAP_USER_SEARCH_BASE}`;

    try {
      await client.bind(bindDn, password);
      const { searchEntries } = await client.search(bindDn);
      this.logger.debug(JSON.stringify(searchEntries));
      const entry: Entry = searchEntries.pop();

      return {
        success: true,
        message: 'Authentication Success',
        entry,
      } as AuthenticationResult;
    } catch (e) {
      this.logger.error(e);
      return {
        success: false,
        message: 'Invalid Credentials',
      } as AuthenticationResult;
    } finally {
      await client.unbind();
    }
  }
}
