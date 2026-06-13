import { useState, useEffect } from "react";
import { familyMemberService } from "@/services";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Link } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapView() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    familyMemberService.list("-created_at", 200)
      .then(m => { setMembers(m); })
      .catch(() => { setMembers([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const markers = [];
  const paths = [];

  members.forEach(m => {
    const mh = m.migration_history || [];
    const validPoints = mh.filter(p => p.lat && p.lng);
    validPoints.forEach(p => {
      markers.push({ lat: p.lat, lng: p.lng, name: m.full_name, place: p.place, year: p.year, memberId: m.id });
    });
    if (validPoints.length > 1) {
      paths.push({ positions: validPoints.map(p => [p.lat, p.lng]), name: m.full_name });
    }
  });

  const hasData = markers.length > 0;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <h1 className="font-heading text-xl font-semibold">Migration Map</h1>
        <p className="text-xs text-muted-foreground">Track family movements across generations</p>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div><MapIcon className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Add migration history with coordinates to family members to see them on the map.</p></div>
        </div>
      ) : (
        <div className="flex-1">
          <MapContainer center={[markers[0].lat, markers[0].lng]} zoom={4} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {markers.map((m, i) => (
              <Marker key={i} position={[m.lat, m.lng]}>
                <Popup>
                  <div className="text-sm">
                    <Link to={`/member/${m.memberId}`} className="font-semibold text-blue-600 hover:underline">{m.name}</Link>
                    <p>{m.place}{m.year ? ` (${m.year})` : ""}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {paths.map((p, i) => (
              <Polyline key={i} positions={p.positions} color="hsl(33, 45%, 42%)" weight={3} dashArray="8" />
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}