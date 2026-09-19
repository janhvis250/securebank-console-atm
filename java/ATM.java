package atm;

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
                    System.out.println("\n[SYSTEM] ATM is temporarily unavailable or returned to idle state.");
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
                    System.out.println("\n------------------------------------------------------------");
                    System.out.println("Return to main login screen? (y/n): ");
                    String again = scanner.nextLine().trim().toLowerCase();
                    if (!again.equals("y") && !again.equals("yes")) {
                        running = false;
                        System.out.println("[SHUTDOWN] ATM System powered off. Have a great day!");
                    }
                    break;
                default:
                    System.out.println("\n[ERROR] Invalid option selected! Please choose a number between 1 and 5.");
                    break;
            }

            if (currentAccount != null) {
                System.out.println("\nPress Enter to return to Main Menu...");
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
        System.out.println("\n-------------------- USER AUTHENTICATION -------------------");
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
                System.out.println("\n>>> Authentication Successful! Welcome, " + account.getAccountHolderName() + ".");
                return true;
            } else {
                int remaining = account.getAttemptsRemaining();
                if (account.isLocked()) {
                    System.out.println("\n[SECURITY ALERT] Maximum 3 incorrect attempts reached!");
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
        System.out.println("\n======================= ATM MAIN MENU ======================");
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
        System.out.println("\n------------------- TRANSACTION HISTORY --------------------");
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
        System.out.println("\n---------------------- WITHDRAW FUNDS ----------------------");
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
                System.out.println("\n[TRANSACTION REJECTED] Insufficient Funds!");
                System.out.printf("Requested: $%,.2f | Available Balance: $%,.2f%n",
                        amount, currentAccount.getBalance());
                return;
            }

            boolean success = currentAccount.withdraw(amount);
            if (success) {
                System.out.println("\n>>> [SUCCESS] Please collect your cash: $" + String.format("%,.2f", amount));
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
        System.out.println("\n----------------------- DEPOSIT FUNDS ----------------------");
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
                System.out.println("\n>>> [SUCCESS] Deposit processed successfully: $" + String.format("%,.2f", amount));
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
        System.out.println("\n---------------------- TRANSFER FUNDS ----------------------");
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
                System.out.println("\n[TRANSACTION REJECTED] Insufficient Funds!");
                System.out.printf("Transfer Amount: $%,.2f | Available Balance: $%,.2f%n",
                        amount, currentAccount.getBalance());
                return;
            }

            boolean success = currentAccount.transfer(recipient, amount);
            if (success) {
                System.out.println("\n>>> [SUCCESS] Transferred $" + String.format("%,.2f", amount) +
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
        System.out.println("\n============================================================");
        System.out.println(" Thank you for banking with " + bank.getBankName() + "!");
        System.out.println(" Please remove your ATM card and transaction receipt.");
        System.out.println(" Goodbye, " + currentAccount.getAccountHolderName() + "!");
        System.out.println("============================================================");
    }
}
