import Logo from './Logo'
import { useDesignCopy } from '../lib/design-copy'
export default function AuthScene() {
  const c = useDesignCopy()
  return (
    <aside className="auth-scene">
      {/* Decorative: the panel says nothing a reader needs, so it is not
          announced. The heading beside it carries the meaning. */}
      <img src="/media/istanbul.jpg" alt="" />
      <Logo light />
      <div>
        <h2>
          {c.authTitle}
          <span>{c.authAccent}</span>
        </h2>
        <p>{c.authNote}</p>
        <div className="auth-scene-caption">Istanbul · QulaySIM</div>
      </div>
    </aside>
  )
}
