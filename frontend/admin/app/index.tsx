import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Text, Card, Button, Input } from '@rneui/themed';
import PocketBase from 'pocketbase';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';

// Pour le développement sur un appareil physique ou un émulateur, utilisez l'adresse IP de votre ordinateur
// Configuration pour différents environnements
const pbUrl = Platform.OS === 'web' ? 'http://127.0.0.1:8090' : 'http://192.168.1.39:8090'; // Adresse IP correcte
const pb = new PocketBase(pbUrl);

export default function AdminApp() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [loadingValidation, setLoadingValidation] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);

    const router = useRouter();
    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: '',
            password: '',
        }
    });

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
        checkAdminAuthentication(); // Vérification de l'authentification au démarrage
    }, []);

    const checkAdminAuthentication = async () => {
        setAuthenticating(true);
        try {
            // Récupérer le token d'authentification stocké
            const authData = await AsyncStorage.getItem('pb_auth');
            if (authData) {
                // Charger les données d'authentification
                const authDataObj = JSON.parse(authData);
                pb.authStore.save(authDataObj.token, authDataObj.record);

                if (pb.authStore.isValid) {
                    setIsAdminAuthenticated(true);
                } else {
                    setIsAdminAuthenticated(false);
                }
            } else {
                setIsAdminAuthenticated(false);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de l'auth:", error);
            setIsAdminAuthenticated(false); // En cas d'erreur, considérer non authentifié
        } finally {
            setAuthenticating(false);
        }
    };

    const handleAdminLogin = async (data: { email: string, password: string }) => {
        setAuthenticating(true);
        try {
            // Authentification avec PocketBase
            await pb.collection('users').authWithPassword(data.email, data.password);

            // Stocker les informations d'authentification
            const authDataToStore = {
                token: pb.authStore.token,
                record: pb.authStore.record
            };
            await AsyncStorage.setItem('pb_auth', JSON.stringify(authDataToStore));

            setIsAdminAuthenticated(true);
            Alert.alert("Connexion réussie!", `Bienvenue Admin ${data.email}`);
        } catch (error: any) {
            console.error("Erreur de connexion:", error);
            setIsAdminAuthenticated(false);
            Alert.alert(
                "Erreur de connexion",
                `Détails: ${error.message || JSON.stringify(error)}`
            );
        } finally {
            setAuthenticating(false);
        }
    };

    const handleAdminLogout = async () => {
        try {
            pb.authStore.clear();
            await AsyncStorage.removeItem('pb_auth');
            setIsAdminAuthenticated(false);
            Alert.alert("Déconnexion", "Vous avez été déconnecté avec succès.");
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    };


    const handleBarCodeScanned = async ({ type, data }: any) => {
        setScanned(true);
        setScanResult(data);
        setValidationMessage(null);
        setLoadingValidation(true);

        try {
            const records = await pb.collection('invitations').getList(1, 1, {
                filter: `qrCodeInvitation="${data}"`,
            });

            if (records.items.length === 0) {
                setValidationMessage("Invitation invalide : QR code inconnu.");
            } else {
                const invitation = records.items[0];
                if (invitation.isScanned) {
                    setValidationMessage("Invitation déjà scannée !");
                } else {
                    await pb.collection('invitations').update(invitation.id, {
                        isScanned: true,
                        scannedAt: new Date(),
                    });
                    setValidationMessage("Invitation VALIDE ! Accès autorisé.");
                }
            }
        } catch (error: any) {
            console.error("Erreur de validation du QR code:", error);
            setValidationMessage("Erreur de validation. Veuillez réessayer.");
        } finally {
            setLoadingValidation(false);
        }
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    if (authenticating) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007bff" /><Text>Vérification d'authentification...</Text></View>;
    }

    if (!isAdminAuthenticated) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.authContainer}
            >
                <View style={styles.authFormContainer}>
                    <Text h4 style={styles.authTitle}>Connexion Admin</Text>
                    <Controller
                        control={control}
                        rules={{ required: 'L\'email est obligatoire', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Email invalide' } }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                placeholder="Email"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.email?.message}
                                containerStyle={styles.inputContainer}
                                keyboardType="email-address"
                            />
                        )}
                        name="email"
                    />
                    <Controller
                        control={control}
                        rules={{ required: 'Le mot de passe est obligatoire', minLength: { value: 6, message: 'Mot de passe trop court (min 6 caractères)' } }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                placeholder="Mot de passe"
                                secureTextEntry
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.password?.message}
                                containerStyle={styles.inputContainer}
                            />
                        )}
                        name="password"
                    />
                    <Button
                        title="Se Connecter"
                        onPress={handleSubmit(handleAdminLogin)}
                        loading={authenticating}
                        disabled={authenticating}
                        containerStyle={styles.buttonContainer}
                    />
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.container}>
            {!scanned && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr']
                    }}
                />
            )}

            <View style={styles.scanArea} />

            <View style={styles.resultContainer}>
                {scanResult && (
                    <Card>
                        <Card.Title>Résultat du Scan</Card.Title>
                        <Text style={{ marginBottom: 10 }}>
                            QR Code Value: {scanResult}
                        </Text>
                        {validationMessage && (
                            <Text style={{ fontWeight: 'bold', textAlign: 'center', marginTop: 10 }}>
                                {validationMessage}
                            </Text>
                        )}
                        <Button
                            title={'Scanner à nouveau'}
                            onPress={() => setScanned(false)}
                            loading={loadingValidation}
                            disabled={loadingValidation}
                        />
                    </Card>
                )}
                <Button
                    title="Créer une Soirée"
                    onPress={() => router.push('/(parties)/create')}
                    containerStyle={styles.createPartyButton}
                />
                <Button
                    title="Se Déconnecter"
                    onPress={handleAdminLogout}
                    type="outline"
                    containerStyle={styles.logoutButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
    },
    authFormContainer: {
        padding: 20,
        width: '80%',
        alignSelf: 'center',
    },
    authTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    buttonContainer: {
        marginTop: 20,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
    },
    scanArea: {},
    resultContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    createPartyButton: {
        marginTop: 20,
    },
    logoutButton: {
        marginTop: 10,
    },
});