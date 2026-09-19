package atm;

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
}
