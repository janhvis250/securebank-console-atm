package atm;

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
}
