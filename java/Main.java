package atm;

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
}
