"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EnumerationArea } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  Compass,
  AlertCircle,
  RefreshCw,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Configure MapLibre worker safely for Next.js / Turbopack
if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
  try {
    maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
  } catch {
    // Worker URL will use default fallback
  }
}

// Fallback OpenStreetMap raster style in case CARTO CDN is unreachable
const OSM_FALLBACK_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const CARTO_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface KanoMapProps {
  eas: EnumerationArea[];
  selectedEa: EnumerationArea | null;
  onSelectEa: (ea: EnumerationArea) => void;
  isDark?: boolean;
}

export function KanoMap({
  eas,
  selectedEa,
  onSelectEa,
  isDark = false
}: KanoMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hasError, setHasError] = useState<string | null>(null);
  const [useFallbackStyle, setUseFallbackStyle] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Basemap style selection
  const activeStyle = useMemo(() => {
    if (useFallbackStyle) return OSM_FALLBACK_STYLE;
    return isDark ? CARTO_DARK : CARTO_LIGHT;
  }, [useFallbackStyle, isDark]);

  // GeoJSON data for EAs
  const geojson = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: eas.map((ea) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [ea.longitude, ea.latitude] as [number, number]
        },
        properties: {
          id: ea.id,
          code: ea.code,
          name: ea.name,
          lga: ea.lga,
          ward: ea.ward,
          status: ea.status,
          target: ea.targetHouseholds,
          completed: ea.completedHouseholds,
          color:
            ea.status === 'completed'
              ? '#10b981'
              : ea.status === 'in_progress'
              ? '#0ab1ba'
              : '#f59e0b'
        }
      }))
    };
  }, [eas]);

  // Trigger map resize helper
  const triggerResize = useCallback(() => {
    if (mapRef.current) {
      try {
        const rawMap = mapRef.current.getMap();
        rawMap?.resize();
      } catch (err) {
        console.warn('Map resize error:', err);
      }
    }
  }, []);

  // Resize on mount, container dimension change, or side panel open/close
  useEffect(() => {
    const timer = setTimeout(triggerResize, 150);
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return () => clearTimeout(timer);

    const observer = new ResizeObserver(() => {
      triggerResize();
    });
    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [triggerResize, selectedEa]);

  // Fit bounds to all Kano EAs on initial load
  const fitToAllEas = useCallback(() => {
    if (!mapRef.current || eas.length === 0) return;

    try {
      const lngs = eas.map((e) => e.longitude).filter(n => Number.isFinite(n));
      const lats = eas.map((e) => e.latitude).filter(n => Number.isFinite(n));
      if (lngs.length === 0 || lats.length === 0) return;

      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      mapRef.current.fitBounds(
        [
          [minLng - 0.05, minLat - 0.05],
          [maxLng + 0.05, maxLat + 0.05]
        ],
        { padding: 48, duration: 800 }
      );
    } catch (e) {
      console.warn('Map fitBounds warning:', e);
    }
  }, [eas]);

  useEffect(() => {
    if (isLoaded) {
      fitToAllEas();
    }
  }, [isLoaded, fitToAllEas]);

  // Fly to selected EA when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedEa) return;

    try {
      mapRef.current.flyTo({
        center: [selectedEa.longitude, selectedEa.latitude],
        zoom: 13.5,
        duration: 900,
        essential: true
      });
    } catch (e) {
      console.warn('Map flyTo warning:', e);
    }
  }, [selectedEa]);

  // Reset view to all Kano EAs
  const handleResetView = () => {
    fitToAllEas();
  };

  const handleMapClick = (event: any) => {
    const features = event.features;
    if (features && features.length > 0) {
      const feature = features[0];
      if (feature.properties && feature.properties.id) {
        const found = eas.find((e) => e.id === feature.properties.id);
        if (found) {
          onSelectEa(found);
        }
      }
    }
  };

  const handleMapError = (e: any) => {
    console.error('MapLibre error encountered:', e);
    // If CARTO style failed, switch to OSM fallback
    if (!useFallbackStyle) {
      console.warn('CARTO style failed to load, switching to OpenStreetMap raster fallback...');
      setUseFallbackStyle(true);
    } else {
      setHasError(e?.error?.message || 'Failed to render map. Please verify WebGL support or network connectivity.');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[500px] w-full overflow-hidden bg-muted/20"
    >
      {/* Visible Error State if map fails */}
      {hasError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-card/95 backdrop-blur">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Map View Unavailable
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4 font-mono">
            {hasError}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHasError(null);
                setUseFallbackStyle(true);
              }}
              className="gap-1.5 text-xs font-mono"
            >
              <Layers className="size-3.5" />
              Use OpenStreetMap
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setHasError(null);
                setUseFallbackStyle(false);
                setIsLoaded(false);
              }}
              className="gap-1.5 text-xs font-mono"
            >
              <RefreshCw className="size-3.5" />
              Retry Map
            </Button>
          </div>
        </div>
      ) : null}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 8.5245,
          latitude: 12.0028,
          zoom: 10.5
        }}
        mapStyle={activeStyle}
        interactiveLayerIds={['ea-points', 'clusters']}
        onClick={handleMapClick}
        onLoad={() => {
          setIsLoaded(true);
          triggerResize();
          fitToAllEas();
        }}
        onError={handleMapError}
        style={{ width: '100%', height: '100%' }}
        cursor="pointer"
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        <Source
          id="eas"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={12}
          clusterRadius={45}
        >
          {/* Cluster Circles */}
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#0ab1ba',
              'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 10, 28],
              'circle-opacity': 0.85,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }}
          />

          {/* Cluster Count Labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Semibold'],
              'text-size': 12
            }}
            paint={{
              'text-color': '#ffffff'
            }}
          />

          {/* Individual Unclustered EA Points Outer Halo */}
          <Layer
            id="ea-points-halo"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': ['get', 'color'],
              'circle-radius': 11,
              'circle-opacity': 0.25
            }}
          />

          {/* Individual Unclustered EA Points */}
          <Layer
            id="ea-points"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': ['get', 'color'],
              'circle-radius': 6.5,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }}
          />

          {/* EA Code Labels */}
          <Layer
            id="ea-labels"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'code'],
              'text-font': ['Open Sans Regular'],
              'text-size': 10,
              'text-offset': [0, 1.3],
              'text-anchor': 'top'
            }}
            paint={{
              'text-color': isDark ? '#f1f5f9' : '#0f172a',
              'text-halo-color': isDark ? '#020617' : '#ffffff',
              'text-halo-width': 1.5
            }}
          />
        </Source>
      </Map>

      {/* Floating Map Controls & Status Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleResetView}
          className="h-8 gap-1.5 text-xs font-mono shadow-md backdrop-blur bg-background/90 hover:bg-background border border-border"
        >
          <Compass className="size-3.5 text-primary" />
          <span>Reset Kano View</span>
        </Button>

        {useFallbackStyle && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border border-border text-[10px] font-mono text-muted-foreground shadow-sm">
            <Layers className="size-3 text-primary" />
            OSM Fallback
          </span>
        )}
      </div>

      {/* Status Legend Pill */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 p-2 rounded-lg bg-background/90 backdrop-blur border border-border text-[11px] font-mono shadow-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          Completed
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-[#0ab1ba]" />
          In Progress
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full bg-amber-500" />
          Not Started
        </span>
      </div>
    </div>
  );
}
