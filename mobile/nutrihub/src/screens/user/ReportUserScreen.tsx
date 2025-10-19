import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ReportType } from '../../types/types';

type ReportUserRouteProp = RouteProp<{ ReportUser: { userId: number; username: string } }, 'ReportUser'>;

const REPORT_OPTIONS = [
  {
    type: 'invalid_certificate' as ReportType,
    title: 'Invalid Certificate',
    description: 'The certificate uploaded in the reported user\'s profile is not authenticated or does not match the profession claimed.',
    icon: 'certificate-outline'
  },
  {
    type: 'misleading_information' as ReportType,
    title: 'Misleading Information',
    description: 'The inventory, contact information, location, or the name of the store is incorrect, or a user profile contains false information.',
    icon: 'alert-circle-outline'
  }
];

const ReportUserScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ReportUserRouteProp>();
  const { userId, username } = route.params;

  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectReportType = (reportType: ReportType) => {
    setSelectedReportType(reportType);
  };

  const handleSubmitReport = async () => {
    if (!selectedReportType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description for your report');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Replace with actual API call
      // await userService.reportUser({
      //   reported_user_id: userId,
      //   report_type: selectedReportType,
      //   description: description.trim()
      // });
      
      Alert.alert(
        'Report Submitted',
        'Your report has been submitted successfully. Our moderators will review it and take appropriate action if necessary.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReportOption = (option: typeof REPORT_OPTIONS[0]) => {
    const isSelected = selectedReportType === option.type;
    
    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.reportOption,
          {
            backgroundColor: isSelected ? theme.primary : theme.surface,
            borderColor: isSelected ? theme.primary : theme.border,
          }
        ]}
        onPress={() => handleSelectReportType(option.type)}
      >
        <View style={styles.reportOptionHeader}>
          <View style={[styles.reportIcon, { backgroundColor: isSelected ? '#fff' : theme.primary }]}>
            <Icon name={option.icon as any} size={24} color={isSelected ? theme.primary : '#fff'} />
          </View>
          <View style={styles.reportOptionContent}>
            <Text style={[
              textStyles.subtitle,
              { color: isSelected ? '#fff' : theme.text }
            ]}>
              {option.title}
            </Text>
            <Text style={[
              textStyles.caption,
              { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
            ]}>
              {option.description}
            </Text>
          </View>
          <View style={[styles.radioButton, { borderColor: isSelected ? '#fff' : theme.border }]}>
            {isSelected && (
              <View style={[styles.radioButtonInner, { backgroundColor: '#fff' }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textStyles.heading3]}>Report User</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={[styles.userInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.userHeader}>
            <Icon name="account-alert" size={24} color={theme.warning} />
            <Text style={[textStyles.subtitle, { color: theme.text }]}>
              Reporting @{username}
            </Text>
          </View>
          <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
            Please select the reason for your report and provide additional details.
          </Text>
        </View>

        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
            Select Report Type
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.lg }]}>
            Choose the most appropriate reason for your report
          </Text>
          
          {REPORT_OPTIONS.map(renderReportOption)}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[textStyles.heading4, { color: theme.text, marginBottom: SPACING.md }]}>
            Additional Details
          </Text>
          <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md }]}>
            Please provide specific details about the issue. This information will help our moderators investigate your report.
          </Text>
          
          <View style={[styles.descriptionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[
                styles.descriptionInput,
                textStyles.body,
                { color: theme.text }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={[textStyles.small, { color: theme.textSecondary, textAlign: 'right', marginTop: SPACING.xs }]}>
              {description.length}/1000 characters
            </Text>
          </View>
        </View>

        {/* Guidelines */}
        <View style={[styles.guidelines, { backgroundColor: theme.info + '20', borderColor: theme.info }]}>
          <Icon name="information" size={20} color={theme.info} />
          <View style={styles.guidelinesContent}>
            <Text style={[textStyles.caption, { color: theme.info, fontWeight: '600' }]}>
              Report Guidelines
            </Text>
            <Text style={[textStyles.small, { color: theme.info }]}>
              • Reports are reviewed by our moderation team{'\n'}
              • False reports may result in account restrictions{'\n'}
              • We take all reports seriously and investigate thoroughly{'\n'}
              • You will be notified of the outcome of your report
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: selectedReportType && description.trim() ? theme.primary : theme.textDisabled,
            }
          ]}
          onPress={handleSubmitReport}
          disabled={!selectedReportType || !description.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
          <Text style={[textStyles.body, { color: '#fff', fontWeight: '600', marginLeft: SPACING.xs }]}>
            {submitting ? 'Submitting Report...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  reportOption: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  reportOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  reportOptionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  descriptionContainer: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  descriptionInput: {
    minHeight: 120,
  },
  guidelines: {
    flexDirection: 'row',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  guidelinesContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
});

export default ReportUserScreen;
