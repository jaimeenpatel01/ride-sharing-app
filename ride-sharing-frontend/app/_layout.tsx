import { Stack } from "expo-router";
import { SafeAreaView, StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function Layout() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <PaperProvider>
                <Stack screenOptions={{ headerShown: false }} />
                <Toast />
            </PaperProvider>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: 16, // ✅ global top padding
    },
});
