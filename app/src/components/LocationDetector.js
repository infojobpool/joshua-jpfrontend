
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
import axios from "axios";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash"; // Install lodash for debouncing

const LocationDetector = ({ onLocationChange }) => {
  const [location, setLocation] = useState(null);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=5`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'jobpool-mobile/1.0 (+https://jobpool.in)'
            }
          }
        );
        const options = response.data.map((item) => ({
          value: item,
          label: item.display_name,
        }));
        setSuggestions(options);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          setError("Too many requests. Please type slower or try again shortly.");
        } else {
          setError("Error fetching suggestions");
        }
      }
    }, 300),
    []
  );

  // Function to get user's current location
  const getCurrentLocation = async () => {
    // Check if we're on a secure origin (HTTPS or localhost)
    const isSecureOrigin = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('192.168.');
    
    if (!isSecureOrigin) {
      setError("Location detection requires a secure connection (HTTPS). Please enter your location manually.");
      return;
    }

    if (navigator.geolocation) {
      // Show loading state
      setError("");
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'jobpool-mobile/1.0 (+https://jobpool.in)'
                }
              }
            );
            const displayName = response.data.display_name;
            setLocation(response.data);
            setInput(displayName);
            onLocationChange(displayName);
            setError("");
            // Fetch suggestions for the autofilled location to allow refinement
            fetchSuggestions(displayName);
          } catch (err) {
            setError("Error fetching location details. Please try again or enter manually.");
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError("Location permission denied. Please allow location access or enter manually.");
              break;
            case err.POSITION_UNAVAILABLE:
              setError("Location unavailable. Please enter your location manually.");
              break;
            case err.TIMEOUT:
              setError("Location request timed out. Please try again or enter manually.");
              break;
            default:
              setError("Location detection failed. Please enter your location manually.");
              break;
          }
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000, // 10 second timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Please enter your location manually.");
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setLocation(null); // Clear location to allow new selection
    fetchSuggestions(value);
    onLocationChange(value); // Update parent with raw input
  };

  // Handle suggestion selection
  const handleSelect = (selectedOption) => {
    setLocation(selectedOption.value);
    setInput(selectedOption.label);
    onLocationChange(selectedOption.label);
    setSuggestions([]);
  };

  // Clear input field
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
            className="border rounded-md p-2 w-full text-sm pr-8"
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
          variant="outline"
          className="text-sm whitespace-nowrap"
        >
          Detect
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