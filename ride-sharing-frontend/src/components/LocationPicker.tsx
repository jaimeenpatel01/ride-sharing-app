import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// Ahmedabad coordinates
const AHMEDABAD_LOCATION = {
    latitude: 23.0225,
    longitude: 72.5714,
    zoomLevel: 12
};

interface LocationPickerProps {
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
    placeholder?: string;
    initialLocation?: { latitude: number; longitude: number };
}

export default function LocationPicker({ 
    onLocationSelect, 
    placeholder = "Search location",
    initialLocation
}: LocationPickerProps) {
    const [location, setLocation] = useState(initialLocation || AHMEDABAD_LOCATION);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState("");
    const webViewRef = useRef<WebView>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initializeLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    // If location permission is denied, use Ahmedabad as default
                    setLocation(AHMEDABAD_LOCATION);
                    await updateAddressForLocation(AHMEDABAD_LOCATION);
                    setLoading(false);
                    return;
                }

                if (!initialLocation) {
                    try {
                        const currentLocation = await Location.getCurrentPositionAsync({});
                        const newLocation = {
                            latitude: currentLocation.coords.latitude,
                            longitude: currentLocation.coords.longitude,
                        };
                        setLocation(newLocation);
                        await updateAddressForLocation(newLocation);
                    } catch (error) {
                        // If getting current location fails, use Ahmedabad as fallback
                        console.log('Falling back to Ahmedabad location');
                        setLocation(AHMEDABAD_LOCATION);
                        await updateAddressForLocation(AHMEDABAD_LOCATION);
                    }
                } else {
                    await updateAddressForLocation(initialLocation);
                }
            } catch (error) {
                console.error('Error getting location:', error);
                // Use Ahmedabad as fallback in case of any errors
                setLocation(AHMEDABAD_LOCATION);
                await updateAddressForLocation(AHMEDABAD_LOCATION);
            } finally {
                setLoading(false);
            }
        };

        initializeLocation();
    }, [initialLocation]);

    const updateAddressForLocation = async (loc: { latitude: number; longitude: number }) => {
        try {
            const [addressResult] = await Location.reverseGeocodeAsync({
                latitude: loc.latitude,
                longitude: loc.longitude,
            });
            if (addressResult) {
                const fullAddress = [
                    addressResult.street,
                    addressResult.city,
                    addressResult.region,
                ].filter(Boolean).join(', ');
                setAddress(fullAddress);
            }
        } catch (error) {
            console.error('Error getting address:', error);
        }
    };

    const handleMapMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'location') {
                const { lat, lng } = data;
                const newLocation = { latitude: lat, longitude: lng };
                setLocation(newLocation);
                await updateAddressForLocation(newLocation);
                onLocationSelect({ ...newLocation, address });
            }
        } catch (error) {
            console.error('Error handling map message:', error);
        }
    };

    const handleZoom = (action: 'in' | 'out') => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                map.setZoom(map.getZoom() ${action === 'in' ? '+' : '-'} 1);
                true;
            `);
        }
    };

    const handleRecenterMap = () => {
        if (webViewRef.current && location) {
            webViewRef.current.injectJavaScript(`
                map.setView([${location.latitude}, ${location.longitude}], 15);
                true;
            `);
        }
    };

    const getMapHtml = () => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
            <style>
                body { margin: 0; }
                #map { height: 100vh; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                const map = L.map('map', {
                    zoomControl: false
                }).setView([${location?.latitude || AHMEDABAD_LOCATION.latitude}, 
                          ${location?.longitude || AHMEDABAD_LOCATION.longitude}], 
                          ${location === AHMEDABAD_LOCATION ? AHMEDABAD_LOCATION.zoomLevel : 15});
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                let marker;
                if (${location ? 'true' : 'false'}) {
                    marker = L.marker([${location?.latitude || AHMEDABAD_LOCATION.latitude}, 
                                     ${location?.longitude || AHMEDABAD_LOCATION.longitude}], {
                        draggable: true
                    }).addTo(map);
                }

                function updateLocation(lat, lng) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'location',
                        lat,
                        lng
                    }));
                }

                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    if (marker) {
                        marker.setLatLng([lat, lng]);
                    } else {
                        marker = L.marker([lat, lng], {
                            draggable: true
                        }).addTo(map);
                    }
                    updateLocation(lat, lng);
                });

                if (marker) {
                    marker.on('dragend', () => {
                        const pos = marker.getLatLng();
                        updateLocation(pos.lat, pos.lng);
                    });
                }

                // Add bounds for Ahmedabad region
                const ahmedabadBounds = L.latLngBounds(
                    [22.9, 72.4], // Southwest
                    [23.1, 72.7]  // Northeast
                );
                map.setMaxBounds(ahmedabadBounds);
                map.setMinZoom(10);
            </script>
        </body>
        </html>
    `;

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: getMapHtml() }}
                    style={styles.map}
                    onMessage={handleMapMessage}
                    javaScriptEnabled={true}
                />
                <View style={styles.mapControls}>
                    <IconButton
                        icon="plus"
                        mode="contained"
                        containerColor="white"
                        size={20}
                        onPress={() => handleZoom('in')}
                        style={styles.controlButton}
                    />
                    <IconButton
                        icon="minus"
                        mode="contained"
                        containerColor="white"
                        size={20}
                        onPress={() => handleZoom('out')}
                        style={styles.controlButton}
                    />
                    <IconButton
                        icon="crosshairs-gps"
                        mode="contained"
                        containerColor="white"
                        size={20}
                        onPress={handleRecenterMap}
                        style={styles.controlButton}
                    />
                </View>
            </View>
            
            <View style={styles.searchContainer}>
                <TextInput
                    mode="outlined"
                    value={address}
                    onChangeText={setAddress}
                    placeholder={placeholder}
                    style={styles.input}
                />
                {location && (
                    <Button
                        mode="contained"
                        onPress={() => onLocationSelect({ ...location, address })}
                        style={styles.confirmButton}
                    >
                        Confirm Location
                    </Button>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -50 }],
        backgroundColor: 'transparent',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    controlButton: {
        margin: 4,
        backgroundColor: 'white',
    },
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    input: {
        marginBottom: 10,
    },
    confirmButton: {
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
}); 