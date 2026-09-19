export interface JavaClassFile {
  id: string;
  name: string;
  filename: string;
  package: string;
  role: string;
  oopConcepts: string[];
  description: string;
  code: string;
}

export const JAVA_CLASSES: JavaClassFile[] = [
  {
    id: 'transaction',
    name: 'Transaction',
    filename: 'Transaction.java',
    package: 'atm',
    role: 'Model / Value Object',
    oopConcepts: ['Encapsulation', 'Immutability', 'toString() Overriding', 'Audit Security'],
    description: 'Models individual financial transactions. Fields are private and final to maintain an immutable audit trail. Overrides toString() for formatted console printing.',
    code: `package atm;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Transaction Class
 * Represents an individual financial transaction performed in the ATM.
 * Demonstrates Object-Oriented principles: Encapsulation with private fields
 * and public getters, and immutability for audit trail security.
 */
public class Transaction {
    private static int idCounter = 10001;
    
    private final String transactionId;
    private final String type; // "DEPOSIT", "WITHDRAWAL", "TRANSFER_SENT", "TRANSFER_RECEIVED"
    private final double amount;
    private final double balanceAfter;
    private final String description;
    private final LocalDateTime timestamp;

    public Transaction(String type, double amount, double balanceAfter, String description) {
        this.transactionId = "TX" + (++idCounter);
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.timestamp = LocalDateTime.now();
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getType() {
        return type;
    }

    public double getAmount() {
        return amount;
    }

    public double getBalanceAfter() {
        return balanceAfter;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getFormattedTimestamp() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return timestamp.format(formatter);
    }

    @Override
    public String toString() {
        return String.format("[%s] ID: %s | %-16s | Amount: $%,10.2f | Balance: $%,10.2f | %s",
                getFormattedTimestamp(),
                transactionId,
                type,
                amount,
                balanceAfter,
                description);
    }
}`
  },
  {
    id: 'account',
    name: 'Account',
    filename: 'Account.java',
    package: 'atm',
    role: 'Domain Entity',
    oopConcepts: ['Encapsulation', 'Data Validation', 'Collections (ArrayList)', 'Defensive Copying'],
    description: 'Encapsulates account holder state, balance, security lock flags, and an internal ArrayList of Transactions. Validates sufficient balance before withdrawals and transfers.',
    code: `package atm;

import java.util.ArrayList;

/**
 * Account Class
 * Encapsulates the bank account state: account holder, credentials,
 * current balance, and an ArrayList of past transactions.
 * Enforces data validation and business rules (e.g., balance check before withdrawal/transfer).
 */
public class Account {
    private final String userId;
    private String pin;
    private final String accountHolderName;
    private double balance;
    private final ArrayList<Transaction> transactionHistory;
    private int failedAttempts;
    private boolean isLocked;

    public static final int MAX_FAILED_ATTEMPTS = 3;

    public Account(String userId, String pin, String accountHolderName, double initialBalance) {
        this.userId = userId;
        this.pin = pin;
        this.accountHolderName = accountHolderName;
        this.balance = Math.max(0.0, initialBalance);
        this.transactionHistory = new ArrayList<>();
        this.failedAttempts = 0;
        this.isLocked = false;

        // Record opening balance transaction
        if (this.balance > 0) {
            this.transactionHistory.add(new Transaction(
                "ACCOUNT_OPENED",
                this.balance,
                this.balance,
                "Initial deposit during account setup"
            ));
        }
    }

    // --- Authentication & Security Methods ---

    public boolean validatePin(String inputPin) {
        if (isLocked) {
            return false;
        }

        if (this.pin.equals(inputPin)) {
            this.failedAttempts = 0; // Reset upon successful authentication
            return true;
        } else {
            this.failedAttempts++;
            if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                this.isLocked = true;
            }
            return false;
        }
    }

    public void resetLockout() {
        this.failedAttempts = 0;
        this.isLocked = false;
    }

    // --- Banking Transactions ---

    /**
     * Deposits money into the account and records a transaction in the ArrayList.
     */
    public boolean deposit(double amount) {
        if (amount <= 0) {
            return false;
        }
        this.balance += amount;
        Transaction tx = new Transaction("DEPOSIT", amount, this.balance, "ATM Cash/Check Deposit");
        this.transactionHistory.add(tx);
        return true;
    }

    /**
     * Withdraws money from the account after validating sufficient funds.
     * Records a transaction in the ArrayList upon success.
     */
    public boolean withdraw(double amount) {
        if (amount <= 0 || amount > this.balance) {
            return false;
        }
        this.balance -= amount;
        Transaction tx = new Transaction("WITHDRAWAL", amount, this.balance, "ATM Cash Dispensed");
        this.transactionHistory.add(tx);
        return true;
    }

    /**
     * Transfers money to a recipient account after validating balance.
     * Updates both accounts and logs corresponding transactions in both ArrayLists.
     */
    public boolean transfer(Account recipient, double amount) {
        if (recipient == null || recipient == this) {
            return false;
        }
        if (amount <= 0 || amount > this.balance) {
            return false;
        }

        // Debit sender
        this.balance -= amount;
        Transaction senderTx = new Transaction(
            "TRANSFER_SENT",
            amount,
            this.balance,
            "Transfer to User ID: " + recipient.getUserId() + " (" + recipient.getAccountHolderName() + ")"
        );
        this.transactionHistory.add(senderTx);

        // Credit recipient
        recipient.balance += amount;
        Transaction recipientTx = new Transaction(
            "TRANSFER_RECEIVED",
            amount,
            recipient.getBalance(),
            "Transfer from User ID: " + this.userId + " (" + this.accountHolderName + ")"
        );
        recipient.transactionHistory.add(recipientTx);

        return true;
    }

    // --- Getters & Encapsulation ---

    public String getUserId() {
        return userId;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public double getBalance() {
        return balance;
    }

    public boolean isLocked() {
        return isLocked;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public int getAttemptsRemaining() {
        return Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);
    }

    public ArrayList<Transaction> getTransactionHistory() {
        // Return defensive copy of the ArrayList
        return new ArrayList<>(transactionHistory);
    }
}`
  },
  {
    id: 'bank',
    name: 'Bank',
    filename: 'Bank.java',
    package: 'atm',
    role: 'Central Repository',
    oopConcepts: ['Data Abstraction', 'Map/Collection Management', 'Separation of Concerns'],
    description: 'Maintains bank-wide account records in a HashMap, seeds default test accounts, and provides safe account lookup methods.',
    code: `package atm;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Bank Class
 * Represents the centralized banking system holding customer accounts.
 * Provides account lookup, authentication routing, and registration.
 */
public class Bank {
    private final String bankName;
    private final Map<String, Account> accounts;

    public Bank(String bankName) {
        this.bankName = bankName;
        this.accounts = new HashMap<>();
        seedInitialAccounts();
    }

    private void seedInitialAccounts() {
        // Pre-configure initial accounts for simulation and testing
        addAccount(new Account("1001", "1234", "Alex Morgan", 2500.00));
        addAccount(new Account("1002", "5678", "Jordan Lee", 1850.50));
        addAccount(new Account("1003", "9999", "Taylor Smith", 10000.00));
    }

    public void addAccount(Account account) {
        if (account != null && !accounts.containsKey(account.getUserId())) {
            accounts.put(account.getUserId(), account);
        }
    }

    public Account findAccount(String userId) {
        return accounts.get(userId);
    }

    public boolean hasAccount(String userId) {
        return accounts.containsKey(userId);
    }

    public String getBankName() {
        return bankName;
    }

    public Collection<Account> getAllAccounts() {
        return accounts.values();
    }
}`
  },
  {
    id: 'atm',
    name: 'ATM',
    filename: 'ATM.java',
    package: 'atm',
    role: 'Controller / Console Interface',
    oopConcepts: ['Control Flow (Switch-Case)', 'Scanner Input Handling', 'State Machine', 'Security Policy Enforcer'],
    description: 'Controls the console workflow: authentication prompt, 3-failed-attempts security lockout, 5-option menu via switch-case, and sub-handlers for history, withdrawal, deposit, transfer, and quit.',
    code: `package atm;

import java.util.ArrayList;
import java.util.Scanner;

/**
 * ATM Class
 * Simulates the physical ATM terminal and console interaction workflow.
 * Manages user session lifecycle, PIN authentication, lockout policy,
 * and the 5-option interactive menu system using a switch-case structure.
 */
public class ATM {
    private final Bank bank;
    private final Scanner scanner;
    private Account currentAccount;

    public ATM(Bank bank) {
        this.bank = bank;
        this.scanner = new Scanner(System.in);
        this.currentAccount = null;
    }

    /**
     * Entry point to run the ATM console application.
     */
    public void start() {
        printWelcomeBanner();

        boolean running = true;
        while (running) {
            if (currentAccount == null) {
                boolean authenticated = handleAuthentication();
                if (!authenticated) {
                    System.out.println("\\n[SYSTEM] ATM is temporarily unavailable or returned to idle state.");
                    System.out.println("Press Enter to continue...");
                    scanner.nextLine();
                    continue;
                }
            }

            // User is logged in; display main menu
            displayMainMenu();
            System.out.print("Enter your choice (1-5): ");
            String input = scanner.nextLine().trim();

            switch (input) {
                case "1":
                    handleTransactionHistory();
                    break;
                case "2":
                    handleWithdrawal();
                    break;
                case "3":
                    handleDeposit();
                    break;
                case "4":
                    handleTransfer();
                    break;
                case "5":
                    handleQuit();
                    // Terminate current session
                    currentAccount = null;
                    System.out.println("\\n------------------------------------------------------------");
                    System.out.println("Return to main login screen? (y/n): ");
                    String again = scanner.nextLine().trim().toLowerCase();
                    if (!again.equals("y") && !again.equals("yes")) {
                        running = false;
                        System.out.println("[SHUTDOWN] ATM System powered off. Have a great day!");
                    }
                    break;
                default:
                    System.out.println("\\n[ERROR] Invalid option selected! Please choose a number between 1 and 5.");
                    break;
            }

            if (currentAccount != null) {
                System.out.println("\\nPress Enter to return to Main Menu...");
                scanner.nextLine();
            }
        }
    }

    private void printWelcomeBanner() {
        System.out.println("============================================================");
        System.out.println("               WELCOME TO " + bank.getBankName().toUpperCase());
        System.out.println("                SECURE AUTOMATED TELLER MACHINE            ");
        System.out.println("============================================================");
    }

    /**
     * Prompts for User ID and PIN. Enforces 3 incorrect attempts lockout rule.
     */
    private boolean handleAuthentication() {
        System.out.println("\\n-------------------- USER AUTHENTICATION -------------------");
        System.out.print("Enter User ID: ");
        String userId = scanner.nextLine().trim();

        Account account = bank.findAccount(userId);
        if (account == null) {
            System.out.println("[ERROR] Account not found for User ID: " + userId);
            return false;
        }

        if (account.isLocked()) {
            System.out.println("[SECURITY ALERT] This account is LOCKED due to excessive failed attempts.");
            System.out.println("Please contact customer support to reset your PIN credentials.");
            return false;
        }

        int attemptsAllowed = account.getAttemptsRemaining();
        for (int i = 0; i < attemptsAllowed; i++) {
            System.out.print("Enter 4-Digit PIN: ");
            String pin = scanner.nextLine().trim();

            boolean isValid = account.validatePin(pin);
            if (isValid) {
                this.currentAccount = account;
                System.out.println("\\n>>> Authentication Successful! Welcome, " + account.getAccountHolderName() + ".");
                return true;
            } else {
                int remaining = account.getAttemptsRemaining();
                if (account.isLocked()) {
                    System.out.println("\\n[SECURITY ALERT] Maximum 3 incorrect attempts reached!");
                    System.out.println(">>> ACCESS DENIED: Account has been temporarily locked for security.");
                    return false;
                } else {
                    System.out.println("[ERROR] Incorrect PIN. Attempts remaining: " + remaining);
                }
            }
        }

        return false;
    }

    /**
     * Displays the 5-option interactive menu.
     */
    private void displayMainMenu() {
        System.out.println("\\n======================= ATM MAIN MENU ======================");
        System.out.println(" Account Holder: " + currentAccount.getAccountHolderName() +
                           " | User ID: " + currentAccount.getUserId());
        System.out.printf(" Current Available Balance: $%,.2f%n", currentAccount.getBalance());
        System.out.println("------------------------------------------------------------");
        System.out.println(" 1. Transaction History");
        System.out.println(" 2. Withdraw");
        System.out.println(" 3. Deposit");
        System.out.println(" 4. Transfer");
        System.out.println(" 5. Quit");
        System.out.println("============================================================");
    }

    /**
     * Option 1: Transaction History
     * Displays all past transactions logged in the ArrayList.
     */
    private void handleTransactionHistory() {
        System.out.println("\\n------------------- TRANSACTION HISTORY --------------------");
        ArrayList<Transaction> history = currentAccount.getTransactionHistory();

        if (history.isEmpty()) {
            System.out.println("No transactions found for this account.");
        } else {
            System.out.println("Total Recorded Transactions: " + history.size());
            System.out.println("------------------------------------------------------------");
            for (Transaction tx : history) {
                System.out.println(tx.toString());
            }
        }
        System.out.printf("%nAvailable Balance: $%,.2f%n", currentAccount.getBalance());
    }

    /**
     * Option 2: Withdraw
     * Validates positive amount and checks sufficient funds before dispensing.
     */
    private void handleWithdrawal() {
        System.out.println("\\n---------------------- WITHDRAW FUNDS ----------------------");
        System.out.printf("Current Available Balance: $%,.2f%n", currentAccount.getBalance());
        System.out.print("Enter amount to withdraw ($): ");
        String input = scanner.nextLine().trim();

        try {
            double amount = Double.parseDouble(input);
            if (amount <= 0) {
                System.out.println("[ERROR] Withdrawal amount must be greater than zero.");
                return;
            }

            // Balance Check
            if (amount > currentAccount.getBalance()) {
                System.out.println("\\n[TRANSACTION REJECTED] Insufficient Funds!");
                System.out.printf("Requested: $%,.2f | Available Balance: $%,.2f%n",
                        amount, currentAccount.getBalance());
                return;
            }

            boolean success = currentAccount.withdraw(amount);
            if (success) {
                System.out.println("\\n>>> [SUCCESS] Please collect your cash: $" + String.format("%,.2f", amount));
                System.out.printf("Updated New Balance: $%,.2f%n", currentAccount.getBalance());
            } else {
                System.out.println("[ERROR] Withdrawal failed. Please try again.");
            }
        } catch (NumberFormatException e) {
            System.out.println("[ERROR] Invalid numeric input! Please enter a valid currency amount.");
        }
    }

    /**
     * Option 3: Deposit
     * Prompts for deposit amount, validates input, and credits the account.
     */
    private void handleDeposit() {
        System.out.println("\\n----------------------- DEPOSIT FUNDS ----------------------");
        System.out.printf("Current Available Balance: $%,.2f%n", currentAccount.getBalance());
        System.out.print("Enter amount to deposit ($): ");
        String input = scanner.nextLine().trim();

        try {
            double amount = Double.parseDouble(input);
            if (amount <= 0) {
                System.out.println("[ERROR] Deposit amount must be greater than zero.");
                return;
            }

            boolean success = currentAccount.deposit(amount);
            if (success) {
                System.out.println("\\n>>> [SUCCESS] Deposit processed successfully: $" + String.format("%,.2f", amount));
                System.out.printf("Updated New Balance: $%,.2f%n", currentAccount.getBalance());
            } else {
                System.out.println("[ERROR] Deposit failed. Please try again.");
            }
        } catch (NumberFormatException e) {
            System.out.println("[ERROR] Invalid numeric input! Please enter a valid currency amount.");
        }
    }

    /**
     * Option 4: Transfer
     * Prompts for recipient User ID and amount, validates balance, and updates both accounts.
     */
    private void handleTransfer() {
        System.out.println("\\n---------------------- TRANSFER FUNDS ----------------------");
        System.out.printf("Current Available Balance: $%,.2f%n", currentAccount.getBalance());
        System.out.print("Enter Recipient User ID: ");
        String recipientId = scanner.nextLine().trim();

        if (recipientId.equals(currentAccount.getUserId())) {
            System.out.println("[ERROR] You cannot transfer funds to your own account.");
            return;
        }

        Account recipient = bank.findAccount(recipientId);
        if (recipient == null) {
            System.out.println("[ERROR] Recipient account not found for User ID: " + recipientId);
            return;
        }

        System.out.println("Recipient Verified: " + recipient.getAccountHolderName() + " (" + recipient.getUserId() + ")");
        System.out.print("Enter amount to transfer ($): ");
        String input = scanner.nextLine().trim();

        try {
            double amount = Double.parseDouble(input);
            if (amount <= 0) {
                System.out.println("[ERROR] Transfer amount must be greater than zero.");
                return;
            }

            // Balance Check
            if (amount > currentAccount.getBalance()) {
                System.out.println("\\n[TRANSACTION REJECTED] Insufficient Funds!");
                System.out.printf("Transfer Amount: $%,.2f | Available Balance: $%,.2f%n",
                        amount, currentAccount.getBalance());
                return;
            }

            boolean success = currentAccount.transfer(recipient, amount);
            if (success) {
                System.out.println("\\n>>> [SUCCESS] Transferred $" + String.format("%,.2f", amount) +
                                   " to " + recipient.getAccountHolderName() + " (ID: " + recipient.getUserId() + ").");
                System.out.printf("Updated New Balance: $%,.2f%n", currentAccount.getBalance());
            } else {
                System.out.println("[ERROR] Transfer could not be completed.");
            }
        } catch (NumberFormatException e) {
            System.out.println("[ERROR] Invalid numeric input! Please enter a valid currency amount.");
        }
    }

    /**
     * Option 5: Quit
     * Displays a goodbye message and ends the current user session.
     */
    private void handleQuit() {
        System.out.println("\\n============================================================");
        System.out.println(" Thank you for banking with " + bank.getBankName() + "!");
        System.out.println(" Please remove your ATM card and transaction receipt.");
        System.out.println(" Goodbye, " + currentAccount.getAccountHolderName() + "!");
        System.out.println("============================================================");
    }
}`
  },
  {
    id: 'main',
    name: 'Main',
    filename: 'Main.java',
    package: 'atm',
    role: 'Application Driver',
    oopConcepts: ['Application Bootstrap', 'Object Composition', 'Dependency Injection Pattern'],
    description: 'Driver class with public static void main(String[] args). Instantiates Bank and ATM objects and begins the interactive execution.',
    code: `package atm;

/**
 * Main Class
 * Driver entry point for the ATM Console Application.
 * Initializes the Bank, seeds test customer accounts, instantiates
 * the ATM controller, and launches the console interface.
 * 
 * Compilation: javac -d bin java/*.java
 * Execution:   java -cp bin atm.Main
 */
public class Main {
    public static void main(String[] args) {
        // Initialize Central Bank system with test accounts
        Bank bank = new Bank("Apex National Bank");

        // Instantiate ATM terminal connected to the Bank
        ATM atm = new ATM(bank);

        // Start ATM Console Session
        atm.start();
    }
}`
  }
];
