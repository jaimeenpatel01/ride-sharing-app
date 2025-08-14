import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, RadioButton } from "react-native-paper";
import { useRouter } from "expo-router";
import api from "../src/services/api";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export default function SignupScreen() {
    const router = useRouter(); // used for navigation
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"rider" | "driver">("rider");

    const handleSignup = async () => {
        try {
            const response = await api.post("/auth/signup", {
                name,
                email,
                password,
                role,
            });

            Toast.show({
                type: "success",
                position: 'bottom',
                text1: "Account created!",
                text2: "You can now log in",
            });

            router.replace("/");
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Signup failed";
            Toast.show({
                type: "error",
                position: 'bottom',
                text1: "Signup Error",
                text2: msg,
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <TextInput
                label="Full Name"
                value={name}
                mode="outlined"
                onChangeText={setName}
                style={styles.input}
            />

            <TextInput
                label="Email"
                value={email}
                mode="outlined"
                onChangeText={setEmail}
                autoCapitalize="none"
                style={styles.input}
            />

            <TextInput
                label="Password"
                value={password}
                mode="outlined"
                secureTextEntry
                onChangeText={setPassword}
                style={styles.input}
            />

            <Text style={styles.label}>Choose Role:</Text>
            <RadioButton.Group
                onValueChange={(value) => setRole(value as "rider" | "driver")}
                value={role}
            >
                <View style={styles.radioRow}>
                    <RadioButton value="rider" />
                    <Text>Rider</Text>
                    <RadioButton value="driver" />
                    <Text>Driver</Text>
                </View>
            </RadioButton.Group>

            <Button
                mode="contained"
                onPress={handleSignup}
                style={styles.button}
            >
                Sign Up
            </Button>

            <TouchableOpacity onPress={() => router.replace("/")}>
                <Text style={styles.loginLink}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>
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
        fontSize: 28,
        marginBottom: 24,
        textAlign: "center",
    },
    input: {
        marginBottom: 16,
    },
    label: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "500",
    },
    radioRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    button: {
        marginTop: 10,
    },
    loginLink: {
        textAlign: "center",
        marginTop: 20,
        color: "blue",
    },
});
