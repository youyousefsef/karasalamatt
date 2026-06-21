export interface GenerateOTPRequest {
  phone_number: string;
}

export interface GenerateOTPResponse {
  ok: boolean;
  message: string;
  phone_number: string;
  expires_in: number;
}

export interface CreateUserRequest {
  name: string;
  fullname: string;
  phone_number: string;
  otp_code: string;
}

export interface CreateUserResponse {
  role: string;
  phone_number: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AddRoleRequest {
  phone_number: string;
  role: string;
}

export interface HSEReg {
  id: number;
  phone_num: string;
  role: string;
  owner_id: number;
}

export interface UserInfo {
  phone_number: string;
  id: number;
  user_role: string;
  subb: number;
}

export interface HSEData {
  id: number;
  supervisor_id: number;
  metric: string;
  value: string;
  created_at: string;
}
