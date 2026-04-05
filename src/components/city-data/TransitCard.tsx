interface TransitCardProps {
  routeName: string;
  routeType: "bus" | "rail";
  stops: string[];
  color?: string;
}

export function TransitCard({ routeName, routeType, stops, color }: TransitCardProps) {
  const badgeBg = color ?? (routeType === "rail" ? "#0072BC" : "#F5A623");

  return (
    <div className="rounded-2xl bg-royal p-4">
      <div className="mb-3 flex items-center gap-3">
        {/* Route type icon */}
        <span className="text-xl">
          {routeType === "rail" ? (
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125H18M3.375 14.25h.008v.008h-.008v-.008Zm0 0V4.875c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.375m-12 0h12" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125H18M3.375 14.25h.008v.008h-.008v-.008Zm0 0V4.875c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.375m-12 0h12" />
            </svg>
          )}
        </span>

        {/* Route badge */}
        <span
          className="rounded-lg px-3 py-1 text-sm font-bold text-white"
          style={{ backgroundColor: badgeBg }}
        >
          {routeName}
        </span>

        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50 uppercase">
          {routeType}
        </span>
      </div>

      {/* Stops list */}
      <div className="space-y-1">
        {stops.map((stop, i) => (
          <div key={stop} className="flex items-center gap-2 text-sm">
            <div className="flex flex-col items-center">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: badgeBg }}
              />
              {i < stops.length - 1 && (
                <div className="h-3 w-px bg-white/20" />
              )}
            </div>
            <span className="text-white/70">{stop}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
