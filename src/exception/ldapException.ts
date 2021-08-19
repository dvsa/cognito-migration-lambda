export class LdapException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'LdapException';

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, LdapException.prototype);
  }
}
