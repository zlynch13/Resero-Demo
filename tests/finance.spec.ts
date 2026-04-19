import { test, expect } from '@playwright/test';

test.describe('FinanceTracker App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('page loads with correct title and summary cards', async ({ page }) => {
    await expect(page).toHaveTitle('FinanceTracker');
    await expect(page.getByTestId('balance-card')).toBeVisible();
    await expect(page.getByTestId('income-card')).toBeVisible();
    await expect(page.getByTestId('expense-card')).toBeVisible();
  });

  test('shows $0.00 balances on initial load', async ({ page }) => {
    await expect(page.getByTestId('balance-amount')).toContainText('$0.00');
    await expect(page.getByTestId('income-amount')).toContainText('$0.00');
    await expect(page.getByTestId('expense-amount')).toContainText('$0.00');
  });

  test('shows empty state when no transactions exist', async ({ page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('submit button is visible and labeled correctly', async ({ page }) => {
    const btn = page.getByTestId('submit-button');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Add Transaction');
  });

  test('shows validation error when description is empty', async ({ page }) => {
    await page.getByTestId('amount-input').fill('100');
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('form-error')).toBeVisible();
    await expect(page.getByTestId('form-error')).toContainText('Description is required');
  });

  test('shows validation error for zero or negative amount', async ({ page }) => {
    await page.getByTestId('description-input').fill('Test');
    await page.getByTestId('amount-input').fill('0');
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('form-error')).toBeVisible();
    await expect(page.getByTestId('form-error')).toContainText('valid amount');
  });

  test('can add an income transaction', async ({ page }) => {
    await page.getByTestId('description-input').fill('Monthly Salary');
    await page.getByTestId('amount-input').fill('5000');
    await page.getByTestId('type-income').click();
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('transaction-list')).toBeVisible();
    await expect(page.getByTestId('transaction-item').first()).toContainText('Monthly Salary');
    await expect(page.getByTestId('income-amount')).toContainText('$5,000.00');
    await expect(page.getByTestId('balance-amount')).toContainText('$5,000.00');
  });

  test('can add an expense transaction', async ({ page }) => {
    await page.getByTestId('description-input').fill('Rent Payment');
    await page.getByTestId('amount-input').fill('1500');
    await page.getByTestId('type-expense').click();
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('transaction-item').first()).toContainText('Rent Payment');
    await expect(page.getByTestId('expense-amount')).toContainText('$1,500.00');
    await expect(page.getByTestId('balance-amount')).toContainText('-$1,500.00');
  });

  test('balance updates correctly with both income and expense', async ({ page }) => {
    await page.getByTestId('description-input').fill('Salary');
    await page.getByTestId('amount-input').fill('3000');
    await page.getByTestId('type-income').click();
    await page.getByTestId('submit-button').click();

    await page.getByTestId('description-input').fill('Groceries');
    await page.getByTestId('amount-input').fill('200');
    await page.getByTestId('type-expense').click();
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('balance-amount')).toContainText('$2,800.00');
    await expect(page.getByTestId('income-amount')).toContainText('$3,000.00');
    await expect(page.getByTestId('expense-amount')).toContainText('$200.00');
  });

  test('can delete a transaction and balance resets', async ({ page }) => {
    await page.getByTestId('description-input').fill('Test Transaction');
    await page.getByTestId('amount-input').fill('250');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('transaction-item')).toHaveCount(1);

    await page.getByTestId('delete-button').first().click();

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('balance-amount')).toContainText('$0.00');
  });

  test('form resets after successful submission', async ({ page }) => {
    await page.getByTestId('description-input').fill('Test');
    await page.getByTestId('amount-input').fill('100');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('description-input')).toHaveValue('');
    await expect(page.getByTestId('amount-input')).toHaveValue('');
  });

  test('clicking expense type button activates it', async ({ page }) => {
    await page.getByTestId('type-expense').click();
    await expect(page.getByTestId('type-expense')).toHaveClass(/type-btn-active-expense/);
  });

  test('clicking income type button activates it', async ({ page }) => {
    await page.getByTestId('type-expense').click();
    await page.getByTestId('type-income').click();
    await expect(page.getByTestId('type-income')).toHaveClass(/type-btn-active-income/);
  });

  test('multiple transactions are listed newest first', async ({ page }) => {
    const entries = [
      { desc: 'First Entry', amount: '100' },
      { desc: 'Second Entry', amount: '200' },
      { desc: 'Third Entry', amount: '300' },
    ];

    for (const entry of entries) {
      await page.getByTestId('description-input').fill(entry.desc);
      await page.getByTestId('amount-input').fill(entry.amount);
      await page.getByTestId('submit-button').click();
    }

    const items = page.getByTestId('transaction-item');
    await expect(items).toHaveCount(3);
    await expect(items.first()).toContainText('Third Entry');
  });

  test('category dropdown is functional', async ({ page }) => {
    const select = page.getByTestId('category-select');
    await expect(select).toBeVisible();
    await select.selectOption('Food & Dining');
    await expect(select).toHaveValue('Food & Dining');
  });

  test('transaction shows category and date in metadata', async ({ page }) => {
    await page.getByTestId('description-input').fill('Lunch');
    await page.getByTestId('amount-input').fill('25');
    await page.getByTestId('category-select').selectOption('Food & Dining');
    await page.getByTestId('type-expense').click();
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('transaction-item').first()).toContainText('Food & Dining');
  });
});
