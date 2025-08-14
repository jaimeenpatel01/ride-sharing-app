import { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, Card, ActivityIndicator, Button, Divider } from "react-native-paper";
import api from "../../src/services/api";
import { useRouter } from "expo-router";
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface RideLocation {
    latitude: number;
    longitude: number;
    address: string;
}

interface RideData {
    pickupLocation: RideLocation;
    dropLocation: RideLocation;
    status: string;
    distance: string;
    duration: string;
    route?: {
        type: string;
        coordinates: [number, number][];
    };
    group?: {
        totalFare: number;
        perPersonFare: number;
    };
}

export default function RiderStatusScreen() {
    const [ride, setRide] = useState<RideData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get("/rides/current");
                if (!res.data) {
                    setRide(null);
                    setLoading(false);
                    return;
                }
                setRide(res.data);

                if (res.data.status === "completed") {
                    router.replace("/fare-summary");
                }
            } catch (err: any) {
                console.log("Error fetching ride status:", err?.message || err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);

        return () => clearInterval(interval);
    }, []);

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
                const map = L.map('map');
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                const pickup = [${ride?.pickupLocation.latitude || 0}, ${ride?.pickupLocation.longitude || 0}];
                const drop = [${ride?.dropLocation.latitude || 0}, ${ride?.dropLocation.longitude || 0}];

                const pickupMarker = L.marker(pickup, {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: #4CAF50; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(map);

                const dropMarker = L.marker(drop, {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: #f44336; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(map);

                ${ride?.route ? `
                    // Convert GeoJSON coordinates to Leaflet format
                    const routeCoords = ${JSON.stringify(ride.route.coordinates)}.map(coord => [coord[1], coord[0]]);
                    const polyline = L.polyline(routeCoords, {
                        color: '#2196F3',
                        weight: 4,
                        opacity: 0.8
                    }).addTo(map);

                    // Fit map to show the entire route
                    map.fitBounds(polyline.getBounds(), {
                        padding: [50, 50]
                    });
                ` : `
                    // Fallback to straight line if no route available
                    const polyline = L.polyline([pickup, drop], {
                        color: 'black',
                        weight: 2,
                        dashArray: '5, 10'
                    }).addTo(map);

                    map.fitBounds(polyline.getBounds(), {
                        padding: [50, 50]
                    });
                `}

                pickupMarker.bindPopup("Pickup: ${ride?.pickupLocation.address}");
                dropMarker.bindPopup("Drop: ${ride?.dropLocation.address}");
            </script>
        </body>
        </html>
    `;

    const statusText: Record<string, string> = {
        requested: "📨 Requested",
        matched: "🤝 Matched",
        in_progress: "🚕 In Progress",
        completed: "✅ Completed",
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading ride status...</Text>
            </View>
        );
    }

    if (!ride) {
        return (
            <View style={styles.center}>
                <Text style={styles.noRideText}>
                    You have no active rides. Request one from the home screen.
                </Text>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={() => router.replace("/(tabs)")}
                >
                    Go to Home
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🚦 Ride Status</Text>

            <View style={styles.mapContainer}>
                <WebView
                    source={{ html: getMapHtml() }}
                    style={styles.map}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                />
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.locationText}>
                        Pickup: {ride.pickupLocation.address}
                    </Text>
                    <Text style={styles.locationText}>
                        Drop: {ride.dropLocation.address}
                    </Text>
                    <Text style={styles.statusText}>
                        Status: {statusText[ride.status] || ride.status}
                    </Text>

                    {ride && (
                        <>
                            <Text style={styles.routeInfoText}>
                                Distance: {ride.distance}
                            </Text>
                            <Text style={styles.routeInfoText}>
                                Est. Duration: {ride.duration}
                            </Text>
                        </>
                    )}

                    {ride.group && (
                        <>
                            <Divider style={styles.divider} />
                            <Text style={styles.fareText}>
                                Total Fare: ₹{ride.group.totalFare}
                            </Text>
                            <Text style={styles.fareText}>
                                Per Person: ₹{ride.group.perPersonFare}
                            </Text>
                        </>
                    )}
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        flex: 1,
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        fontWeight: "bold",
    },
    mapContainer: {
        height: 300,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    card: {
        backgroundColor: "#f9f9f9",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    noRideText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 16,
        color: "#555",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    locationText: {
        fontSize: 16,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 8,
    },
    routeInfoText: {
        fontSize: 16,
        marginTop: 8,
        color: "#666",
    },
    fareText: {
        fontSize: 16,
        marginTop: 4,
    },
    divider: {
        marginVertical: 12,
    },
    button: {
        paddingVertical: 1,
        paddingHorizontal: 12,
    },
});
