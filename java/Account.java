package atm;

import java.util.ArrayList;
import java.util.List;

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
        // Return defensive copy or view of the ArrayList
        return new ArrayList<>(transactionHistory);
    }
}
