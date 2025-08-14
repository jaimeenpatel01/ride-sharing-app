import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import api from "../../src/services/api";
import Toast from "react-native-toast-message";

export default function DriverHistoryScreen() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchDriverHistory = async () => {
      try {
        const res = await api.get("/groups/driver-history");
        setRides(res.data);
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Failed to fetch ride history",
        });
      }
    };

    fetchDriverHistory();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧾 Your Ride History</Text>

      {rides.length === 0 && (
        <Text style={styles.empty}>No completed rides yet.</Text>
      )}

      {rides.map((ride: any) => (
        <Card key={ride._id} style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>Pickup: {ride.pickupLocation}</Text>
            <Text style={styles.label}>Drop: {ride.dropLocation}</Text>
            <Text style={styles.label}>Status: ✅ Completed</Text>
            <Text style={styles.label}>Riders:</Text>
            {ride.riders?.map((r: any, index: number) => (
              <Text key={index} style={styles.rider}>
                • {r.rider?.name || "Unnamed Rider"}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#f8f8f8",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  rider: {
    marginLeft: 12,
    marginBottom: 2,
  },
});
