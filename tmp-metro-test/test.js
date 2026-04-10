const GtfsRealtimeBindings = require("gtfs-realtime-bindings");

async function checkMetro() {
  try {
    const res = await fetch("https://api.metro.net/LACMTA/vehicle_positions/all", {
      headers: { "Accept": "application/x-protobuf" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    
    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    console.log("Entities found:", feed.entity.length);
    console.log("First entity:", JSON.stringify(feed.entity[0], null, 2));
  } catch (error) {
    console.log("Error:", error.message);
  }
}
checkMetro();
