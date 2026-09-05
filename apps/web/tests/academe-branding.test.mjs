import React from 'react'
import { describe, expect, mock, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server.node'

mock.module('next/image', () => ({
  default: ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props),
}))
mock.module('next/link', () => ({
  default: ({ children, prefetch: _prefetch, ...props }) =>
    React.createElement('a', props, children),
}))
mock.module('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => ({
    'auth.terms_text': '继续即表示你同意 LearnHouse 的',
    'auth.terms_of_service': '服务条款',
    'auth.and': '和',
    'auth.privacy_policy': '隐私政策',
  })[key] || key }),
}))
mock.module('../components/Contexts/OrgContext', () => ({
  useOrg: () => ({ config: { config: { customization: {} } } }),
}))
mock.module('@components/Hooks/usePlan', () => ({
  usePlan: () => 'free',
}))
mock.module('@services/config/config', () => ({
  getDeploymentMode: () => 'saas',
  getPlatformUrl: (path) => path,
}))

const { default: Watermark } = await import(
  '../components/Objects/Watermark'
)
const { AuthFooter } = await import('../components/Footers/LegalFooters')

describe('Academe site branding', () => {
  test('shows an Academe-powered watermark that stays inside the site', () => {
    const html = renderToStaticMarkup(React.createElement(Watermark))

    expect(html).toContain('Powered by Academe')
    expect(html).toContain('href="/"')
    expect(html).toContain('src="/lrn.svg"')
    expect(html).not.toContain('learnhouse.app')
  })

  test('caps the square homepage navigation logo at forty pixels', () => {
    const orgMenu = readFileSync(
      new URL('../components/Objects/Menus/OrgMenu.tsx', import.meta.url), 'utf8'
    )
    expect(orgMenu).toContain('className="h-10 w-10 object-contain"')
    expect(orgMenu).toMatch(/<Image\s+unoptimized\s+src="\/lrn-text\.svg"/)
  })

  test('uses the Academe name in the authentication legal notice', () => {
    const html = renderToStaticMarkup(React.createElement(AuthFooter))

    expect(html).toContain('继续即表示你同意 Academe 的')
    expect(html).toContain('服务条款')
    expect(html).toContain('隐私政策')
    expect(html).not.toContain('LearnHouse')
  })
})
