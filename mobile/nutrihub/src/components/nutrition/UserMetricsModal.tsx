import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { UserMetrics } from '../../types/nutrition';
import { nutritionService } from '../../services/api/nutrition.service';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface UserMetricsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (metrics: UserMetrics) => void;
    initialMetrics?: UserMetrics | null;
}

const UserMetricsModal: React.FC<UserMetricsModalProps> = ({
    visible,
    onClose,
    onSave,
    initialMetrics
}) => {
    const { theme, textStyles } = useTheme();
    const [loading, setLoading] = useState(false);

    // Default values when no metrics exist
    const DEFAULT_METRICS = {
        height: 170,
        weight: 70,
        age: 30,
        gender: 'M' as const,
        activityLevel: 'moderate' as const
    };

    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [activityLevel, setActivityLevel] = useState<UserMetrics['activity_level']>('moderate');

    useEffect(() => {
        if (initialMetrics) {
            setHeight(initialMetrics.height.toString());
            setWeight(initialMetrics.weight.toString());
            setAge(initialMetrics.age.toString());
            setGender(initialMetrics.gender);
            setActivityLevel(initialMetrics.activity_level);
        } else {
            // Clear fields when no metrics exist (don't pre-fill with defaults)
            setHeight('');
            setWeight('');
            setAge('');
            setGender('M');
            setActivityLevel('moderate');
        }
    }, [initialMetrics, visible]);

    const handleSave = async () => {
        if (!height || !weight || !age) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);
        const ageNum = parseInt(age);

        if (isNaN(heightNum) || isNaN(weightNum) || isNaN(ageNum)) {
            Alert.alert('Error', 'Please enter valid numbers');
            return;
        }

        setLoading(true);
        try {
            const metricsData: Partial<UserMetrics> = {
                height: heightNum,
                weight: weightNum,
                age: ageNum,
                gender,
                activity_level: activityLevel
            };

            const updatedMetrics = await nutritionService.updateUserMetrics(metricsData);
            onSave(updatedMetrics);
            onClose();
        } catch (error) {
            console.error('Error saving metrics:', error);
            Alert.alert('Error', 'Failed to save metrics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const activityLevels: { value: UserMetrics['activity_level']; label: string; description: string }[] = [
        { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
        { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
        { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
        { value: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
        { value: 'very_active', label: 'Very Active', description: 'Very hard exercise & physical job' }
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[textStyles.heading3, { color: theme.text }]}>
                            {initialMetrics ? 'Update Your Metrics' : 'Set Up Your Metrics'}
                        </Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        <Text style={[textStyles.body, { color: theme.textSecondary, marginBottom: 20 }]}>
                            {initialMetrics
                                ? 'We need your physical metrics to calculate your daily nutrition targets accurately.'
                                : 'To get started with nutrition tracking, we need some basic information about you. You can adjust these values later.'}
                        </Text>

                        {/* Gender Selection */}
                        <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                        <View style={styles.genderContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    {
                                        borderColor: gender === 'M' ? theme.primary : theme.border,
                                        backgroundColor: gender === 'M' ? `${theme.primary}10` : theme.surface
                                    }
                                ]}
                                onPress={() => setGender('M')}
                            >
                                <Icon name="gender-male" size={24} color={gender === 'M' ? theme.primary : theme.textSecondary} />
                                <Text style={[
                                    textStyles.body,
                                    { color: gender === 'M' ? theme.primary : theme.textSecondary, marginTop: 4 }
                                ]}>Male</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    {
                                        borderColor: gender === 'F' ? theme.primary : theme.border,
                                        backgroundColor: gender === 'F' ? `${theme.primary}10` : theme.surface
                                    }
                                ]}
                                onPress={() => setGender('F')}
                            >
                                <Icon name="gender-female" size={24} color={gender === 'F' ? theme.primary : theme.textSecondary} />
                                <Text style={[
                                    textStyles.body,
                                    { color: gender === 'F' ? theme.primary : theme.textSecondary, marginTop: 4 }
                                ]}>Female</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Numeric Inputs */}
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border,
                                        color: theme.text
                                    }]}
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border,
                                        color: theme.text
                                    }]}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    color: theme.text
                                }]}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        {/* Activity Level */}
                        <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>Activity Level</Text>
                        {activityLevels.map((level) => (
                            <TouchableOpacity
                                key={level.value}
                                style={[
                                    styles.activityOption,
                                    {
                                        borderColor: activityLevel === level.value ? theme.primary : theme.border,
                                        backgroundColor: activityLevel === level.value ? `${theme.primary}10` : theme.surface
                                    }
                                ]}
                                onPress={() => setActivityLevel(level.value)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        textStyles.body,
                                        { fontWeight: '600', color: activityLevel === level.value ? theme.primary : theme.text }
                                    ]}>
                                        {level.label}
                                    </Text>
                                    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                                        {level.description}
                                    </Text>
                                </View>
                                {activityLevel === level.value && (
                                    <Icon name="check-circle" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[textStyles.button, { color: '#fff' }]}>Save & Calculate Targets</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    genderButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    halfInput: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    activityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default UserMetricsModal;
