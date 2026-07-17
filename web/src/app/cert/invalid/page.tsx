export const dynamic = "force-dynamic";

export default function CertInvalid() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f0c",
        color: "#e9f0ea",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          background: "#121a14",
          border: "1px solid #26362a",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ color: "#c6ff5e" }}>Сертифікат не знайдено</h1>
        <p style={{ color: "#8ba090" }}>
          QR-код недійсний або сертифікат не існує. / Invalid QR or certificate not found.
        </p>
      </div>
    </main>
  );
}
