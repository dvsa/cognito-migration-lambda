import { Filter } from 'ldapts/filters/Filter';

export class UserIdentityAmbiguousException extends Error {
  private username: string;

  private filter: Filter;

  private searchDn: string;

  constructor(userName: string, searchDn?: string, filter?: Filter, message?: string) {
    super(message);
    this.name = this.constructor.name;
    this.username = userName;
    this.searchDn = searchDn;
    this.filter = filter;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserIdentityAmbiguousException);
    }
  }
}
