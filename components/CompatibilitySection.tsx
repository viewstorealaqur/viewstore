export default function CompatibilitySection() {
  const devices = [
    { brand: "iPhone", models: ["15 Pro Max", "15 Pro", "15", "14 Pro Max", "14 Pro", "14", "13 Series", "12 Series"] },
    { brand: "Samsung", models: ["Galaxy S24 Ultra", "S24+", "S24", "S23 Series", "A55", "A35", "A25"] },
    { brand: "Other", models: ["OnePlus 12", "Pixel 8 Pro", "Xiaomi 14", "OPPO Reno 10"] },
  ];

  return (
    <section
      id="compatibility"
      className="compat-section"
      aria-labelledby="compat-heading"
    >
      <div className="container">
        <div className="compat-inner">
          {/* Text side */}
          <div className="compat-text">
            <span className="compat-eyebrow">📱 Find Your Perfect Fit</span>
            <h2 id="compat-heading" className="section-title">
              Compatible with your phone?
            </h2>
            <p className="compat-body">
              Most of our cases are model-specific for a precise fit. Chargers,
              cables, and audio products work with any device. Not sure? Just
              send us a WhatsApp message with your phone model — we&apos;ll
              confirm compatibility before you order.
            </p>
            <div className="compat-cta-note">
              <span className="cta-note-icon" aria-hidden="true">💬</span>
              Message us on WhatsApp with your phone model.
              <span className="note-demo"> (WhatsApp link enabled in Stage 2)</span>
            </div>
          </div>

          {/* Device grid */}
          <div className="compat-brands" aria-label="Supported device list">
            {devices.map(({ brand, models }) => (
              <div key={brand} className="compat-brand-card">
                <h3 className="brand-name">{brand}</h3>
                <ul className="model-list" aria-label={`${brand} models`}>
                  {models.map((m) => (
                    <li key={m} className="model-item">
                      <span className="model-dot" aria-hidden="true">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
