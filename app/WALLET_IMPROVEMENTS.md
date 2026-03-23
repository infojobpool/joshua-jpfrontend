# Wallet & App – Suggested Improvements

## ✅ Implemented (this session)

1. **Wallet in dashboard dropdown** – Wallet link added to all dashboard profile dropdowns
2. **Admin nav** – Support Tickets ↔ Wallet Withdrawals links on both admin pages
3. **Wallet in mobile bottom nav** – Quick access to Wallet from mobile

---

## Suggested Future Improvements

### Wallet UX

| Suggestion | Effort | Impact |
|------------|--------|--------|
| **Balance badge on nav** | Low | Show wallet balance (e.g. ₹X) next to Wallet in dropdown/nav when balance > 0 |
| **Quick withdraw on dashboard** | Medium | Small “Withdraw” or “Add UPI” CTA on dashboard when balance > 0 and UPI is set |
| **Transaction filters** | Low | Filter by type (credit/debit), date range on wallet transactions |
| **Export transactions** | Medium | Download CSV of transactions for records |

### Profile & UPI

| Suggestion | Effort | Impact |
|------------|--------|--------|
| **UPI validation** | Low | Basic format check (e.g. `x@y`) before submit |
| **Link profile UPI ↔ wallet** | Backend | Sync `upi_vpa` between profile and wallet so one source of truth |

### Admin

| Suggestion | Effort | Impact |
|------------|--------|--------|
| **Admin dashboard/home** | Medium | Single `/admin` page with links to Support, Withdrawals, and other admin tools |
| **Withdrawal filters** | Low | Filter by date, status, user |
| **Bulk approve** | Medium | Select multiple withdrawals and mark all completed |

### Mobile

| Suggestion | Effort | Impact |
|------------|--------|--------|
| **Wallet pull-to-refresh** | Low | Pull down to refresh balance on wallet page |
| **Low balance alert** | Low | Toast or banner when balance drops below threshold |

### Security & Backend

| Suggestion | Effort | Impact |
|------------|--------|--------|
| **JWT validation on wallet endpoints** | Backend | Ensure user can only access own wallet |
| **Withdrawal limits** | Backend | Min/max amount, daily limits |
| **2FA for large withdrawals** | Backend | Extra verification for amounts above a threshold |

---

## Priority Order (recommended)

1. **Backend: JWT validation** – Security
2. **UPI format validation** – Data quality
3. **Admin dashboard** – Navigation
4. **Balance badge** – Engagement
5. **Transaction filters** – Usability
