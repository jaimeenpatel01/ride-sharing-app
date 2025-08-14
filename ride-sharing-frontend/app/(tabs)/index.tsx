import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Modal } from "react-native";
import { Text, Button, Card, Portal } from "react-native-paper";
import api from "../../src/services/api";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import LocationPicker from "../../src/components/LocationPicker";

const router = useRouter();

interface Location {
    latitude: number;
    longitude: number;
    address: string;
}

export default function RiderHomeScreen() {
    const [pickup, setPickup] = useState<Location | null>(null);
    const [drop, setDrop] = useState<Location | null>(null);
    const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
    const [showPickupPicker, setShowPickupPicker] = useState(false);
    const [showDropPicker, setShowDropPicker] = useState(false);

    const handleRequestRide = async () => {
        if (!pickup || !drop) {
            Toast.show({
                type: "error",
                text1: "Missing info",
                text2: "Please select both pickup and drop locations",
            });
            return;
        }

        try {
            setStatus("waiting");

            const response = await api.post("/rides/request", {
                pickupLocation: pickup.address,
                dropLocation: drop.address,
                pickupCoords: {
                    latitude: pickup.latitude,
                    longitude: pickup.longitude,
                },
                dropCoords: {
                    latitude: drop.latitude,
                    longitude: drop.longitude,
                },
            });

            // Clear selections
            setPickup(null);
            setDrop(null);

            if (response.data.group) {
                setStatus("matched");
                Toast.show({
                    type: "success",
                    position: "bottom",
                    text1: "Matched!",
                    text2: "You've been matched with another rider.",
                });
                router.push("/(tabs)/status");
            } else {
                setStatus("waiting");
                Toast.show({
                    type: "info",
                    text1: "Waiting for match...",
                    text2: "We'll notify you once matched.",
                });
                router.push("/(tabs)/status");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Something went wrong";
            Toast.show({
                type: "error",
                text1: "Ride Request Failed",
                text2: msg,
            });
            setStatus("idle");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>👋 Hello, Rider</Text>
                <Text style={styles.subtitle}>Where do you want to go?</Text>

                <Card style={styles.locationCard} onPress={() => setShowPickupPicker(true)}>
                    <Card.Content>
                        <Text style={styles.locationLabel}>Pickup Location</Text>
                        <Text style={styles.locationText}>
                            {pickup ? pickup.address : "Select pickup location"}
                        </Text>
                    </Card.Content>
                </Card>

                <Card style={styles.locationCard} onPress={() => setShowDropPicker(true)}>
                    <Card.Content>
                        <Text style={styles.locationLabel}>Drop Location</Text>
                        <Text style={styles.locationText}>
                            {drop ? drop.address : "Select drop location"}
                        </Text>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleRequestRide}
                    style={styles.button}
                    disabled={!pickup || !drop}
                >
                    🚕 Request Ride
                </Button>

                <Portal>
                    <Modal
                        visible={showPickupPicker}
                        onDismiss={() => setShowPickupPicker(false)}
                        style={styles.modal}
                    >
                        <LocationPicker
                            onLocationSelect={(location) => {
                                setPickup(location);
                                setShowPickupPicker(false);
                            }}
                            placeholder="Search pickup location"
                        />
                    </Modal>

                    <Modal
                        visible={showDropPicker}
                        onDismiss={() => setShowDropPicker(false)}
                        style={styles.modal}
                    >
                        <LocationPicker
                            onLocationSelect={(location) => {
                                setDrop(location);
                                setShowDropPicker(false);
                            }}
                            placeholder="Search drop location"
                        />
                    </Modal>
                </Portal>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 4,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
    },
    locationCard: {
        marginBottom: 16,
        backgroundColor: "#f6f6f6",
    },
    locationLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    locationText: {
        fontSize: 16,
    },
    button: {
        marginBottom: 24,
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
});
