import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JOINVILLE_CENTER } from '@/hooks/useGeocodeCep';

// Corrige ícones padrão do Leaflet com Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

export interface Visita {
  id: number;
  ordem: number;
  prioridade: 'urgent' | 'warning' | 'low';
  paciente: string;
  endereco: string;
  distancia: string;
  razao: string;
  status: string;
  lat: number;
  lng: number;
  distanciaMetros: number;
}

interface MapaVisitasProps {
  visitas: Visita[];
  mostrarRota?: boolean;
}

const COR: Record<string, string> = {
  urgent: '#C8364A',
  warning: '#F2B134',
  low: '#2F9E6E',
};

function criarIcone(prioridade: string, ordem: number) {
  const cor = COR[prioridade] ?? '#0B3A6F';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <ellipse cx="18" cy="42" rx="8" ry="3" fill="rgba(0,0,0,.20)"/>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.87 18 26 18 26S36 30.87 36 18C36 8.06 27.94 0 18 0z" fill="${cor}"/>
      <circle cx="18" cy="18" r="11" fill="white" opacity=".92"/>
      <text x="18" y="23" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui" fill="${cor}">${ordem}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
    className: '',
  });
}

export function MapaVisitas({ visitas, mostrarRota = false }: MapaVisitasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const layerRef     = useRef<L.LayerGroup | null>(null);

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [JOINVILLE_CENTER.lat, JOINVILLE_CENTER.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Atualiza marcadores e rota quando visitas mudam
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!visitas.length) return;

    const coords: [number, number][] = [];

    visitas.forEach((v) => {
      if (!v.lat || !v.lng) return;
      coords.push([v.lat, v.lng]);

      const marker = L.marker([v.lat, v.lng], { icon: criarIcone(v.prioridade, v.ordem) });

      const statusHtml = v.status === 'realizada'
        ? `<span style="color:#2F9E6E;font-weight:600">✓ Realizada</span>`
        : `<span style="color:#0B3A6F;font-weight:600">Pendente</span>`;

      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${v.paciente}</div>
          <div style="color:#6C7788;font-size:12px;margin-bottom:2px">${v.endereco}</div>
          <div style="color:#6C7788;font-size:12px;margin-bottom:6px">${v.razao}</div>
          ${statusHtml}
        </div>
      `);

      layer.addLayer(marker);
    });

    // Linha de rota entre pendentes
    if (mostrarRota) {
      const pendentes = visitas.filter(v => v.status === 'pendente');
      if (pendentes.length > 1) {
        L.polyline(
          pendentes.map(v => [v.lat, v.lng] as [number, number]),
          { color: '#0B3A6F', weight: 3, dashArray: '8,6', opacity: 0.8 }
        ).addTo(layer);
      }
    }

    // Ajusta zoom para mostrar todos os marcadores
    if (coords.length === 1) {
      map.setView(coords[0], 15);
    } else if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [visitas, mostrarRota]);

  return (
    <div
      ref={containerRef}
      style={{ height: 400, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--acs-line)' }}
    />
  );
}
