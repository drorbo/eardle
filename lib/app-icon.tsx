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
          background: "#4f46e5",
          fontSize: size * 0.6,
        }}
      >
        🎵
      </div>
    ),
    { width: size, height: size }
  );
}
