import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Card, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import api from "../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

interface DriverStats {
    name: string;
    email: string;
    completedRides: number;
    earnings: number;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [stats, setStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDriverStats = async () => {
            try {
                const response = await api.get("/rides/stats");
                setStats(response.data);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to fetch driver stats");
                Toast.show({
                    type: "error",
                    position: "bottom",
                    text1: "Error",
                    text2: error || "Failed to fetch driver stats",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDriverStats();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace("/");
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator animating={true} size="large" />
                <Text style={styles.loadingText}>Loading driver stats...</Text>
            </View>
        );
    }

    if (error || !stats) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error || "No stats available."}</Text>
                <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
                    Logout
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Driver Profile" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <Text style={styles.statText}>Name: {stats.name}</Text>
                    <Text style={styles.statText}>Email: {stats.email}</Text>
                    <Text style={styles.statText}>Completed Rides: {stats.completedRides}</Text>
                    <Text style={styles.statText}>Earnings: ${stats.earnings.toFixed(2)}</Text>
                </Card.Content>
            </Card>

            <Button mode="contained" onPress={handleLogout} style={styles.logoutButton}>
                Logout
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    card: {
        width: "100%",
        maxWidth: 400,
        padding: 20,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    statText: {
        fontSize: 18,
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 20,
        width: "100%",
        maxWidth: 400,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: "red",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
});
