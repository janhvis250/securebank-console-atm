import {
  ATMStep,
  IAccount,
  ITransaction,
  TerminalLine,
  TransactionType,
} from '../types';
import {
  playCashDispense,
  playErrorBuzz,
  playKeyBeep,
  playSuccessChime,
} from '../utils/audio';

let txIdCounter = 10001;

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export class ATMEngine {
  private accounts: Map<string, IAccount> = new Map();
  private bankName = 'Apex National Bank';
  private currentAccount: IAccount | null = null;
  private currentStep: ATMStep = 'WELCOME';
  private lines: TerminalLine[] = [];
  private pendingTransferRecipient: IAccount | null = null;
  private tempUserIdInput = '';
  private listeners: Array<() => void> = [];

  constructor() {
    this.resetAll();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetAll() {
    txIdCounter = 10001;
    this.accounts.clear();

    // Seed test accounts matching Java Bank.java
    const acc1 = this.createInitialAccount('1001', '1234', 'Alex Morgan', 2500.0);
    const acc2 = this.createInitialAccount('1002', '5678', 'Jordan Lee', 1850.5);
    const acc3 = this.createInitialAccount('1003', '9999', 'Taylor Smith', 10000.0);

    this.accounts.set('1001', acc1);
    this.accounts.set('1002', acc2);
    this.accounts.set('1003', acc3);

    this.currentAccount = null;
    this.currentStep = 'WELCOME';
    this.pendingTransferRecipient = null;
    this.tempUserIdInput = '';
    this.lines = [];

    this.printStartupBanner();
    this.notify();
  }

  private createInitialAccount(
    userId: string,
    pin: string,
    accountHolderName: string,
    initialBalance: number
  ): IAccount {
    const now = new Date();
    const initialTx: ITransaction = {
      transactionId: `TX${txIdCounter++}`,
      type: 'ACCOUNT_OPENED',
      amount: initialBalance,
      balanceAfter: initialBalance,
      description: 'Initial deposit during account setup',
      timestamp: now,
      formattedTimestamp: formatDate(now),
    };

    return {
      userId,
      pin,
      accountHolderName,
      balance: initialBalance,
      failedAttempts: 0,
      isLocked: false,
      transactionHistory: [initialTx],
    };
  }

  public getAccounts(): IAccount[] {
    return Array.from(this.accounts.values());
  }

  public getCurrentAccount(): IAccount | null {
    return this.currentAccount;
  }

  public getCurrentStep(): ATMStep {
    return this.currentStep;
  }

  public getLines(): TerminalLine[] {
    return this.lines;
  }

  public getBankName(): string {
    return this.bankName;
  }

  private addLine(
    text: string,
    type: TerminalLine['type'] = 'system',
    timestamp?: string
  ) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.lines.push({ id, text, type, timestamp });
  }

  private printStartupBanner() {
    this.addLine('============================================================', 'header');
    this.addLine(`               WELCOME TO ${this.bankName.toUpperCase()}`, 'header');
    this.addLine('                SECURE AUTOMATED TELLER MACHINE            ', 'header');
    this.addLine('============================================================', 'header');
    this.addLine('ATM System Ready. Object-Oriented Java Simulation v2.4 initialized.', 'system');
    this.addLine('Connected to Bank Repository (3 Customer Accounts Loaded)', 'system');
    this.addLine('');
    this.addLine('-------------------- USER AUTHENTICATION -------------------', 'header');
    this.addLine('Enter User ID: ', 'prompt');
    this.currentStep = 'PROMPT_USER_ID';
  }

  private printMainMenu() {
    if (!this.currentAccount) return;
    this.addLine('');
    this.addLine('======================= ATM MAIN MENU ======================', 'header');
    this.addLine(
      ` Account Holder: ${this.currentAccount.accountHolderName} | User ID: ${this.currentAccount.userId}`,
      'system'
    );
    this.addLine(
      ` Current Available Balance: ${formatCurrency(this.currentAccount.balance)}`,
      'success'
    );
    this.addLine('------------------------------------------------------------', 'system');
    this.addLine(' 1. Transaction History', 'menu');
    this.addLine(' 2. Withdraw', 'menu');
    this.addLine(' 3. Deposit', 'menu');
    this.addLine(' 4. Transfer', 'menu');
    this.addLine(' 5. Quit', 'menu');
    this.addLine('============================================================', 'header');
    this.addLine('Enter your choice (1-5): ', 'prompt');
    this.currentStep = 'MAIN_MENU';
  }

  public handleInput(rawInput: string) {
    const trimmed = rawInput.trim();
    playKeyBeep();

    // Log the user typed command
    const isMaskedPin = this.currentStep === 'PROMPT_PIN';
    const displayInput = isMaskedPin ? '*'.repeat(trimmed.length) : trimmed;
    this.addLine(`> ${displayInput}`, 'input');

    switch (this.currentStep) {
      case 'PROMPT_USER_ID':
        this.processUserId(trimmed);
        break;

      case 'PROMPT_PIN':
        this.processPin(trimmed);
        break;

      case 'MAIN_MENU':
        this.processMenuChoice(trimmed);
        break;

      case 'WITHDRAW_AMOUNT':
        this.processWithdrawal(trimmed);
        break;

      case 'DEPOSIT_AMOUNT':
        this.processDeposit(trimmed);
        break;

      case 'TRANSFER_RECIPIENT':
        this.processTransferRecipient(trimmed);
        break;

      case 'TRANSFER_AMOUNT':
        this.processTransferAmount(trimmed);
        break;

      case 'WAIT_ENTER':
        this.printMainMenu();
        break;

      case 'SESSION_QUIT':
      case 'SYSTEM_LOCKED':
        // Ask if want to restart
        if (
          trimmed.toLowerCase() === 'y' ||
          trimmed.toLowerCase() === 'yes' ||
          trimmed === '1'
        ) {
          this.currentAccount = null;
          this.pendingTransferRecipient = null;
          this.addLine('\n--- Restarting ATM Session ---', 'system');
          this.printStartupBanner();
        } else {
          this.addLine('[SYSTEM] ATM in Idle Standby. Type "start" to begin new session.', 'system');
        }
        break;

      default:
        this.printMainMenu();
        break;
    }

    this.notify();
  }

  private processUserId(userId: string) {
    if (!userId) {
      playErrorBuzz();
      this.addLine('[ERROR] User ID cannot be blank. Enter User ID: ', 'error');
      return;
    }

    const account = this.accounts.get(userId);
    if (!account) {
      playErrorBuzz();
      this.addLine(`[ERROR] Account not found for User ID: ${userId}`, 'error');
      this.addLine('Available demo IDs: 1001 (Alex), 1002 (Jordan), 1003 (Taylor)', 'system');
      this.addLine('Enter User ID: ', 'prompt');
      return;
    }

    if (account.isLocked) {
      playErrorBuzz();
      this.addLine('[SECURITY ALERT] This account is LOCKED due to 3 failed attempts.', 'error');
      this.addLine('Please unlock via Bank Accounts Inspector or contact Customer Support.', 'warning');
      this.addLine('Enter User ID: ', 'prompt');
      return;
    }

    this.tempUserIdInput = userId;
    const remaining = 3 - account.failedAttempts;
    this.addLine(`Enter 4-Digit PIN (${remaining} attempts remaining): `, 'prompt');
    this.currentStep = 'PROMPT_PIN';
  }

  private processPin(pin: string) {
    const account = this.accounts.get(this.tempUserIdInput);
    if (!account) {
      this.currentStep = 'PROMPT_USER_ID';
      this.addLine('Enter User ID: ', 'prompt');
      return;
    }

    if (account.isLocked) {
      playErrorBuzz();
      this.addLine('[SECURITY ALERT] Account has been locked.', 'error');
      this.currentStep = 'PROMPT_USER_ID';
      this.addLine('Enter User ID: ', 'prompt');
      return;
    }

    if (account.pin === pin) {
      // Authentication success
      account.failedAttempts = 0;
      this.currentAccount = account;
      playSuccessChime();
      this.addLine(
        `\n>>> Authentication Successful! Welcome, ${account.accountHolderName}.`,
        'success'
      );
      this.printMainMenu();
    } else {
      account.failedAttempts += 1;
      playErrorBuzz();
      const remaining = 3 - account.failedAttempts;

      if (account.failedAttempts >= 3) {
        account.isLocked = true;
        this.addLine('\n[SECURITY ALERT] Maximum 3 incorrect attempts reached!', 'error');
        this.addLine('>>> ACCESS DENIED: Account has been temporarily locked for security.', 'error');
        this.addLine('Transaction terminated. Return to start? (y/n): ', 'prompt');
        this.currentStep = 'SYSTEM_LOCKED';
      } else {
        this.addLine(
          `[ERROR] Incorrect PIN. Attempts remaining: ${remaining}`,
          'warning'
        );
        this.addLine('Enter 4-Digit PIN: ', 'prompt');
      }
    }
  }

  private processMenuChoice(choice: string) {
    if (!this.currentAccount) return;

    switch (choice) {
      case '1':
        this.displayTransactionHistory();
        break;

      case '2':
        this.addLine('\n---------------------- WITHDRAW FUNDS ----------------------', 'header');
        this.addLine(
          `Current Available Balance: ${formatCurrency(this.currentAccount.balance)}`,
          'system'
        );
        this.addLine('Enter amount to withdraw ($): ', 'prompt');
        this.currentStep = 'WITHDRAW_AMOUNT';
        break;

      case '3':
        this.addLine('\n----------------------- DEPOSIT FUNDS ----------------------', 'header');
        this.addLine(
          `Current Available Balance: ${formatCurrency(this.currentAccount.balance)}`,
          'system'
        );
        this.addLine('Enter amount to deposit ($): ', 'prompt');
        this.currentStep = 'DEPOSIT_AMOUNT';
        break;

      case '4':
        this.addLine('\n---------------------- TRANSFER FUNDS ----------------------', 'header');
        this.addLine(
          `Current Available Balance: ${formatCurrency(this.currentAccount.balance)}`,
          'system'
        );
        this.addLine('Enter Recipient User ID: ', 'prompt');
        this.currentStep = 'TRANSFER_RECIPIENT';
        break;

      case '5':
        this.displayQuitMessage();
        break;

      default:
        playErrorBuzz();
        this.addLine(
          '[ERROR] Invalid option selected! Please choose a number between 1 and 5.',
          'error'
        );
        this.addLine('Enter your choice (1-5): ', 'prompt');
        break;
    }
  }

  private displayTransactionHistory() {
    if (!this.currentAccount) return;

    this.addLine('\n------------------- TRANSACTION HISTORY --------------------', 'header');
    const history = this.currentAccount.transactionHistory;

    if (history.length === 0) {
      this.addLine('No transactions found for this account.', 'system');
    } else {
      this.addLine(`Total Recorded Transactions: ${history.length}`, 'system');
      this.addLine('------------------------------------------------------------', 'system');
      history.forEach((tx) => {
        const sign = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED' ? '+' : '-';
        this.addLine(
          `[${tx.formattedTimestamp}] ID: ${tx.transactionId} | ${tx.type.padEnd(16)} | ${sign}${formatCurrency(
            tx.amount
          )} | Bal: ${formatCurrency(tx.balanceAfter)} | ${tx.description}`,
          tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
            ? 'success'
            : tx.type === 'ACCOUNT_OPENED'
            ? 'system'
            : 'warning'
        );
      });
    }

    this.addLine(`\nAvailable Balance: ${formatCurrency(this.currentAccount.balance)}`, 'success');
    this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
    this.currentStep = 'WAIT_ENTER';
  }

  private processWithdrawal(amountStr: string) {
    if (!this.currentAccount) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      playErrorBuzz();
      this.addLine('[ERROR] Invalid amount! Please enter a valid positive number.', 'error');
      this.addLine('Enter amount to withdraw ($): ', 'prompt');
      return;
    }

    // Exact balance check requirement:
    // [ ] Balance check before any withdrawal or transfer; display "Insufficient Funds" if balance is too low
    if (amount > this.currentAccount.balance) {
      playErrorBuzz();
      this.addLine('\n[TRANSACTION REJECTED] Insufficient Funds!', 'error');
      this.addLine(
        `Requested: ${formatCurrency(amount)} | Available Balance: ${formatCurrency(
          this.currentAccount.balance
        )}`,
        'warning'
      );
      this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
      this.currentStep = 'WAIT_ENTER';
      return;
    }

    // Process withdrawal
    this.currentAccount.balance -= amount;
    const now = new Date();
    const tx: ITransaction = {
      transactionId: `TX${txIdCounter++}`,
      type: 'WITHDRAWAL',
      amount,
      balanceAfter: this.currentAccount.balance,
      description: 'ATM Cash Dispensed',
      timestamp: now,
      formattedTimestamp: formatDate(now),
    };
    this.currentAccount.transactionHistory.push(tx);

    playCashDispense();
    this.addLine(`\n>>> [SUCCESS] Please collect your cash: ${formatCurrency(amount)}`, 'success');
    this.addLine(
      `Updated New Balance: ${formatCurrency(this.currentAccount.balance)}`,
      'system'
    );
    this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
    this.currentStep = 'WAIT_ENTER';
  }

  private processDeposit(amountStr: string) {
    if (!this.currentAccount) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      playErrorBuzz();
      this.addLine('[ERROR] Invalid deposit amount! Please enter a positive number.', 'error');
      this.addLine('Enter amount to deposit ($): ', 'prompt');
      return;
    }

    this.currentAccount.balance += amount;
    const now = new Date();
    const tx: ITransaction = {
      transactionId: `TX${txIdCounter++}`,
      type: 'DEPOSIT',
      amount,
      balanceAfter: this.currentAccount.balance,
      description: 'ATM Cash/Check Deposit',
      timestamp: now,
      formattedTimestamp: formatDate(now),
    };
    this.currentAccount.transactionHistory.push(tx);

    playSuccessChime();
    this.addLine(
      `\n>>> [SUCCESS] Deposit processed successfully: ${formatCurrency(amount)}`,
      'success'
    );
    this.addLine(
      `Updated New Balance: ${formatCurrency(this.currentAccount.balance)}`,
      'system'
    );
    this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
    this.currentStep = 'WAIT_ENTER';
  }

  private processTransferRecipient(recipientId: string) {
    if (!this.currentAccount) return;

    if (!recipientId) {
      playErrorBuzz();
      this.addLine('[ERROR] Recipient ID cannot be blank. Enter Recipient User ID: ', 'error');
      return;
    }

    if (recipientId === this.currentAccount.userId) {
      playErrorBuzz();
      this.addLine('[ERROR] You cannot transfer funds to your own account.', 'error');
      this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
      this.currentStep = 'WAIT_ENTER';
      return;
    }

    const recipient = this.accounts.get(recipientId);
    if (!recipient) {
      playErrorBuzz();
      this.addLine(`[ERROR] Recipient account not found for User ID: ${recipientId}`, 'error');
      this.addLine('Available accounts: 1001, 1002, 1003', 'system');
      this.addLine('Enter Recipient User ID: ', 'prompt');
      return;
    }

    this.pendingTransferRecipient = recipient;
    this.addLine(
      `Recipient Verified: ${recipient.accountHolderName} (User ID: ${recipient.userId})`,
      'success'
    );
    this.addLine('Enter amount to transfer ($): ', 'prompt');
    this.currentStep = 'TRANSFER_AMOUNT';
  }

  private processTransferAmount(amountStr: string) {
    if (!this.currentAccount || !this.pendingTransferRecipient) {
      this.printMainMenu();
      return;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      playErrorBuzz();
      this.addLine('[ERROR] Invalid amount! Please enter a valid currency number.', 'error');
      this.addLine('Enter amount to transfer ($): ', 'prompt');
      return;
    }

    // Balance Check
    if (amount > this.currentAccount.balance) {
      playErrorBuzz();
      this.addLine('\n[TRANSACTION REJECTED] Insufficient Funds!', 'error');
      this.addLine(
        `Transfer Amount: ${formatCurrency(amount)} | Available Balance: ${formatCurrency(
          this.currentAccount.balance
        )}`,
        'warning'
      );
      this.pendingTransferRecipient = null;
      this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
      this.currentStep = 'WAIT_ENTER';
      return;
    }

    const recipient = this.pendingTransferRecipient;
    const now = new Date();

    // Debit sender
    this.currentAccount.balance -= amount;
    const senderTx: ITransaction = {
      transactionId: `TX${txIdCounter++}`,
      type: 'TRANSFER_SENT',
      amount,
      balanceAfter: this.currentAccount.balance,
      description: `Transfer to User ID: ${recipient.userId} (${recipient.accountHolderName})`,
      timestamp: now,
      formattedTimestamp: formatDate(now),
    };
    this.currentAccount.transactionHistory.push(senderTx);

    // Credit recipient
    recipient.balance += amount;
    const recipientTx: ITransaction = {
      transactionId: `TX${txIdCounter++}`,
      type: 'TRANSFER_RECEIVED',
      amount,
      balanceAfter: recipient.balance,
      description: `Transfer from User ID: ${this.currentAccount.userId} (${this.currentAccount.accountHolderName})`,
      timestamp: now,
      formattedTimestamp: formatDate(now),
    };
    recipient.transactionHistory.push(recipientTx);

    playSuccessChime();
    this.addLine(
      `\n>>> [SUCCESS] Transferred ${formatCurrency(amount)} to ${
        recipient.accountHolderName
      } (ID: ${recipient.userId}).`,
      'success'
    );
    this.addLine(
      `Updated New Balance: ${formatCurrency(this.currentAccount.balance)}`,
      'system'
    );

    this.pendingTransferRecipient = null;
    this.addLine('\nPress Enter to return to Main Menu...', 'prompt');
    this.currentStep = 'WAIT_ENTER';
  }

  private displayQuitMessage() {
    if (!this.currentAccount) return;

    playSuccessChime();
    this.addLine('\n============================================================', 'header');
    this.addLine(` Thank you for banking with ${this.bankName}!`, 'header');
    this.addLine(' Please remove your ATM card and transaction receipt.', 'system');
    this.addLine(` Goodbye, ${this.currentAccount.accountHolderName}!`, 'success');
    this.addLine('============================================================', 'header');
    this.addLine('\nReturn to main login screen? (y/n): ', 'prompt');
    this.currentAccount = null;
    this.currentStep = 'SESSION_QUIT';
  }

  public unlockAccount(userId: string) {
    const acc = this.accounts.get(userId);
    if (acc) {
      acc.isLocked = false;
      acc.failedAttempts = 0;
      this.addLine(`[ADMIN] Account ${userId} (${acc.accountHolderName}) unlocked and attempts reset.`, 'success');
      this.notify();
    }
  }

  public fastLogin(userId: string, pin: string) {
    this.currentAccount = null;
    this.currentStep = 'PROMPT_USER_ID';
    this.handleInput(userId);
    this.handleInput(pin);
  }

  public clearScreen() {
    this.lines = [];
    if (this.currentAccount) {
      this.printMainMenu();
    } else {
      this.printStartupBanner();
    }
    this.notify();
  }
}

export const atmEngine = new ATMEngine();
