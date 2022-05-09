// eslint-disable-next-line max-classes-per-file
import { Client, Entry } from 'ldapts';
import { InvalidCredentialsError, NoSuchObjectError } from 'ldapts/errors/resultCodeErrors';
import { LdapUserStoreService } from '../../src/service/ldapUserStoreService';
import { Logger } from '../../src/util/logger';
import {
  InvalidCredentialsException,
  LdapException,
  UserIdentityAmbiguousException,
  UserNotFoundException,
} from '../../src/exception';

jest.mock('../../src/util/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  })),
}));

jest.mock('ldapts/Client');
jest.mock('@dvsa/secrets-manager');

describe('Test ldapUserStoreService', () => {
  afterEach(() => {
    jest.resetModules();
  });

  describe('User Searching', () => {
    test('Searching for a username that exists returns a LDAP Entry', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      const entry: Entry = new class implements Entry {
        [index: string]: Buffer | Buffer[] | string[] | string;

        dn: string;
      }();

      Client.prototype.search = jest.fn().mockImplementation(
        () => ({
          searchEntries: [entry],
        }),
      );

      expect(await sut.getUser('test')).toBe(entry);
    });
    test('Searching for a username multiple results throws UserIdentityAmbiguousException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      const entry: Entry = new class implements Entry {
        [index: string]: Buffer | Buffer[] | string[] | string;

        dn: string;
      }();

      Client.prototype.search = jest.fn().mockImplementation(
        () => ({
          searchEntries: [entry, entry],
        }),
      );

      await expect(async () => {
        await sut.getUser('test');
      }).rejects.toThrow(UserIdentityAmbiguousException);
    });
    test('Searching for a username that DOES NOT exist throws UserNotFoundException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      Client.prototype.search = jest.fn().mockImplementation(
        () => ({
          searchEntries: [],
        }),
      );

      await expect(async () => {
        await sut.getUser('test');
      }).rejects.toThrow(UserNotFoundException);
    });
    test('Searching for a username that throws an unexpected exception throws LdapException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      Client.prototype.search = jest.fn().mockImplementation(
        () => {
          throw new Error();
        },
      );

      await expect(async () => {
        await sut.getUser('test');
      }).rejects.toThrow(LdapException);
    });
  });
  describe('User Authentication', () => {
    test('Authenticating with a valid username and password returns a LDAP Entry', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      const entry: Entry = new class implements Entry {
        [index: string]: Buffer | Buffer[] | string[] | string;

        dn: string;
      }();

      sut.getUser = jest.fn().mockImplementation(
        () => entry,
      );

      expect(await sut.authenticate('test', 'test')).toBe(entry);
    });
    test('Authenticating with a user which DOES NOT exist throws UserNotFoundException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      sut.getUser = jest.fn().mockImplementation(
        () => {
          throw new UserNotFoundException('test');
        },
      );

      await expect(async () => {
        await sut.authenticate('test', 'test');
      }).rejects.toThrow(UserNotFoundException);
    });
    test('Authenticating with a valid user and incorrect password throws InvalidCredentialsException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      sut.getUser = jest.fn().mockImplementation(
        () => true,
      );

      Client.prototype.bind = jest.fn().mockImplementation(
        () => {
          throw new InvalidCredentialsError();
        },
      );

      await expect(async () => {
        await sut.authenticate('test', 'test');
      }).rejects.toThrow(InvalidCredentialsException);
    });
    test('Authenticating that throws an unexpected exception throws LdapException', async () => {
      const logger: Logger = new Logger('');
      const sut = new LdapUserStoreService(logger);

      sut.getUser = jest.fn().mockImplementation(
        () => true,
      );

      Client.prototype.bind = jest.fn().mockImplementation(
        () => {
          throw new Error();
        },
      );

      await expect(async () => {
        await sut.authenticate('test', 'test');
      }).rejects.toThrow(LdapException);
    });
  });
});
