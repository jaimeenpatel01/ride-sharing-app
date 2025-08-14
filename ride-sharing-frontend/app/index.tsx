import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useState, useCallback } from "react";
import api from "../src/services/api";
import { AuthStorage } from "../src/utils/storage";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const router = useRouter();

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(async () => {
        if (loading) return;
        
        try {
            setLoading(true);
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const { token, role, user } = response.data;

            // Use optimized storage
            await Promise.all([
                AuthStorage.setToken(token),
                AuthStorage.setRole(role),
                AuthStorage.setUserData(user)
            ]);

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
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Login failed";
            Toast.show({
                type: "error",
                position: "bottom",
                text1: "Login Error",
                text2: msg,
            });
        } finally {
            setLoading(false);
        }
    }, [email, password, loading]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CabSplit</Text>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                autoComplete="password"
            />

            <Button 
                mode="contained" 
                onPress={handleLogin}
                loading={loading}
                disabled={loading || !email || !password}
            >
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
