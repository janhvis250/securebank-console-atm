export type TransactionType =
  | 'ACCOUNT_OPENED'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED';

export interface ITransaction {
  transactionId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  timestamp: Date;
  formattedTimestamp: string;
}

export interface IAccount {
  userId: string;
  pin: string;
  accountHolderName: string;
  balance: number;
  failedAttempts: number;
  isLocked: boolean;
  transactionHistory: ITransaction[];
}

export type ATMStep =
  | 'WELCOME'
  | 'PROMPT_USER_ID'
  | 'PROMPT_PIN'
  | 'MAIN_MENU'
  | 'WITHDRAW_AMOUNT'
  | 'DEPOSIT_AMOUNT'
  | 'TRANSFER_RECIPIENT'
  | 'TRANSFER_AMOUNT'
  | 'CONFIRM_TRANSFER'
  | 'WAIT_ENTER'
  | 'SESSION_QUIT'
  | 'SYSTEM_LOCKED';

export interface TerminalLine {
  id: string;
  text: string;
  type: 'system' | 'prompt' | 'input' | 'error' | 'success' | 'warning' | 'header' | 'menu';
  timestamp?: string;
}

export type ViewMode = 'terminal' | 'hardware' | 'code' | 'accounts';
