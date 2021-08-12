export class UserNotFoundException extends Error {
  private username: string;

  private searchDn: string;

  constructor(userName: string, searchDn?: string, message?: string) {
    super(message);
    this.name = 'UserNotFoundException';
    this.username = userName;
    this.searchDn = searchDn;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserNotFoundException.prototype);
  }
}
