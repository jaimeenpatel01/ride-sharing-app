import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Text, Button, Title } from "react-native-paper";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import api from "@/src/services/api";

export default function DriverDashboard() {
    const [groups, setGroups] = useState<any[]>([]);

    const router = useRouter();

    const fetchGroups = async () => {
        try {
            const res = await api.get("/groups/matched");
            setGroups(res.data);
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Failed to fetch ride groups",
            });
        }
    };

    const handleAccept = async (groupId: string) => {
        try {
            await api.post(`/groups/accept/${groupId}`);
            Toast.show({
                type: "success",
                text1: "Group accepted!",
            });
            fetchGroups();
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Accept failed",
            });
        }
    };

    const handleComplete = async (groupId: string) => {
        try {
            await api.post(`/groups/complete/${groupId}`);
            Toast.show({
                type: "success",
                text1: "Ride marked as completed",
            });
            fetchGroups();
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Failed to complete ride",
            });
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.heading}>🚘 Driver Dashboard</Title>

            <Button
                mode="outlined"
                onPress={fetchGroups}
                style={styles.refreshButton}
                icon="refresh"
            >
                Refresh Rides
            </Button>

            {groups.length === 0 && (
                <View style={styles.noData}>
                    <Text style={styles.noDataText}>
                        🚫 No ride groups waiting for drivers right now.
                    </Text>
                </View>
            )}

            {groups.map((group) => (
                <Card key={group._id} style={styles.card}>
                    <Card.Content>
                        <Text style={styles.bold}>Group ID: {group._id}</Text>
                        <Text>Pickup: {group.pickupLocation}</Text>
                        <Text>Drop: {group.dropLocation}</Text>
                        <Text>Status: {group.status}</Text>
                        <Text>Riders: {group.riders?.length || 0}</Text>
                        {group.totalFare && (
                            <Text style={styles.bold}>
                                Fare: ${group.totalFare}
                            </Text>
                        )}
                    </Card.Content>

                    <Card.Actions>
                        {group.status === "matched" && (
                            <Button onPress={() => handleAccept(group._id)}>
                                Accept
                            </Button>
                        )}

                        {group.status === "in_progress" && (
                            <Button onPress={() => handleComplete(group._id)}>
                                Mark Complete
                            </Button>
                        )}
                    </Card.Actions>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    heading: {
        fontSize: 24,
        marginBottom: 16,
        fontWeight: "bold",
    },
    card: {
        marginBottom: 16,
        backgroundColor: "#f4f4f4",
    },
    bold: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    noData: {
        alignItems: "center",
        marginTop: 40,
    },
    noDataText: {
        fontSize: 16,
        color: "#777",
    },
    refreshButton: {
        paddingVertical: 1,
        paddingHorizontal: 12,
    },
});
