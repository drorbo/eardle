import { ImageResponse } from "next/og";

export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          fontSize: size * 0.6,
        }}
      >
        🎵
      </div>
    ),
    { width: size, height: size }
  );
}
