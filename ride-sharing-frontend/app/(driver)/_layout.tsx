import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function DriverTabsLayout() {
    return (
        <Tabs >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="dashboard" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="history" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="person" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
