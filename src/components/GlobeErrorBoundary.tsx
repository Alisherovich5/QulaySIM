import { Component, type ReactNode } from 'react'

/**
 * Keep a failing 3D globe from taking the page down with it.
 *
 * `react-globe.gl` throws when it cannot get a WebGL context — an old phone,
 * hardware acceleration switched off, a locked-down browser. The throw happens
 * during render, which `Suspense` does not catch, so React unmounts the whole
 * tree above it. On the account page that meant a completely blank screen: no
 * profile, no eSIM list, no QR code for a customer who had already paid. The
 * globe is decoration; everything it was hiding is not.
 *
 * Shared rather than duplicated per page, because the home page had this guard
 * and the account page did not, and the difference was invisible until someone
 * without WebGL opened their profile.
 */
export class GlobeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  componentDidCatch(error: unknown) {
    // The boundary keeps the page alive, which also means nobody would ever
    // learn the globe had failed. A blank hero for every WebGL-less visitor is
    // exactly the kind of silent breakage that lasts for months.
    void import('../lib/report-error').then(({ reportError }) => reportError(error, 'globe'))
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
