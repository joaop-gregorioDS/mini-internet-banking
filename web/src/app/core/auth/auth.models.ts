export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isDemo: boolean;
}

/** Contrato de resposta de /api/auth/* (ver AuthResponse na API). */
export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  cpf: string;
  email: string;
  password: string;
}
