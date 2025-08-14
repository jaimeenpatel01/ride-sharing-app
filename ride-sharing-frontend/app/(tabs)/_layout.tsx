import { Tabs } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, StyleSheet } from "react-native";

export default function TabLayout() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#2196f3",
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons
                                name="home"
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="status"
                    options={{
                        title: "Status",
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons
                                name="location-pin"
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: "History",
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons
                                name="history"
                                size={size}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: 16, // ✅ global top padding
    },
});
