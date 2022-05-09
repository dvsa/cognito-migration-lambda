import { Client, Entry, EqualityFilter, EqualityFilterOptions, FilterParser, RDN } from 'ldapts';
import { InvalidCredentialsError, NoSuchObjectError } from 'ldapts/errors/resultCodeErrors';
import { SecretsManager } from '@dvsa/secrets-manager';
import { Logger } from '../util/logger';
import {
  UserNotFoundException,
  InvalidCredentialsException,
  LdapException,
  UserIdentityAmbiguousException,
} from '../exception';
import { Filter } from 'ldapts/filters/Filter';

export class LdapUserStoreService {
  private readonly logger: Logger;

  private readonly secretsManager: SecretsManager;

  constructor(logger: Logger) {
    this.logger = logger;
    this.secretsManager = new SecretsManager();
  }

  public async getUser(userName: string): Promise<Entry | null> {
    const client = this.createClient();

    const filter: Filter = new EqualityFilter(new class implements EqualityFilterOptions {
      attribute: string = process.env.LDAP_USERNAME_ATTRIBUTE;

      value: string = userName;
    });

    try {
      const ldapAdminPassword: string = await this.getLdapAdminPassword();
      this.logger.trace(`Attempting to BIND on ${process.env.LDAP_URL} with ${process.env.LDAP_ADMIN_DN}`);
      await client.bind(process.env.LDAP_ADMIN_DN, ldapAdminPassword);
      this.logger.trace(
        `Attempting to SEARCH on ${process.env.LDAP_URL}` +
        ` for user '${userName}'` +
        ` using FILTER ${JSON.stringify(filter)}` +
        ` with base DN ${process.env.LDAP_USER_SEARCH_BASE}`,
      );
      const { searchEntries, searchReferences } = await client.search(process.env.LDAP_USER_SEARCH_BASE, {
        filter: filter,
      });

      this.logger.trace(`Search Entries: ${JSON.stringify(searchEntries.map(entry => entry.dn))}`);
      switch (searchEntries.length) {
        case 0:
          throw new UserNotFoundException(userName, process.env.LDAP_USER_SEARCH_BASE, 'Unable to find user');
        case 1:
          const entry: Entry = searchEntries.pop();
          this.logger.trace(`Using Entry: ${entry.dn}`);
          return entry;
        default:
          throw new UserIdentityAmbiguousException(
            userName,
            process.env.LDAP_USER_SEARCH_BASE,
            filter,
            'Identity is ambiguous',
          );
      }
    } catch (e) {
      if (e instanceof UserNotFoundException || e instanceof UserIdentityAmbiguousException) {
        throw e;
      }
      const error: Error = e as Error;
      this.logger.error(error.message);
      throw new LdapException(error.message);
    } finally {
      if (client.isConnected) {
        this.logger.trace(`Attempting to UNBIND on ${process.env.LDAP_URL} with ${process.env.LDAP_ADMIN_DN}`);
        await client.unbind();
      }
    }
  }

  public async authenticate(userName: string, password: string): Promise<Entry> {
    const client = this.createClient();
    let user: Entry;

    try {
      user = await this.getUser(userName);
      this.logger.trace(`Using ${user.dn} for authentication`);
      this.logger.trace(`Attempting to BIND on ${process.env.LDAP_URL} with ${user.dn} using supplied password`);
      await client.bind(user.dn, password);
      return user;
    } catch (e) {
      if (
        e instanceof UserNotFoundException ||
        e instanceof UserIdentityAmbiguousException ||
        e instanceof LdapException
      ) {
        throw e;
      }
      if (e instanceof InvalidCredentialsError) {
        throw new InvalidCredentialsException(userName, user.dn, e.message);
      }
      const error: Error = e as Error;
      this.logger.error(JSON.stringify(error));
      throw new LdapException(error.message);
    } finally {
      if (client.isConnected) {
        this.logger.trace(`Attempting to UNBIND on ${process.env.LDAP_URL} with ${user.dn}`);
        await client.unbind();
      }
    }
  }

  protected createClient(): Client {
    return new Client({
      url: process.env.LDAP_URL,
      timeout: Number(process.env.LDAP_OPERATION_TIMEOUT) || 5000,
    });
  }

  protected async getLdapAdminPassword(): Promise<string> {
    return this.secretsManager.getSecretWithKey(
      process.env.SECRETS_MANAGER_NAME,
      process.env.SECRETS_MANAGER_KEY_LDAP_ADMIN_PASSWORD,
    );
  }
}
