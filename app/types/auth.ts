export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminRegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  code?: string;
}

export interface AdminRefreshTokenDto {
  refreshToken: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  code: string | null;
  firstNameLastName: string;
  lastNameFirstName: string;
  status: string;
  lastLogin: string | null;
}

export interface AuthResponse {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
