import styles from './ProcessSection.module.css'

const steps = [
  {
    num: '01',
    icon: '◈',
    title: 'Design',
    spec: 'Custom 3D Modelling',
    desc: 'Every product begins as a precise 3D model — no templates, no shortcuts. Each form is designed specifically for your dimensions, your name, your story.',
  },
  {
    num: '02',
    icon: '⬡',
    title: 'Print',
    spec: 'Bambu Lab P1S · 0.12mm Resolution',
    desc: 'Printed on a professional-grade Bambu Lab P1S at 0.12mm layer resolution — 14–20 hours of precision per piece. No rushing. No compromising.',
  },
  {
    num: '03',
    icon: '✦',
    title: 'Finish',
    spec: 'Hand-finished · Matte PLA',
    desc: 'Every piece is hand-inspected, edge-finished, and packaged in premium matte black boxes with a handwritten card. Because the unboxing is part of the object.',
  },
]

export default function ProcessSection() {
  return (
    <div className={styles.section} id="process">
      <div className={styles.container}>
        <div className="section-eyebrow reveal">The Craft</div>
        <h2 className="section-title reveal">
          HOW IT'S<br />
          <span className="outline">ACTUALLY MADE.</span>
        </h2>
        <div className={styles.grid}>
          {steps.map((s, i) => (
            <div key={i} className={`${styles.card} reveal ${i > 0 ? `reveal-delay-${i}` : ''}`}>
              <div className={styles.num}>{s.num}</div>
              <div className={styles.icon}>{s.icon}</div>
              <div className={styles.title}>{s.title}</div>
              <div className={styles.spec}>{s.spec}</div>
              <div className={styles.desc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
