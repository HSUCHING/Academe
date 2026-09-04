import React from 'react'
import { describe, expect, mock, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server.node'

mock.module('next/image', () => ({
  default: (props) => React.createElement('img', props),
}))
mock.module('next/link', () => ({
  default: ({ children, prefetch: _prefetch, ...props }) =>
    React.createElement('a', props, children),
}))
mock.module('@services/media/media', () => ({
  getOrgLogoMediaDirectory: () => '/org-logo.png',
  getOrgAuthBackgroundMediaDirectory: () => '/auth-background.png',
}))
mock.module('@services/config/config', () => ({
  getUriWithOrg: () => '/',
}))
mock.module('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}))
mock.module('@components/Hooks/usePlan', () => ({
  usePlan: () => 'free',
}))

const { default: AuthBrandingPanel } = await import(
  '../components/Auth/AuthBrandingPanel'
)

describe('Academe authentication visual', () => {
  test('adds the isolated animated canvas without replacing organization branding', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthBrandingPanel, {
        org: {
          slug: 'sci',
          name: 'SCI Organization',
          org_uuid: 'org-1',
          logo_image: 'logo.png',
          config: { config: { customization: {} } },
        },
      }),
    )

    expect(html).toContain('data-academe-auth-visual="true"')
    expect(html).toContain('data-academe-auth-title="true"')
    expect(html).toContain('Academe')
    expect(html).not.toContain('SCI Organization')
    expect(html).not.toContain('/org-logo.png')
    expect(html).toContain('-webkit-text-fill-color: transparent')
  })
})
