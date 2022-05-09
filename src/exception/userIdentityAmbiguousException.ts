import { Filter } from "ldapts/filters/Filter";

export class UserIdentityAmbiguousException extends Error {
  private username: string;
  private filter: Filter;
  private searchDn: string;

  constructor(userName: string, searchDn?: string, filter?: Filter, message?: string) {
    super(message);
    this.name = 'UserNotFoundException';
    this.username = userName;
    this.searchDn = searchDn;
    this.filter = filter;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserIdentityAmbiguousException.prototype);
  }
}
