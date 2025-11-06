import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Theme } from '../../constants/Colors';
import { buildBackendUrl } from '../../src/utils/backendUrl';

interface ExcelUploaderProps {
  onFileSelected: (fileUri: string, fileName: string) => void;
  onParseComplete: (questions: any[], errors: string[]) => void;
  isLoading?: boolean;
}

export default function ExcelUploader({ 
  onFileSelected, 
  onParseComplete, 
  isLoading = false 
}: ExcelUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFilePick = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file.uri);
        setFileName(file.name);
        onFileSelected(file.uri, file.name);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFile(null);
    setFileName('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Custom Quiz</Text>
      <Text style={styles.subtitle}>
        Upload an Excel file (.xlsx or .xls) with your quiz questions
      </Text>

      {/* File Format Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="information-circle" size={20} color={Theme.dark.accent} />
          <Text style={styles.instructionsTitle}>Excel Format Required</Text>
        </View>
         <View style={styles.instructionsList}>
           <Text style={styles.instructionItem}>• Column A: Question</Text>
           <Text style={styles.instructionItem}>• Column B: Option 1</Text>
           <Text style={styles.instructionItem}>• Column C: Option 2</Text>
           <Text style={styles.instructionItem}>• Column D: Option 3</Text>
           <Text style={styles.instructionItem}>• Column E: Option 4</Text>
           <Text style={styles.instructionItem}>• Column F: Correct Answer (1-4)</Text>
         </View>
      </View>

      {/* File Upload Area */}
      <View style={styles.uploadArea}>
        {selectedFile ? (
          <View style={styles.fileSelected}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={24} color={Theme.dark.accent} />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {fileName}
                </Text>
                <Text style={styles.fileStatus}>Ready to process</Text>
              </View>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={handleRemoveFile}
            >
              <Ionicons name="close-circle" size={24} color={Theme.dark.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.uploadButton, isLoading && styles.uploadButtonDisabled]}
            onPress={handleFilePick}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading 
                ? [Theme.dark.surface, Theme.dark.surfaceAlt]
                : Theme.dark.gradient.primary
              }
              style={styles.uploadButtonGradient}
            >
              <Ionicons 
                name="cloud-upload" 
                size={32} 
                color={isLoading ? Theme.dark.textSecondary : '#ffffff'} 
              />
              <Text style={[
                styles.uploadButtonText,
                isLoading && styles.uploadButtonTextDisabled
              ]}>
                {isLoading ? 'Processing...' : 'Select Excel File'}
              </Text>
              <Text style={styles.uploadButtonSubtext}>
                .xlsx or .xls files only
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Sample Download */}
      <View style={styles.sampleSection}>
        <Text style={styles.sampleTitle}>Need a template?</Text>
         <Pressable
           style={styles.sampleButton}
           onPress={async () => {
             try {
               const url = buildBackendUrl('/sample-excel');
               // Quick availability check to avoid saving HTML error pages
               const head = await fetch(url, { method: 'HEAD' });
               if (!head.ok) {
                 Alert.alert('Download Error', 'Sample endpoint is not reachable. Please ensure the backend is running and up to date, then try again.');
                 return;
               }
               const contentType = head.headers.get('content-type') || '';
               if (!contentType.includes('spreadsheet') && !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
                 // Proceed anyway, but warn user
                 console.log('Unexpected content-type for sample-excel:', contentType);
               }
               const fileUri = FileSystem.cacheDirectory + 'quiz_template.xlsx';
               const downloadRes = await FileSystem.downloadAsync(url, fileUri);
               if (await Sharing.isAvailableAsync()) {
                 await Sharing.shareAsync(downloadRes.uri);
               } else {
                 Alert.alert('Downloaded', `Saved to: ${downloadRes.uri}`);
               }
             } catch (_error) {
               Alert.alert('Error', 'Failed to download sample file. Please try again.');
             }
           }}
         >
          <Ionicons name="download" size={16} color={Theme.dark.accent} />
          <Text style={styles.sampleButtonText}>Download Sample Template</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.dark.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: Theme.dark.glass.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
    ...Theme.dark.shadow.soft,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
    marginLeft: 8,
  },
  instructionsList: {
    gap: 4,
  },
  instructionItem: {
    fontSize: 13,
    color: Theme.dark.textSecondary,
    lineHeight: 18,
  },
  uploadArea: {
    marginBottom: 24,
  },
  uploadButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.dark.shadow.medium,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadButtonTextDisabled: {
    color: Theme.dark.textSecondary,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.dark.glass.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.dark.glass.border,
    ...Theme.dark.shadow.soft,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.dark.textPrimary,
    marginBottom: 2,
  },
  fileStatus: {
    fontSize: 12,
    color: Theme.dark.success,
  },
  removeButton: {
    padding: 4,
  },
  sampleSection: {
    alignItems: 'center',
  },
  sampleTitle: {
    fontSize: 14,
    color: Theme.dark.textSecondary,
    marginBottom: 8,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.dark.accent,
    backgroundColor: 'transparent',
  },
  sampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.dark.accent,
    marginLeft: 6,
  },
});
