import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

interface ForumRulesProps {
  style?: any;
}

const ForumRules: React.FC<ForumRulesProps> = ({ style }) => {
  const { theme, textStyles } = useTheme();
  
  const rules = [
    { id: 1, text: 'Be respectful to others' },
    { id: 2, text: 'Share verified nutrition info' },
    { id: 3, text: 'Use appropriate tags' },
    { id: 4, text: 'Ask questions clearly' },
  ];
  
  return (
    <Card style={style.container}>
      <Text style={[styles.title, textStyles.heading4]}>Forum Rules</Text>
      
      <View style={styles.rulesContainer}>
        {rules.map(rule => (
          <View key={rule.id} style={styles.ruleItem}>
            <Text style={[styles.bulletPoint, { color: theme.textSecondary }]}>• </Text>
            <Text style={[styles.ruleText, textStyles.body]}>{rule.text}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  rulesContainer: {
    marginTop: SPACING.xs,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: SPACING.xs / 2,
  },
  ruleText: {
    flex: 1,
  },
});

export default ForumRules;