export class LdapException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LdapException);
    }
  }
}
