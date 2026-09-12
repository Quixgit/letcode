import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <p style={{ fontSize: 14, color: "#8A8C93", margin: "0 0 8px" }}>404</p>
      <h1 style={{ fontSize: 24, fontWeight: 500, color: "#17181C", margin: "0 0 12px" }}>
        This page doesn&apos;t exist
      </h1>
      <Link href="/" style={{ fontSize: 14, color: "#17181C", textDecoration: "underline" }}>
        Back to lecode
      </Link>
    </div>
  );
}
