export type EntryType = 'Income' | 'Expense';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
}

export interface UpdateEntryRequest {
  type: EntryType;
  amount: number;
  category: string;
  description?: string;
}

export interface CreateEntryRequest {
  type: EntryType;
  amount: number;
  category: string;
  description?: string;
}

export interface EntryDto {
  id: string;
  type: EntryType;
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}
