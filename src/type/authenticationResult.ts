import { User } from './user';

export interface AuthenticationResult {
  success: boolean,
  message: string,
  user?: User
}
