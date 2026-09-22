"use client";

export default function NavLoginButton() {
  return (
    <button
      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
        color: "white",
        boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.35)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 30px oklch(0.65 0.22 290 / 0.55)";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 20px oklch(0.65 0.22 290 / 0.35)";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(0)";
      }}
    >
      Login
    </button>
  );
}
