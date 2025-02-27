import { Stack } from 'expo-router';
import { ThemeProvider } from '@rneui/themed';
import { theme } from './theme'; // On réutilisera le même thème

export default function Layout() {
    return (
        <ThemeProvider theme={theme}>
            <Stack screenOptions={{ headerShown: true }}>
                <Stack.Screen name="index" options={{ title: 'Scanner Invitations' }} /> {/* Écran scanner principal */}
                <Stack.Screen name="(parties)" options={{ headerShown: false }} />
            </Stack>
        </ThemeProvider>
    );
}