import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text, IconButton, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { debounce } from 'lodash';

const { width, height } = Dimensions.get('window');

// Ahmedabad coordinates
const AHMEDABAD_LOCATION = {
    latitude: 23.0225,
    longitude: 72.5714,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

interface LocationPickerProps {
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
    placeholder?: string;
    initialLocation?: { latitude: number; longitude: number };
}

export default React.memo(function OptimizedLocationPicker({ 
    onLocationSelect, 
    placeholder = "Search location",
    initialLocation
}: LocationPickerProps) {
    const [region, setRegion] = useState<Region>(() => ({
        ...AHMEDABAD_LOCATION,
        ...(initialLocation ? {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
        } : {})
    }));
    
    const [markerPosition, setMarkerPosition] = useState(() => ({
        latitude: initialLocation?.latitude || AHMEDABAD_LOCATION.latitude,
        longitude: initialLocation?.longitude || AHMEDABAD_LOCATION.longitude,
    }));
    
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    // Memoized reverse geocoding function
    const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                {
                    headers: {
                        'User-Agent': 'RideShareApp/1.0'
                    }
                }
            );
            const data = await response.json();
            return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced reverse geocoding to avoid excessive API calls
    const debouncedReverseGeocode = useMemo(
        () => debounce(async (latitude: number, longitude: number) => {
            const addressResult = await reverseGeocode(latitude, longitude);
            setAddress(addressResult);
            onLocationSelect({ latitude, longitude, address: addressResult });
        }, 500),
        [reverseGeocode, onLocationSelect]
    );

    // Initialize location on mount
    useEffect(() => {
        const initializeLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    // Use Ahmedabad as default
                    const defaultAddress = await reverseGeocode(
                        AHMEDABAD_LOCATION.latitude, 
                        AHMEDABAD_LOCATION.longitude
                    );
                    setAddress(defaultAddress);
                    return;
                }

                if (!initialLocation) {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    });
                    
                    const newRegion = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    };
                    
                    setRegion(newRegion);
                    setMarkerPosition({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    });
                    
                    debouncedReverseGeocode(location.coords.latitude, location.coords.longitude);
                }
            } catch (error) {
                console.error('Location initialization error:', error);
            }
        };

        initializeLocation();
    }, [initialLocation, debouncedReverseGeocode, reverseGeocode]);

    // Handle map press
    const handleMapPress = useCallback((event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setMarkerPosition({ latitude, longitude });
        debouncedReverseGeocode(latitude, longitude);
    }, [debouncedReverseGeocode]);

    // Handle marker drag
    const handleMarkerDrag = useCallback((event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setMarkerPosition({ latitude, longitude });
        debouncedReverseGeocode(latitude, longitude);
    }, [debouncedReverseGeocode]);

    // Get current location
    const getCurrentLocation = useCallback(async () => {
        try {
            setLoading(true);
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            
            setRegion(newRegion);
            setMarkerPosition({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            
            debouncedReverseGeocode(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Get current location error:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedReverseGeocode]);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    mode="outlined"
                    placeholder={placeholder}
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchInput}
                    right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size="small" />} /> : undefined}
                />
                <IconButton
                    icon="crosshairs-gps"
                    mode="contained"
                    onPress={getCurrentLocation}
                    disabled={loading}
                />
            </View>

            <MapView
                style={styles.map}
                region={region}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
                loadingEnabled
                mapType="standard"
            >
                <Marker
                    coordinate={markerPosition}
                    draggable
                    onDragEnd={handleMarkerDrag}
                    title="Selected Location"
                    description={address}
                />
            </MapView>

            <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>Selected Address:</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                    {address || "Tap on map to select location"}
                </Text>
            </View>

            <Button
                mode="contained"
                onPress={() => onLocationSelect({ ...markerPosition, address })}
                style={styles.confirmButton}
                disabled={!address}
            >
                Confirm Location
            </Button>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
    },
    map: {
        flex: 1,
        minHeight: height * 0.5,
    },
    addressContainer: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
    },
    confirmButton: {
        margin: 16,
    },
});