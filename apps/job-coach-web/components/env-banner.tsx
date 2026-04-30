export function EnvBanner() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || "development";

  if (env !== "development") return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: "#dc2626",
      color: "white",
      textAlign: "center",
      padding: "6px 0",
      fontWeight: "bold",
      fontSize: "14px",
      letterSpacing: "0.05em"
    }}>
      DEV ENVIRONMENT — DATA MAY BE RESET
    </div>
  );
}
