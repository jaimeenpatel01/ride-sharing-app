import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useState } from "react";
import api from "../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const router = useRouter();

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const { token, role } = response.data;

            Toast.show({
                type: "success",
                position: "bottom",
                text1: `Welcome ${role}`,
                text2: "Login successful",
            });

            if (role === "rider") {
                router.replace("./(tabs)");
            } else if (role === "driver") {
                router.push("/(driver)/dashboard");
            }

            // Inside handleLogin:
            await AsyncStorage.setItem("token", token);
            await AsyncStorage.setItem("role", role);

            // TODO: Navigate to dashboard
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Login failed";
            Toast.show({
                type: "error",
                position: "bottom",
                text1: "Login Error",
                text2: msg,
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CabSplit</Text>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
            />

            <Button mode="contained" onPress={handleLogin}>
                Login
            </Button>

            <Text
                onPress={() => router.push("/signup")}
                style={{ color: "blue" }}
            >
                Sign Up
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 32,
        marginBottom: 32,
        textAlign: "center",
    },
    input: {
        marginBottom: 16,
    },
});
