import type { Metadata } from 'next'
import Link from 'next/link'
import CanonicalExplorer from './CanonicalExplorer'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Can Two Programs Verify the Same Record?',
  description: 'See independent Clojure and Rust verifiers reconstruct one retained economic result, then explore canonical field ordering and record scope.',
}

export default function CanonicalComparisonPage() {
  return <main className={styles.page}>
    <Link href="/demos#protocol-robustness" className={styles.back}>← Protocol Robustness Framework</Link>
    <header className={styles.hero}>
      <span className={styles.kicker}>Canonical hashing &amp; comparison</span>
      <h1>Can Two Programs Verify the Same Record?</h1>
      <p className={styles.lede}>Same facts. Same fingerprint.</p>
      <p className={styles.intro}>Independent Clojure and Rust clean-room implementations reconstruct the same pro-rata result from one frozen fixture. The fingerprint identifies that exact record; it does not by itself prove the result is fair, authorized or paid.</p>
    </header>

    <section className={styles.result} aria-labelledby="result-heading">
      <div className={styles.resultHeading}><div><span className={styles.eyebrow}>Retained pro-rata fixture · primary</span><h2 id="result-heading">90 units allocated from 120 requested</h2></div><span className={styles.calculated}>Calculated · not paid</span></div>
      <div className={styles.allocation}>
        <div><span>Alice</span><strong>45</strong><small>requested 60</small></div>
        <div><span>Bob</span><strong>30</strong><small>requested 40</small></div>
        <div><span>Carol</span><strong>15</strong><small>requested 20</small></div>
      </div>
      <div className={styles.implementationGrid}>
        <article className={styles.implementation}><span className={styles.implLabel}>Clojure · reference implementation</span><b>3fb97bad…fd120fc9</b><span className={styles.pass}>✓ Same retained result root</span></article>
        <div className={styles.equals} aria-hidden="true">=</div>
        <article className={styles.implementation}><span className={styles.implLabel}>Rust · independent implementation</span><b>3fb97bad…fd120fc9</b><span className={styles.pass}>✓ Same retained result root</span></article>
      </div>
      <p className={styles.caption}>Clojure reproduces the exact canonical bytes and root; Rust independently checks them against the retained vector. The amounts are fixture calculations, not observed recipient payments.</p>
    </section>

    <p className={styles.why}><strong>Why it matters:</strong> independent tools can agree on exactly which economic record they are examining, without trusting one implementation.</p>
    <CanonicalExplorer />

    <section className={styles.limit} aria-labelledby="limit-heading">
      <h2 id="limit-heading">A matching fingerprint is a starting point</h2>
      <div className={styles.limitGrid}>
        <p><span className={styles.pass}>✓</span> Identifies the same canonical record under its declared schema and domain.</p>
        <p><span className={styles.warning}>⚠</span> Does not prove the allocation policy is fair or the inputs are true.</p>
        <p><span className={styles.warning}>⚠</span> Does not show that any calculated amount was authorized or paid.</p>
      </div>
      <p>Canonical map fields may be independent of presentation order. Ordered evidence and sequences can have meaningful order; see <Link href="/demos/reordered-evidence">Tamper-Evident Evidence</Link>.</p>
    </section>

    <details className={styles.disclosure}>
      <summary>How was this checked?</summary>
      <p>The primary fixture binds three claims, the largest-remainder policy, available capacity and the resulting allocation. The existing Clojure implementation reconstructs the full canonical byte string and SHA-256 result root; Rust independently verifies those bytes and root against the portable vector.</p>
      <dl className={styles.facts}>
        <div><dt>Canonical ABI</dt><dd>V1 · map keys sorted by unsigned lexicographic order of encoded key bytes</dd></div>
        <div><dt>Result domain</dt><dd><code>PRF_CLEAN_PRO_RATA_RESULT_V1</code></dd></div>
        <div><dt>Full result root</dt><dd><code>3fb97bad5088ed68662a4e9b6c9eeac3aa2bc68751c4c418c28ab6fafd120fc9</code></dd></div>
        <div><dt>Fixture revision</dt><dd><code>7e00f03f01ee913a4287e42de6c37cda1fc4764a</code></dd></div>
      </dl>
      <div className={styles.downloads}>
        <a href="/evidence/canonical-comparison/pro-rata-v1.json" download>Pro-rata frozen vectors (JSON)</a>
        <a href="/evidence/canonical-comparison/canonical-v1.json" download>Canonical ABI frozen vectors (JSON)</a>
        <a href="/evidence/canonical-comparison/conformance-manifest-v1.json" download>Conformance manifest (JSON)</a>
        <a href="/evidence/canonical-comparison/CANONICAL_ABI_V1.md" download>Canonical ABI V1 specification</a>
        <a href="/evidence/canonical-comparison/canonical-comparison.v1.json" download>Demo evidence and scope manifest (JSON)</a>
        <a href="/evidence/canonical-comparison/clojure-reproduce.clj" download>Clojure fixture reproduction script</a>
      </div>
    </details>

    <details className={styles.disclosure}>
      <summary>Reproduce it independently</summary>
      <p>These links point to the clean-room source at the fixture revision shown above. The Clojure runner below reads the exact website fixture and checks its full bytes and root; the Rust CLI verifies all canonical vectors and six pro-rata bundles.</p>
      <div className={styles.commands}><p><b>Rust</b><code>cd rust/clean-rs &amp;&amp; cargo run -- verify-fixtures</code></p><p><b>Clojure</b><code>From the clean-room repo root, save the script as clojure-reproduce.clj, then run clojure -M -e '(load-file "clojure-reproduce.clj")'</code></p></div>
      <div className={styles.downloads}>
        <a href="https://github.com/protocol-robustness/prf-clean-room/tree/7e00f03f01ee913a4287e42de6c37cda1fc4764a/rust/clean-rs" target="_blank" rel="noreferrer">Rust clean-room implementation ↗</a>
        <a href="https://github.com/protocol-robustness/prf-clean-room/blob/7e00f03f01ee913a4287e42de6c37cda1fc4764a/test/prf_clean_room/conformance_identity_test.clj" target="_blank" rel="noreferrer">Clojure portable conformance test ↗</a>
        <a href="https://github.com/protocol-robustness/prf-clean-room/blob/7e00f03f01ee913a4287e42de6c37cda1fc4764a/portable/spec/CANONICAL_ABI_V1.md" target="_blank" rel="noreferrer">Normative canonical ABI specification ↗</a>
      </div>
    </details>

    <section className={styles.next} aria-labelledby="next-heading">
      <h2 id="next-heading">From matching records to checked outcomes</h2>
      <p>Identity tells independent tools which record they share. Separate checks establish whether the calculation follows policy and whether an operation can safely execute.</p>
      <div className={styles.nextLinks}>
        <Link href="/demos/liquidity-shortfall">Check recipient-level allocation under shortfall →</Link>
        <Link href="/demos/pro-rata-settlement">See proof-bound capital settlement →</Link>
        <Link href="/demos/can-anyone-verify-the-research">Reproduce a research result →</Link>
      </div>
    </section>
  </main>
}
