import { Client, Entry } from 'ldapts';
import { InvalidCredentialsError, NoSuchObjectError } from 'ldapts/errors/resultCodeErrors';
import { Logger } from '../util/logger';
import { UserNotFoundException, InvalidCredentialsException, LdapException } from '../exception';

export class LdapUserStoreService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async getUser(userName: string): Promise<Entry | null> {
    const client = new Client({
      url: process.env.LDAP_URL,
    });

    const searchDn = `${process.env.LDAP_USERNAME_ATTRIBUTE}=${userName},${process.env.LDAP_USER_SEARCH_BASE}`;

    try {
      this.logger.trace(`Attempting to BIND on ${process.env.LDAP_URL} with ${process.env.LDAP_ADMIN_DN}`);
      await client.bind(process.env.LDAP_ADMIN_DN, process.env.LDAP_ADMIN_PASSWORD);
      this.logger.trace(`Attempting to SEARCH on ${process.env.LDAP_URL} with ${searchDn}`);
      const { searchEntries } = await client.search(searchDn);
      this.logger.trace(`Search Entries: ${JSON.stringify(searchEntries)}`);
      const entry: Entry = searchEntries.pop();
      this.logger.trace(`Using Entry: ${JSON.stringify(entry)}`);
      return entry;
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        throw new UserNotFoundException(userName, searchDn, e.message);
      }
      const error: Error = e as Error;
      this.logger.error(JSON.stringify(error));
      throw new LdapException(error.message);
    } finally {
      this.logger.trace(`Attempting to UNBIND on ${process.env.LDAP_URL} with ${process.env.LDAP_ADMIN_DN}`);
      await client.unbind();
    }
  }

  public async authenticate(userName: string, password: string): Promise<Entry> {
    const client = new Client({
      url: process.env.LDAP_URL,
    });

    const bindDn = `${process.env.LDAP_USERNAME_ATTRIBUTE}=${userName},${process.env.LDAP_USER_SEARCH_BASE}`;

    try {
      const user: Entry = await this.getUser(userName);
      this.logger.trace(`Attempting to BIND on ${process.env.LDAP_URL} with ${bindDn}`);
      await client.bind(bindDn, password);
      return user;
    } catch (e) {
      if (e instanceof UserNotFoundException || e instanceof LdapException) {
        throw e;
      }
      if (e instanceof InvalidCredentialsError) {
        throw new InvalidCredentialsException(userName, bindDn, e.message);
      }
      const error: Error = e as Error;
      this.logger.error(JSON.stringify(error));
      throw new LdapException(error.message);
    } finally {
      this.logger.trace(`Attempting to UNBIND on ${process.env.LDAP_URL} with ${bindDn}`);
      await client.unbind();
    }
  }
}
