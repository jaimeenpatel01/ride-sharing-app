const axios = require('axios');

// Simple in-memory cache for route calculations
const routeCache = new Map();
const geocodeCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Helper function to create cache key
function createRouteKey(origin, destination) {
    return `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}-${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
}

function createGeocodeKey(latitude, longitude) {
    return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

// Cache cleanup function
function cleanupCache() {
    const now = Date.now();
    for (const [key, value] of routeCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            routeCache.delete(key);
        }
    }
    for (const [key, value] of geocodeCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            geocodeCache.delete(key);
        }
    }
}

// Run cleanup every 15 minutes
setInterval(cleanupCache, 15 * 60 * 1000);

async function calculateDistanceAndDuration(origin, destination) {
    const cacheKey = createRouteKey(origin, destination);
    const cached = routeCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        // Use OSRM API to get actual road route
        const response = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/` +
            `${origin.longitude},${origin.latitude};` +
            `${destination.longitude},${destination.latitude}` +
            `?overview=full&geometries=geojson`,
            { timeout: 5000 } // Add timeout
        );

        if (response.data.code !== 'Ok') {
            throw new Error('Route calculation failed');
        }

        const route = response.data.routes[0];
        const distance = route.distance; // in meters
        const duration = route.duration; // in seconds
        
        // Format distance and duration
        const distanceText = formatDistance(distance);
        const durationText = formatDuration(duration);

        const result = {
            distance: distanceText,
            distanceValue: Math.round(distance),
            duration: durationText,
            durationValue: Math.round(duration),
            route: route.geometry // GeoJSON LineString of the route
        };

        // Cache the result
        routeCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        return result;
    } catch (error) {
        console.error('Error calculating route:', error);
        // Fallback to straight-line calculation if OSRM fails
        const fallbackResult = calculateRealisticDistance(origin, destination);
        
        // Cache fallback result with shorter TTL
        routeCache.set(cacheKey, {
            data: fallbackResult,
            timestamp: Date.now() - (CACHE_TTL * 0.8) // Cache for shorter time
        });
        
        return fallbackResult;
    }
}

function calculateRealisticDistance(origin, destination) {
    // Haversine formula for straight-line distance
    const R = 6371e3; // Earth's radius in meters
    const φ1 = origin.latitude * Math.PI/180;
    const φ2 = destination.latitude * Math.PI/180;
    const Δφ = (destination.latitude - origin.latitude) * Math.PI/180;
    const Δλ = (destination.longitude - origin.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const straightLineDistance = R * c; // in meters

    // Apply circuity factor based on distance
    // Shorter trips tend to have higher circuity factors
    let circuityFactor;
    if (straightLineDistance < 1000) { // < 1km
        circuityFactor = 1.4; // More winding for very short trips
    } else if (straightLineDistance < 5000) { // 1-5km
        circuityFactor = 1.35; // Still quite winding
    } else if (straightLineDistance < 10000) { // 5-10km
        circuityFactor = 1.3; // Moderate winding
    } else {
        circuityFactor = 1.25; // More direct for longer trips
    }

    const realisticDistance = straightLineDistance * circuityFactor;
    
    // Calculate duration based on realistic speeds for different distances
    let averageSpeed; // km/h
    if (realisticDistance < 3000) { // < 3km
        averageSpeed = 20; // Slower in dense urban areas
    } else if (realisticDistance < 10000) { // 3-10km
        averageSpeed = 30; // Urban arterial roads
    } else {
        averageSpeed = 40; // Mix of arterial and highway
    }

    const speedInMetersPerSecond = (averageSpeed * 1000) / 3600;
    const durationInSeconds = Math.ceil(realisticDistance / speedInMetersPerSecond);

    return {
        distance: formatDistance(realisticDistance),
        distanceValue: Math.round(realisticDistance),
        duration: formatDuration(durationInSeconds),
        durationValue: durationInSeconds,
        route: {
            type: "LineString",
            coordinates: [
                [origin.longitude, origin.latitude],
                [destination.longitude, destination.latitude]
            ]
        }
    };
}

function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    } else {
        // For distances >= 1km, show one decimal place
        const km = meters / 1000;
        // Round to 1 decimal place
        return `${Math.round(km * 10) / 10}km`;
    }
}

function formatDuration(seconds) {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    }
}

async function reverseGeocode(latitude, longitude) {
    const cacheKey = createGeocodeKey(latitude, longitude);
    const cached = geocodeCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
                headers: {
                    'User-Agent': 'RideShareApp/1.0'
                },
                timeout: 5000 // Add timeout
            }
        );
        
        const result = response.data.display_name;
        
        // Cache the result
        geocodeCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        throw error;
    }
}

module.exports = { calculateDistanceAndDuration, reverseGeocode }; 