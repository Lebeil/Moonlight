import { Stack } from 'expo-router';

export default function PartiesLayout() {
    return (
        <Stack>
            <Stack.Screen name="create" options={{ title: 'Créer une Soirée' }} />
        </Stack>
    );
} 