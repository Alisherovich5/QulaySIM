import Logo from './Logo'
import Photo from './media/Photo'
import { useDesignCopy } from '../lib/design-copy'
export default function AuthScene() {
  const c = useDesignCopy()
  return (
    <aside className="auth-scene">
      {/* Decorative: the panel says nothing a reader needs, so it is not
          announced. The heading beside it carries the meaning.

          This was `<img src="/media/istanbul.jpg">` and the file is gone — the
          photographs moved to the encoder's own names when the AVIF pipeline
          landed, and this was the one reference that did not move with them.
          The sign-in page has been showing a broken image and an empty green
          panel ever since. It reads from the manifest now, so a photograph
          that is re-encoded or renamed cannot leave a hole here again. */}
      <Photo
        name="photos/istanbul"
        alt=""
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
      />
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
