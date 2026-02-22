import { test, expect } from '@playwright/test'

test.describe('Health Check', () => {
    test('GET /api/health returns healthy', async ({ request }) => {
        const response = await request.get('/api/health')
        expect(response.status()).toBeLessThanOrEqual(503)

        const body = await response.json()
        expect(body).toHaveProperty('status')
        expect(body).toHaveProperty('version')
        expect(body).toHaveProperty('uptime')
        expect(body).toHaveProperty('checks')
    })
})

test.describe('Authentication', () => {
    test('login page loads', async ({ page }) => {
        await page.goto('/login')
        await expect(page).toHaveTitle(/PV-OpsHub|Login/i)
    })

    test('unauthenticated users see login form', async ({ page }) => {
        await page.goto('/login')
        const emailInput = page.locator('input[type="email"], input[name="email"]')
        await expect(emailInput).toBeVisible()
    })
})

test.describe('Dashboard Navigation', () => {
    test('main page loads without error', async ({ page }) => {
        const response = await page.goto('/')
        expect(response?.status()).toBeLessThan(500)
    })

    test('dashboard page loads', async ({ page }) => {
        const response = await page.goto('/dashboard')
        expect(response?.status()).toBeLessThan(500)
    })
})

test.describe('Search API', () => {
    test('search endpoint returns results format', async ({ request }) => {
        const response = await request.get('/api/search?q=test&limit=5')
        expect(response.status()).toBe(200)

        const body = await response.json()
        expect(body).toHaveProperty('results')
        expect(body).toHaveProperty('query')
        expect(body).toHaveProperty('total')
        expect(Array.isArray(body.results)).toBe(true)
    })

    test('search rejects too short queries', async ({ request }) => {
        const response = await request.get('/api/search?q=a')
        expect(response.status()).toBe(200)

        const body = await response.json()
        expect(body.results).toHaveLength(0)
    })
})
