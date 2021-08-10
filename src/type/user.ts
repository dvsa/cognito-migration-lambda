export interface User {
  dn: string,
  controls: [],
  cn: string,
  mail?: string,
  objectClass: string[],
  userPassword: string,
  sn: string
}
