import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, ScrollView, Vibration } from 'react-native';
import { Input, Button, Text, Icon } from '@rneui/themed';
import PocketBase from 'pocketbase';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import theme from '../theme';

// Pour le développement sur un appareil physique ou un émulateur, utilisez l'adresse IP de votre ordinateur
const pbUrl = Platform.OS === 'web' ? 'http://127.0.0.1:8090' : 'http://192.168.1.39:8090';
const pb = new PocketBase(pbUrl);

// Composant de sélecteur rotatif simplifié
const WheelPicker = ({ items, selectedValue, onValueChange, itemHeight = 50 }) => {
    const scrollViewRef = useRef(null);
    const [scrolling, setScrolling] = useState(false);

    // Faire défiler jusqu'à la valeur sélectionnée lors du montage
    useEffect(() => {
        if (scrollViewRef.current && !scrolling) {
            const selectedIndex = items.findIndex(item => item.value === selectedValue);
            if (selectedIndex !== -1) {
                setTimeout(() => {
                    scrollViewRef.current.scrollTo({ y: selectedIndex * itemHeight, animated: false });
                }, 100);
            }
        }
    }, [selectedValue, items, scrolling]);

    const handleScroll = (event) => {
        if (!scrolling) return;

        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / itemHeight);
        if (index >= 0 && index < items.length && items[index]?.value !== undefined) {
            onValueChange(items[index].value);
        }
    };

    const handleScrollBegin = () => {
        setScrolling(true);
    };

    const handleMomentumScrollEnd = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / itemHeight);

        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: index * itemHeight, animated: true });

            if (index >= 0 && index < items.length && items[index]?.value !== undefined) {
                onValueChange(items[index].value);
            }
        }

        // Réinitialiser l'état de défilement après un court délai
        setTimeout(() => {
            setScrolling(false);
        }, 150);
    };

    // Créer un tableau d'éléments avec des éléments vides au début et à la fin pour le padding
    const paddedItems = [...items];

    return (
        <View style={styles.wheelPickerOuterContainer}>
            {/* Flèche du haut */}
            <TouchableOpacity
                style={styles.wheelPickerArrowContainer}
                onPress={() => {
                    const selectedIndex = items.findIndex(item => item.value === selectedValue);
                    if (selectedIndex > 0 && scrollViewRef.current) {
                        const newIndex = selectedIndex - 1;
                        scrollViewRef.current.scrollTo({ y: newIndex * itemHeight, animated: true });
                        onValueChange(items[newIndex].value);
                        Vibration.vibrate(10);
                    }
                }}
                accessibilityLabel="Défiler vers le haut"
            >
                <Text style={styles.scrollIndicatorText}>▲</Text>
            </TouchableOpacity>

            {/* Zone centrale avec la sélection */}
            <View style={styles.wheelPickerContainer}>
                {/* Lignes de sélection */}
                <View style={styles.wheelPickerSelectionContainer}>
                    <View style={styles.wheelPickerSelectionLine} />
                    <View style={styles.wheelPickerSelectionMiddle} />
                    <View style={styles.wheelPickerSelectionLine} />
                </View>

                {/* ScrollView avec les éléments */}
                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    onScrollBeginDrag={handleScrollBegin}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingTop: itemHeight, paddingBottom: itemHeight }}
                    bounces={true}
                    style={{ flexGrow: 0 }}
                >
                    {paddedItems.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.value}-${index}`}
                            style={[
                                styles.wheelPickerItem,
                                { height: itemHeight }
                            ]}
                            onPress={() => {
                                if (scrollViewRef.current) {
                                    scrollViewRef.current.scrollTo({ y: index * itemHeight, animated: true });
                                    onValueChange(item.value);
                                    Vibration.vibrate(10);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.wheelPickerItemText,
                                    selectedValue === item.value && styles.wheelPickerItemTextSelected
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Flèche du bas */}
            <TouchableOpacity
                style={styles.wheelPickerArrowContainer}
                onPress={() => {
                    const selectedIndex = items.findIndex(item => item.value === selectedValue);
                    if (selectedIndex < items.length - 1 && scrollViewRef.current) {
                        const newIndex = selectedIndex + 1;
                        scrollViewRef.current.scrollTo({ y: newIndex * itemHeight, animated: true });
                        onValueChange(items[newIndex].value);
                        Vibration.vibrate(10);
                    }
                }}
                accessibilityLabel="Défiler vers le bas"
            >
                <Text style={styles.scrollIndicatorText}>▼</Text>
            </TouchableOpacity>
        </View>
    );
};

// Composant personnalisé de sélection de date
const SimpleDatePicker = ({ value, onChange, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(value);
    const [selectedDay, setSelectedDay] = useState(value.getDate());
    const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
    const [selectedYear, setSelectedYear] = useState(value.getFullYear());
    const [selectedHour, setSelectedHour] = useState(value.getHours());
    const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());
    const [activeTab, setActiveTab] = useState('date'); // 'date', 'time'
    const [dateSubTab, setDateSubTab] = useState('day'); // 'day', 'month', 'year'

    // Générer les options pour les jours du mois sélectionné
    const generateDays = () => {
        const days = [];
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                label: i.toString().padStart(2, '0'),
                value: i
            });
        }
        return days;
    };

    // Générer les options pour les mois
    const generateMonths = () => {
        const months = [];
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        for (let i = 0; i < 12; i++) {
            months.push({
                label: monthNames[i],
                value: i
            });
        }
        return months;
    };

    // Générer les options pour les années (jusqu'à 5 ans dans le futur)
    const generateYears = () => {
        const years = [];
        const currentYear = new Date().getFullYear();

        for (let i = 0; i <= 5; i++) {
            const year = currentYear + i;
            years.push({
                label: year.toString(),
                value: year
            });
        }
        return years;
    };

    // Générer les options pour les heures
    const generateHours = () => {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            hours.push({
                label: i.toString().padStart(2, '0') + 'h',
                value: i
            });
        }
        return hours;
    };

    // Générer les options pour les minutes
    const generateMinutes = () => {
        const minutes = [];
        for (let i = 0; i < 60; i += 5) {
            minutes.push({
                label: i.toString().padStart(2, '0') + 'min',
                value: i
            });
        }
        return minutes;
    };

    // Mettre à jour la date sélectionnée lorsque les composants changent
    useEffect(() => {
        const newDate = new Date(selectedYear, selectedMonth, 1);
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

        // S'assurer que le jour sélectionné est valide pour le mois
        const validDay = Math.min(selectedDay, daysInMonth);
        if (validDay !== selectedDay) {
            setSelectedDay(validDay);
        }

        newDate.setDate(validDay);
        setSelectedDate(newDate);
    }, [selectedYear, selectedMonth, selectedDay]);

    const days = generateDays();
    const months = generateMonths();
    const years = generateYears();
    const hours = generateHours();
    const minutes = generateMinutes();

    const handleConfirm = () => {
        try {
            const newDate = new Date(selectedYear, selectedMonth, selectedDay);
            if (isNaN(newDate.getTime())) {
                throw new Error("Date invalide");
            }

            newDate.setHours(selectedHour);
            newDate.setMinutes(selectedMinute);

            // Vérifier que la date est dans le futur
            const now = new Date();
            if (newDate < now) {
                Alert.alert("Attention", "Vous avez sélectionné une date dans le passé.");
            }

            onChange(newDate);
            onClose();
        } catch (error) {
            console.error("Erreur lors de la création de la date:", error);
            Alert.alert("Erreur", "Date invalide. Veuillez réessayer.");
        }
    };

    return (
        <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Sélectionner une date et heure</Text>
            <Text style={styles.datePickerInstructions}>Faites défiler pour sélectionner</Text>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'date' && styles.activeTab]}
                    onPress={() => setActiveTab('date')}
                    accessibilityLabel="Onglet Date"
                    accessibilityHint="Sélectionner le jour, mois et année"
                >
                    <Text style={[styles.tabText, activeTab === 'date' && styles.activeTabText]}>Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'time' && styles.activeTab]}
                    onPress={() => setActiveTab('time')}
                    accessibilityLabel="Onglet Heure"
                    accessibilityHint="Sélectionner l'heure et les minutes"
                >
                    <Text style={[styles.tabText, activeTab === 'time' && styles.activeTabText]}>Heure</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'date' ? (
                <View style={styles.datePickerContent}>
                    <View style={styles.dateSubTabContainer}>
                        <TouchableOpacity
                            style={[styles.dateSubTab, dateSubTab === 'day' && styles.activeDateSubTab]}
                            onPress={() => setDateSubTab('day')}
                            accessibilityLabel="Sélectionner le jour"
                        >
                            <Text style={[styles.dateSubTabText, dateSubTab === 'day' && styles.activeDateSubTabText]}>Jour</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateSubTab, dateSubTab === 'month' && styles.activeDateSubTab]}
                            onPress={() => setDateSubTab('month')}
                            accessibilityLabel="Sélectionner le mois"
                        >
                            <Text style={[styles.dateSubTabText, dateSubTab === 'month' && styles.activeDateSubTabText]}>Mois</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateSubTab, dateSubTab === 'year' && styles.activeDateSubTab]}
                            onPress={() => setDateSubTab('year')}
                            accessibilityLabel="Sélectionner l'année"
                        >
                            <Text style={[styles.dateSubTabText, dateSubTab === 'year' && styles.activeDateSubTabText]}>Année</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerWrapper}>
                        {dateSubTab === 'day' && (
                            <>
                                <Text style={styles.datePickerLabel}>Choisissez le jour:</Text>
                                <WheelPicker
                                    items={days}
                                    selectedValue={selectedDay}
                                    onValueChange={setSelectedDay}
                                    itemHeight={50}
                                />
                            </>
                        )}

                        {dateSubTab === 'month' && (
                            <>
                                <Text style={styles.datePickerLabel}>Choisissez le mois:</Text>
                                <WheelPicker
                                    items={months}
                                    selectedValue={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                    itemHeight={50}
                                />
                            </>
                        )}

                        {dateSubTab === 'year' && (
                            <>
                                <Text style={styles.datePickerLabel}>Choisissez l'année:</Text>
                                <WheelPicker
                                    items={years}
                                    selectedValue={selectedYear}
                                    onValueChange={setSelectedYear}
                                    itemHeight={50}
                                />
                            </>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.datePickerContent}>
                    <Text style={styles.datePickerLabel}>Choisissez l'heure:</Text>
                    <View style={styles.timePickersContainer}>
                        <View style={styles.timePicker}>
                            <Text style={styles.timePickerLabel}>Heures</Text>
                            <WheelPicker
                                items={hours}
                                selectedValue={selectedHour}
                                onValueChange={setSelectedHour}
                                itemHeight={50}
                            />
                        </View>
                        <View style={styles.timePicker}>
                            <Text style={styles.timePickerLabel}>Minutes</Text>
                            <WheelPicker
                                items={minutes}
                                selectedValue={selectedMinute}
                                onValueChange={setSelectedMinute}
                                itemHeight={50}
                            />
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.dateTimePreview}>
                <Text style={styles.dateTimePreviewText}>
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {selectedHour.toString().padStart(2, '0')}h{selectedMinute.toString().padStart(2, '0')}
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    accessibilityLabel="Annuler la sélection de date"
                    accessibilityHint="Ferme le sélecteur sans enregistrer la date"
                >
                    <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    accessibilityLabel="Confirmer la date"
                    accessibilityHint="Enregistre la date sélectionnée"
                >
                    <Text style={styles.buttonText}>Confirmer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function CreatePartyScreen() {
    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            date: new Date(),
        }
    });
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const router = useRouter();

    // Fonction pour formater la date pour l'affichage
    const formatDate = (date: Date) => {
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const onSubmit = async (data: { name: string, date: Date }) => {
        setLoading(true);
        try {
            // Récupérer l'utilisateur connecté (admin créateur)
            const adminUser = pb.authStore.record;
            if (!adminUser) {
                Alert.alert("Erreur d'authentification", "Vous devez être connecté pour créer une soirée.");
                return;
            }

            // Créer la soirée dans PocketBase, en liant l'admin créateur
            await pb.collection('parties').create({
                name: data.name,
                date: data.date.toISOString(), // Convertir la date en string ISO pour PocketBase
                createdBy: adminUser.id, // Lier à l'admin connecté
            });

            Alert.alert("Succès", "Soirée créée avec succès !");
            router.back(); // Retour à l'écran précédent (scanner) après création
        } catch (error: any) {
            console.error("Erreur lors de la création de la soirée:", error);
            Alert.alert("Erreur", "Erreur lors de la création de la soirée. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text h4 style={styles.title}>Créer une Soirée</Text>

                <Controller
                    control={control}
                    rules={{ required: 'Le nom de la soirée est obligatoire' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                            placeholder="Nom de la soirée"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            errorMessage={errors.name?.message}
                            containerStyle={styles.inputContainer}
                        />
                    )}
                    name="name"
                />

                <Controller
                    control={control}
                    rules={{ required: 'La date de la soirée est obligatoire' }}
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.datePickerContainer}>
                            <Text style={styles.inputLabel}>Date et heure de la soirée</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => {
                                    setShowDatePicker(true);
                                    Vibration.vibrate(10); // Légère vibration pour le retour tactile
                                }}
                                accessibilityLabel="Sélectionner la date et l'heure"
                                accessibilityHint="Ouvre un sélecteur pour choisir la date et l'heure de la soirée"
                            >
                                <Text style={styles.dateButtonText}>
                                    {formatDate(value)}
                                </Text>
                                <Icon
                                    name="calendar"
                                    type="font-awesome"
                                    color={theme.lightColors?.primary || '#2089dc'}
                                    size={20}
                                />
                            </TouchableOpacity>

                            <Modal
                                visible={showDatePicker}
                                transparent={true}
                                animationType="slide"
                            >
                                <View style={styles.modalContainer}>
                                    <SimpleDatePicker
                                        value={value}
                                        onChange={onChange}
                                        onClose={() => setShowDatePicker(false)}
                                    />
                                </View>
                            </Modal>

                            {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
                        </View>
                    )}
                    name="date"
                />

                <Button
                    title="Créer la soirée"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    containerStyle={styles.buttonContainer}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
    },
    formContainer: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    datePickerContainer: {
        marginBottom: 15,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: theme.lightColors?.primary || '#2089dc',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        backgroundColor: 'rgba(32, 137, 220, 0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        color: '#000',
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        marginTop: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    datePickerModal: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    datePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    datePickerInstructions: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    datePickerLabel: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.lightColors?.primary || '#2089dc',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: theme.lightColors?.primary || '#2089dc',
        fontWeight: 'bold',
    },
    datePickerContent: {
        marginBottom: 20,
    },
    wheelPickerOuterContainer: {
        height: 150,
        flexDirection: 'column',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
        overflow: 'hidden',
    },
    wheelPickerContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    wheelPickerArrowContainer: {
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
    },
    wheelPickerSelectionContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        marginTop: -25,
        height: 50,
        zIndex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'none',
    },
    wheelPickerSelectionLine: {
        height: 1,
        backgroundColor: theme.lightColors?.primary || '#2089dc',
        width: '100%',
    },
    wheelPickerSelectionMiddle: {
        flex: 1,
        backgroundColor: 'rgba(32, 137, 220, 0.05)',
    },
    wheelPickerItem: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 0,
        marginVertical: 0,
    },
    wheelPickerItemText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 50,
        height: 50,
        paddingVertical: 0,
        marginVertical: 0,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    wheelPickerItemTextSelected: {
        color: theme.lightColors?.primary || '#2089dc',
        fontWeight: 'bold',
        fontSize: 20,
        lineHeight: 50,
        height: 50,
        paddingVertical: 0,
        marginVertical: 0,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    timePickersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timePicker: {
        width: '48%',
    },
    timePickerLabel: {
        textAlign: 'center',
        marginBottom: 5,
        fontSize: 14,
        color: '#666',
    },
    dateTimePreview: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    dateTimePreviewText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#333',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        padding: 12,
        borderRadius: 5,
        width: '48%',
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 5,
        width: '48%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    scrollIndicatorText: {
        color: theme.lightColors?.primary || '#2089dc',
        fontSize: 14,
    },
    inputLabel: {
        fontSize: 16,
        color: '#86939e',
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 10,
    },
    dateSubTabContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateSubTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeDateSubTab: {
        backgroundColor: 'rgba(32, 137, 220, 0.1)',
        borderBottomWidth: 2,
        borderBottomColor: theme.lightColors?.primary || '#2089dc',
    },
    dateSubTabText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    activeDateSubTabText: {
        color: theme.lightColors?.primary || '#2089dc',
        fontWeight: 'bold',
    },
    pickerWrapper: {
        width: '100%',
        marginBottom: 10,
    },
});