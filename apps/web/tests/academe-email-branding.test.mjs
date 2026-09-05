import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('Academe outbound email branding', () => {
  test('uses Academe in the shared React email presentation', () => {
    const template = read('components/Emails/LearnHouseEmail.tsx')

    expect(template).toContain("const LOGO_URL = 'https://academe.metacognix.xyz/lrn.svg'")
    expect(template).toContain('alt="Academe"')
    expect(template).toContain('Academe — the open-source learning platform.')
    expect(template).not.toContain('LearnHouse — the open-source learning platform.')
  })

  test('uses Academe in welcome and billing copy', () => {
    const welcome = read('services/emails/transactional.ts')
    const billing = read('services/billing/emails.ts')

    expect(welcome).toContain("'Welcome to Academe 👋'")
    expect(welcome).toContain("heading: 'Welcome to Academe!'")
    expect(welcome).toContain("href: 'https://academe.metacognix.xyz/'")
    expect(welcome).not.toContain('Welcome to LearnHouse')
    expect(billing).toContain('Thanks for supporting Academe.')
    expect(billing).not.toContain('Thanks for supporting LearnHouse.')
  })

  test('uses Academe as the visible fallback sender name', () => {
    const sender = read('services/emails/resend.ts')

    expect(sender).toContain("'Academe <hello@emails.learnhouse.app>'")
    expect(sender).not.toContain("'LearnHouse <hello@emails.learnhouse.app>'")
  })
})
