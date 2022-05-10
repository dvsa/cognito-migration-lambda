export class UserNotFoundException extends Error {
  private username: string;

  private searchDn: string;

  constructor(userName: string, searchDn?: string, message?: string) {
    super(message);
    this.name = this.constructor.name;
    this.username = userName;
    this.searchDn = searchDn;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserNotFoundException);
    }
  }
}
