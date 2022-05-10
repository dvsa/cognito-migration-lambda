export class InvalidCredentialsException extends Error {
  private username: string;

  private bindDn: string;

  constructor(userName: string, bindDn?: string, message?: string) {
    super(message);
    this.name = this.constructor.name;
    this.username = userName;
    this.bindDn = bindDn;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCredentialsException);
    }
  }
}
