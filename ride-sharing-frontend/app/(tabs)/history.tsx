import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import api from "../../src/services/api";
import Toast from "react-native-toast-message";

export default function RiderHistory() {
    const [history, setHistory] = useState([]);

    const fetchHistory = async () => {
        try {
            const res = await api.get("/rides/history");
            setHistory(res.data);
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Failed to fetch ride history",
            });
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    if (history.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.title}>🕓 Ride History</Text>
                <Text style={styles.empty}>No completed rides yet.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>🕓 Ride History</Text>

            {history.map((ride: any) => (
                <Card key={ride._id} style={styles.card}>
                    <Card.Content>
                        <Text>Pickup: {ride.pickupLocation}</Text>
                        <Text>Drop: {ride.dropLocation}</Text>
                        <Text>Status: ✅ Completed</Text>
                        <Text>Driver: {ride.driver?.name || "N/A"}</Text>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    empty: {
        textAlign: "center",
        fontSize: 16,
        color: "#777",
    },
    card: {
        marginBottom: 16,
        backgroundColor: "#f8f8f8",
    },
});
