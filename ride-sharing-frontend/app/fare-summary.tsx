import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Divider } from "react-native-paper";
import { useRouter } from "expo-router";
import api from "../src/services/api";

interface Rider { 
  name: string;
  email: string;
}

interface FareSummary {
  pickupLocation: string;
  dropLocation: string;
  totalFare: number;
  perPersonFare: number;
  riders: Rider[];
}

export default function FareSummaryScreen() {
  const router = useRouter();
  const [fareSummary, setFareSummary] = React.useState<FareSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchFareSummary = async () => {
      try {
        const res = await api.get("/rides/fare-summary");
        setFareSummary(res.data);
      } catch (err: any) {
        console.error("Error loading fare summary:", err);
        setError(err?.response?.data?.message || "Failed to fetch fare summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchFareSummary();
  }, []);

  if (loading) {
    return <Text style={{ marginTop: 50, textAlign: "center" }}>Loading fare summary...</Text>;
  }

  if (error || !fareSummary) {
    return <Text style={{ marginTop: 50, textAlign: "center", color: "red" }}>{error || "No completed ride found."}</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💰 Fare Summary</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={styles.text}>{fareSummary.pickupLocation}</Text>

          <Text style={styles.label}>Drop Location</Text>
          <Text style={styles.text}>{fareSummary.dropLocation}</Text>

          <Divider style={styles.divider} />

          <Text style={styles.label}>Total Fare</Text>
          <Text style={styles.amount}>₹{fareSummary.totalFare.toFixed(2)}</Text>

          <Text style={styles.label}>Your Share</Text>
          <Text style={styles.amountHighlight}>₹{fareSummary.perPersonFare.toFixed(2)}</Text>

          <Divider style={styles.divider} />

          <Text style={styles.label}>Riders in Group</Text>
          {fareSummary.riders.map((rider, index) => (
            <Text key={index} style={styles.text}>- {rider.name} ({rider.email})</Text>
          ))}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => router.replace("/(tabs)")}
      >
        Go Home
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontWeight: "bold",
    marginTop: 12,
    fontSize: 14,
    color: "#555",
  },
  text: {
    fontSize: 16,
    marginTop: 4,
  },
  amount: {
    fontSize: 20,
    marginTop: 4,
    fontWeight: "bold",
  },
  amountHighlight: {
    fontSize: 24,
    color: "#4caf50",
    fontWeight: "bold",
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  button: {
    marginTop: 12,
    paddingVertical: 4,
  },
});
