
// "use client";
// import { useState } from "react";
// import axios from "axios";
// import Select from "react-select";
// import { Button } from "@/components/ui/button";

// const LocationDetector = ({ onLocationChange }) => {
//   const [location, setLocation] = useState(null);
//   const [input, setInput] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [error, setError] = useState("");

//   // Function to get user's current location using Geolocation API
//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
//           try {
//             const response = await axios.get(
//               `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
//             );
//             setLocation(response.data);
//             setInput(response.data.display_name);
//             onLocationChange(response.data.display_name);
//             setError("");
//           } catch (err) {
//             setError("Error fetching location details");
//           }
//         },
//         (err) => {
//           setError("Permission denied or location unavailable");
//         }
//       );
//     } else {
//       setError("Geolocation is not supported by this browser");
//     }
//   };

//   // Fetch location suggestions based on user input
//   const fetchSuggestions = async (query) => {
//     if (query.length < 3) {
//       setSuggestions([]);
//       return;
//     }
//     try {
//       const response = await axios.get(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
//       );
//       const options = response.data.map((item) => ({
//         value: item,
//         label: item.display_name,
//       }));
//       setSuggestions(options);
//     } catch (err) {
//       setError("Error fetching suggestions");
//     }
//   };

//   // Handle input change
//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     setInput(value);
//     fetchSuggestions(value);
//   };

//   // Handle suggestion selection
//   const handleSelect = (selectedOption) => {
//     setLocation(selectedOption.value);
//     setInput(selectedOption.label);
//     onLocationChange(selectedOption.label);
//     setSuggestions([]);
//   };

//   return (
//     <div className="flex flex-col gap-2 w-full max-w-[250px]">
//       <div className="flex items-center gap-2">
//         <input
//           type="text"
//           value={input}
//           onChange={handleInputChange}
//           placeholder="Enter location name"
//           className="border rounded-md p-2 flex-1 text-sm"
//         />
//         <Button
//           type="button" // Prevent form submission
//           onClick={getCurrentLocation}
//           variant="outline"
//           className="text-sm whitespace-nowrap"
//         >
//           Detect
//         </Button>
//       </div>
//       {suggestions.length > 0 && (
//         <div className="relative w-full">
//           <Select
//             options={suggestions}
//             onChange={handleSelect}
//             placeholder="Select a location"
//             className="text-sm"
//             styles={{
//               control: (base) => ({
//                 ...base,
//                 fontSize: "0.875rem",
//                 borderRadius: "0.375rem",
//                 minHeight: "38px",
//               }),
//               menu: (base) => ({
//                 ...base,
//                 zIndex: 20,
//                 width: "100%",
//                 maxWidth: "250px",
//                 marginTop: "2px",
//               }),
//               menuList: (base) => ({
//                 ...base,
//                 maxHeight: "200px",
//                 overflowY: "auto",
//               }),
//             }}
//           />
//         </div>
//       )}
//       {error && <p className="text-red-500 text-sm">{error}</p>}
//     </div>
//   );
// };

// export default LocationDetector;



"use client";
import { useState, useCallback } from "react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";

// Photon (Komoot) – more reliable than Nominatim for autocomplete; no strict rate limits
const PHOTON_SEARCH = "https://photon.komoot.io/api/";
const PHOTON_REVERSE = "https://photon.komoot.io/reverse";

function getPhotonDisplayName(feature) {
  const p = feature?.properties || {};
  const parts = [p.name, p.street, p.locality, p.district, p.city, p.state, p.country].filter(Boolean);
  return [...new Set(parts)].join(", ") || "Unknown location";
}

const LocationDetector = ({ onLocationChange }) => {
  const [location, setLocation] = useState(null);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setSuggestions([]);
        setError((e) => (e && e.includes("suggestions") ? "" : e));
        return;
      }
      try {
        setError((e) => (e && e.includes("suggestions") ? "" : e));
        const res = await fetch(
          `${PHOTON_SEARCH}?q=${encodeURIComponent(query.trim())}&limit=5`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error("Suggestions failed");
        const data = await res.json();
        const features = data?.features || [];
        const options = features.map((f) => ({
          value: f,
          label: getPhotonDisplayName(f),
        }));
        setSuggestions(options);
        setError((e) => (e && e.includes("suggestions") ? "" : e));
      } catch (err) {
        setError("Could not fetch suggestions. Check your connection or enter address manually.");
      }
    }, 500),
    []
  );

  const getCurrentLocation = async () => {
    const isSecureOrigin =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("192.168.");

    if (!isSecureOrigin) {
      setError("Location requires HTTPS. Please enter your address manually.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Location not supported. Please enter your address manually.");
      return;
    }

    setError("");
    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `${PHOTON_REVERSE}?lat=${latitude}&lon=${longitude}&limit=1`,
            { headers: { Accept: "application/json" } }
          );
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const feature = data?.features?.[0];
          if (!feature) throw new Error("No address found");
          const displayName = getPhotonDisplayName(feature);
          setLocation(feature);
          setInput(displayName);
          onLocationChange(displayName);
          setError("");
        } catch (err) {
          setError("Could not get address from location. Please enter manually.");
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === 1) {
          setError("Location permission denied. Please allow access or enter manually.");
        } else if (err.code === 2) {
          setError("Location unavailable. Please enter your address manually.");
        } else if (err.code === 3) {
          setError("Location timed out. Please try again or enter manually.");
        } else {
          setError("Could not detect location. Please enter your address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setLocation(null);
    setError((e) => (e && e.includes("suggestions") ? "" : e));
    fetchSuggestions(value);
    onLocationChange(value);
  };

  const handleSelect = (selectedOption) => {
    setLocation(selectedOption.value);
    setInput(selectedOption.label);
    onLocationChange(selectedOption.label);
    setSuggestions([]);
    setError("");
  };

  const clearInput = () => {
    setInput("");
    setLocation(null);
    setSuggestions([]);
    setError("");
    onLocationChange("");
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[250px]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter or edit location"
            className="border rounded-md p-2 w-full text-sm pr-8 bg-white text-slate-900 placeholder:text-slate-400"
            style={{
              color: "#0f172a",
              WebkitTextFillColor: "#0f172a",
              caretColor: "#0f172a",
            }}
            title="Type to edit or search for a new location"
          />
          {input && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          disabled={isDetecting}
          variant="outline"
          className="text-sm whitespace-nowrap"
        >
          {isDetecting ? "Detecting…" : "Detect"}
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="relative w-full">
          <Select
            options={suggestions}
            onChange={handleSelect}
            placeholder="Select a location"
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                fontSize: "0.875rem",
                borderRadius: "0.375rem",
                minHeight: "38px",
              }),
              menu: (base) => ({
                ...base,
                zIndex: 20,
                width: "100%",
                maxWidth: "250px",
                marginTop: "2px",
              }),
              menuList: (base) => ({
                ...base,
                maxHeight: "200px",
                overflowY: "auto",
              }),
            }}
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default LocationDetector;