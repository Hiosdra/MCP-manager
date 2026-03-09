import { test, expect, mockServers } from './fixtures';

test.describe('Dashboard UX', () => {
  test('shows server cards with readable text and proper labels', async ({ mockPage: page }) => {
    // Wait for servers to load
    await expect(page.getByText('Server Library')).toBeVisible();

    // All 3 server cards should be visible
    for (const srv of mockServers) {
      await expect(page.getByRole('heading', { name: srv.name })).toBeVisible();
    }

    // Transport badges should be readable
    await expect(page.getByText('stdio').first()).toBeVisible();
    await expect(page.getByText('sse', { exact: true })).toBeVisible();

    // Action buttons should use full words (not abbreviations)
    const deleteButtons = page.getByRole('button', { name: /^Delete / });
    await expect(deleteButtons).toHaveCount(3);

    const editButtons = page.getByRole('button', { name: /^Edit / });
    await expect(editButtons).toHaveCount(3);
  });

  test('delete confirmation shows "Confirm?" instead of "?"', async ({ mockPage: page }) => {
    await expect(page.getByText('Server Library')).toBeVisible();

    // Click first Delete button
    const deleteBtn = page.getByRole('button', { name: 'Delete GitHub MCP' });
    await deleteBtn.click();

    // Should now show "Confirm?" text
    await expect(page.getByRole('button', { name: 'Confirm delete GitHub MCP' })).toBeVisible();
    await expect(page.getByText('Confirm?')).toBeVisible();

    // Click again to confirm delete
    await page.getByRole('button', { name: 'Confirm delete GitHub MCP' }).click();

    // Server should be removed (only 2 remaining)
    await expect(page.getByRole('heading', { name: 'GitHub MCP' })).not.toBeVisible();
  });

  test('search filter narrows displayed servers', async ({ mockPage: page }) => {
    await expect(page.getByText('Server Library')).toBeVisible();

    // Search box should exist
    const searchInput = page.getByPlaceholder('Filter servers…');
    await expect(searchInput).toBeVisible();

    // Type a query that matches only one server
    await searchInput.fill('Filesystem');

    // Only matching server should be visible
    await expect(page.getByRole('heading', { name: 'Filesystem Server' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GitHub MCP' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remote SSE Server' })).not.toBeVisible();

    // Clear search shows all
    await searchInput.fill('');
    await expect(page.getByRole('heading', { name: 'GitHub MCP' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remote SSE Server' })).toBeVisible();
  });

  test('search shows "no matches" for non-existent query', async ({ mockPage: page }) => {
    await expect(page.getByText('Server Library')).toBeVisible();

    const searchInput = page.getByPlaceholder('Filter servers…');
    await searchInput.fill('nonexistent-xyz');

    await expect(page.getByText('No servers matching')).toBeVisible();
    await expect(page.getByText('nonexistent-xyz')).toBeVisible();
  });
});

test.describe('Empty State', () => {
  test('shows "Add Server" CTA button when no servers exist', async ({ page }) => {
    // Inject mock with empty servers
    await page.addInitScript(() => {
      (window as any).api = {
        getServers: () => Promise.resolve([]),
        addServer: (input: any) => Promise.resolve({ ...input, id: 'new', createdAt: '', updatedAt: '' }),
        updateServer: () => Promise.resolve({}),
        deleteServer: () => Promise.resolve(),
        getDetectedClients: () => Promise.resolve([]),
        getSyncTargets: () => Promise.resolve([]),
        setSyncTarget: () => Promise.resolve(),
        syncServer: () => Promise.resolve([]),
        syncAll: () => Promise.resolve([]),
        importFromClient: () => Promise.resolve({ clientType: '', servers: [] }),
        importFromAllClients: () => Promise.resolve([]),
      };
    });

    await page.goto('/');

    await expect(page.getByText('No servers yet')).toBeVisible();
    await expect(page.getByText('Add your first MCP server to start managing')).toBeVisible();

    // CTA button should exist
    const ctaButton = page.getByRole('button', { name: 'Add your first server' });
    await expect(ctaButton).toBeVisible();

    // Clicking it should open the form
    await ctaButton.click();
    await expect(page.getByRole('dialog', { name: 'Add server' })).toBeVisible();
  });
});

test.describe('Modal Keyboard Support', () => {
  test('Escape closes the Add Server form', async ({ mockPage: page }) => {
    // Open the Add Server form
    await page.getByRole('button', { name: 'Add server' }).click();
    await expect(page.getByRole('dialog', { name: 'Add server' })).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Escape closes the Import dialog', async ({ mockPage: page }) => {
    // Open the Import dialog
    await page.getByRole('button', { name: 'Import servers' }).click();
    await expect(page.getByRole('dialog', { name: 'Import servers' })).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Close button on server form has aria-label', async ({ mockPage: page }) => {
    await page.getByRole('button', { name: 'Add server' }).click();
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeVisible();
  });
});

test.describe('Navigation Accessibility', () => {
  test('navigation buttons have aria-labels and aria-current', async ({ mockPage: page }) => {
    // Servers tab should be active
    const serversBtn = page.getByRole('button', { name: 'Servers', exact: true });
    await expect(serversBtn).toHaveAttribute('aria-current', 'page');

    // Integrations tab should not be active
    const integrationsBtn = page.getByRole('button', { name: 'Integrations', exact: true });
    await expect(integrationsBtn).not.toHaveAttribute('aria-current');

    // Switch to Integrations
    await integrationsBtn.click();
    await expect(integrationsBtn).toHaveAttribute('aria-current', 'page');
    await expect(serversBtn).not.toHaveAttribute('aria-current');
  });

  test('main nav has aria-label', async ({ mockPage: page }) => {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
  });
});

test.describe('Server Form Validation', () => {
  test('shows validation errors for empty required fields', async ({ mockPage: page }) => {
    await page.getByRole('button', { name: 'Add server' }).click();

    // Submit with empty form
    await page.getByRole('dialog').getByRole('button', { name: 'Add Server' }).click();

    // Should show validation error for name
    await expect(page.getByText('Server name is required')).toBeVisible();
  });
});
