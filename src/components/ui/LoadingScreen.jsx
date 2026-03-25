export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #07101f 0%, #0d1f3c 60%, #07101f 100%)' }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="bg-white rounded-xl px-5 py-3">
          <img
            src="/Edit Me Lo - Primary Logo.png"
            alt="Edit Me Lo"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Spinner — EML cyan */}
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-[#47C9F3]/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-[#47C9F3] animate-spin border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
