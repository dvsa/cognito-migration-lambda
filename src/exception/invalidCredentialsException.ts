export class InvalidCredentialsException extends Error {
  private username: string;

  private bindDn: string;

  constructor(userName: string, bindDn?: string, message?: string) {
    super(message);
    this.name = 'InvalidCredentialsException';
    this.username = userName;
    this.bindDn = bindDn;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidCredentialsException.prototype);
  }
}
