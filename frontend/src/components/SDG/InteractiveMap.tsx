import { useEffect, useRef, type FC, memo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./InteractiveMap.css";

interface InteractiveMapProps {
  onLocationClick: (locationName: string, district?: string, taluka?: string) => void;
  selectedLocation?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJsonFeature = any;

// Cache style configurations to avoid recreation on every render
const DISTRICT_STYLE = {
  color: "#333333",
  weight: 3.5,
  opacity: 0.9,
  fillOpacity: 0.1,
} as const;

const TALUKA_STYLE = {
  color: "#bdc3c7",
  weight: 0.8,
  opacity: 0.6,
  fillOpacity: 0.2,
} as const;

const WARDHA_STYLE = {
  color: "#27ae60",
  weight: 2.5,
  opacity: 0.9,
  fillOpacity: 0.5,
} as const;

const DEFAULT_STYLE = {
  color: "#bdc3c7",
  weight: 0.8,
  opacity: 0.6,
  fillOpacity: 0.2,
} as const;

const MAP_CONFIG = {
  center: [19.7515, 75.7139] as [number, number],
  zoom: 11,
  dragging: true,
  zoomControl: true,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
  boxZoom: false,
} as const;

const InteractiveMap = memo(
  (props: InteractiveMapProps) => {
    const { onLocationClick, selectedLocation } = props;
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const geoJsonLayerRef = useRef<any>(null);

    // Memoize style function to avoid recreating on each render
    const getFeatureStyle = useCallback((feature: GeoJsonFeature) => {
      const district = feature.properties.dtname || "";
      const taluka = feature.properties.sdtname || "";
      const level = feature.properties.level || "";

      // Special style for Wardha district
      if (district === "Wardha" && (taluka === "Wardha" || taluka === "Arvi")) {
        return WARDHA_STYLE;
      }

      // Apply thicker borders to district-level features
      if (level === "District") {
        return DISTRICT_STYLE;
      }

      // Apply thinner borders to taluka/sub-district level features
      if (level === "Taluka") {
        return TALUKA_STYLE;
      }

      return DEFAULT_STYLE;
    }, []);

    // Memoize event handler
    const handleEachFeature = useCallback(
      (feature: GeoJsonFeature, layer: GeoJsonFeature) => {
        const district = feature.properties.dtname || "";
        const taluka = feature.properties.sdtname || "";
        const locationName = taluka || district || "Unknown";
        const tooltipText = district && taluka && district !== taluka
          ? `${taluka}, ${district}`
          : locationName;

        layer.bindTooltip(tooltipText, {
          permanent: false,
          direction: "center",
          className: "sdg-map-tooltip",
        });

        const popupContent =
          district && taluka && district !== taluka
            ? `<strong>${taluka}</strong><br/><small>${district}</small>`
            : `<strong>${locationName}</strong>`;
        layer.bindPopup(popupContent);

        if (locationName === selectedLocation || taluka === selectedLocation) {
          layer.setStyle({
            color: "#e74c3c",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.6,
          });
          if (layer.bringToFront) layer.bringToFront();
        }

        layer.on("click", () => onLocationClick(locationName, district, taluka));

        layer.on("mouseover", () => {
          if (locationName !== selectedLocation && taluka !== selectedLocation) {
            layer.setStyle({ weight: 3, opacity: 1, fillOpacity: 0.6 });
          }
        });

        layer.on("mouseout", () => {
          if (locationName !== selectedLocation && taluka !== selectedLocation) {
            layer.setStyle({ weight: 2, opacity: 0.8, fillOpacity: 0.4 });
          }
        });
      },
      [onLocationClick, selectedLocation],
    );

    useEffect(() => {
      if (!mapContainerRef.current) return;

      // Initialize map once
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, MAP_CONFIG);
      }

      // Load GeoJSON
      const loadGeoJson = async () => {
        try {
          const response = await fetch("/MAHARASHTRA_SUBDISTRICTS.geojson");
          if (!response.ok) {
            throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
          }
          const geoJsonData = await response.json();

          if (!geoJsonData.features || geoJsonData.features.length === 0) {
            return;
          }

          // Remove existing layer
          if (geoJsonLayerRef.current) {
            mapRef.current?.removeLayer(geoJsonLayerRef.current);
          }

          // Add GeoJSON with memoized handlers
          geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
            style: getFeatureStyle,
            onEachFeature: handleEachFeature,
          }).addTo(mapRef.current!);

          // Fit bounds
          if (geoJsonLayerRef.current.getBounds) {
            mapRef.current!.fitBounds(geoJsonLayerRef.current.getBounds(), {
              padding: [50, 50],
            });
          }
        } catch (error) {
          console.error("Error loading GeoJSON:", error);
        }
      };

      loadGeoJson();
    }, [getFeatureStyle, handleEachFeature]);

    return (
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#f5f5f5",
        }}
      />
    );
  },
) as FC<InteractiveMapProps>;

export default InteractiveMap;
