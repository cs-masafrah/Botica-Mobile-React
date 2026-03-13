// components/CustomizableOptions.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { Check, X, Calendar, Clock, Upload, ChevronDown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  CustomizableOption, 
  SelectedCustomizableOption 
} from "@/app/types/customizable-options";

interface CustomizableOptionsProps {
  options: CustomizableOption[];
  onOptionsChange: (selectedOptions: SelectedCustomizableOption[], totalPrice: number) => void;
  basePrice: number;
}

export const CustomizableOptions: React.FC<CustomizableOptionsProps> = ({
  options,
  onOptionsChange,
  basePrice,
}) => {
  const { t, isRTL } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any>>({});
  const [showDatePicker, setShowDatePicker] = useState<Record<number, boolean>>({});
  const [showTimePicker, setShowTimePicker] = useState<Record<number, boolean>>({});
  const [fileNames, setFileNames] = useState<Record<number, string>>({});
  const [expandedSelect, setExpandedSelect] = useState<Record<number, boolean>>({});

  // Debug: Log options when component mounts
  useEffect(() => {
    console.log("🔧 [CustomizableOptions] Received options:", JSON.stringify(options, null, 2));
  }, []);

  // Calculate total additional price from selected options
  const calculateAdditionalPrice = (): number => {
    let additionalPrice = 0;
    
    Object.entries(selectedOptions).forEach(([optionId, value]) => {
      const option = options.find(opt => opt.id === Number(optionId));
      if (!option || !value) return;

      // Handle different option types
      if (option.type === 'checkbox' && Array.isArray(value)) {
        value.forEach((selectedId: number) => {
          const priceOption = option.customizableOptionPrices?.find(
            p => p.id === selectedId
          );
          if (priceOption) additionalPrice += priceOption.price;
        });
      } else if (['radio', 'select'].includes(option.type)) {
        const priceOption = option.customizableOptionPrices?.find(
          p => p.id === value
        );
        if (priceOption) additionalPrice += priceOption.price;
      } else if (option.type === 'multiselect' && Array.isArray(value)) {
        value.forEach((selectedId: number) => {
          const priceOption = option.customizableOptionPrices?.find(
            p => p.id === selectedId
          );
          if (priceOption) additionalPrice += priceOption.price;
        });
      }
    });

    return additionalPrice;
  };

  // Format selected options for cart
  const formatSelectedOptions = (): SelectedCustomizableOption[] => {
    const formatted: SelectedCustomizableOption[] = [];

    Object.entries(selectedOptions).forEach(([optionId, value]) => {
      const option = options.find(opt => opt.id === Number(optionId));
      if (!option || !value || (Array.isArray(value) && value.length === 0)) return;

      if (option.type === 'checkbox' && Array.isArray(value)) {
        value.forEach((selectedId: number) => {
          const priceOption = option.customizableOptionPrices?.find(
            p => p.id === selectedId
          );
          if (priceOption) {
            formatted.push({
              optionId: option.id,
              optionValue: selectedId.toString(),
              price: priceOption.price,
              label: `${option.label}: ${priceOption.label}`,
            });
          }
        });
      } else if (['radio', 'select'].includes(option.type)) {
        const priceOption = option.customizableOptionPrices?.find(
          p => p.id === value
        );
        formatted.push({
          optionId: option.id,
          optionValue: value.toString(),
          price: priceOption?.price || 0,
          label: `${option.label}: ${priceOption?.label || value}`,
        });
      } else if (option.type === 'multiselect' && Array.isArray(value)) {
        value.forEach((selectedId: number) => {
          const priceOption = option.customizableOptionPrices?.find(
            p => p.id === selectedId
          );
          if (priceOption) {
            formatted.push({
              optionId: option.id,
              optionValue: selectedId.toString(),
              price: priceOption.price,
              label: `${option.label}: ${priceOption.label}`,
            });
          }
        });
      } else {
        // Text, textarea, date, time, file
        let displayValue = value;
        if (value instanceof Date) {
          displayValue = value.toISOString();
        } else if (value && typeof value === 'object' && 'name' in value) {
          displayValue = value.name;
        }
        
        formatted.push({
          optionId: option.id,
          optionValue: displayValue,
          price: 0,
          label: `${option.label}: ${displayValue}`,
        });
      }
    });

    return formatted;
  };

  // Update parent component when selections change
  useEffect(() => {
    const additionalPrice = calculateAdditionalPrice();
    const formattedOptions = formatSelectedOptions();
    console.log("🔄 [CustomizableOptions] Selected options changed:", {
      selected: formattedOptions,
      additionalPrice,
      totalPrice: basePrice + additionalPrice
    });
    onOptionsChange(formattedOptions, basePrice + additionalPrice);
  }, [selectedOptions]);

  // Handle file selection
  const handleFilePick = async (option: CustomizableOption) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: option.supportedFileExtensions?.map(ext => `${ext}/*`) || ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert(t("fileTooLarge"), t("fileSizeLimit"));
          return;
        }

        setSelectedOptions(prev => ({
          ...prev,
          [option.id]: file
        }));

        setFileNames(prev => ({
          ...prev,
          [option.id]: file.name
        }));
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert(t("error"), t("filePickFailed"));
    }
  };

  // Handle date/time changes
  const handleDateChange = (option: CustomizableOption, event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, [option.id]: false }));
    setShowTimePicker(prev => ({ ...prev, [option.id]: false }));

    if (selectedDate) {
      setSelectedOptions(prev => ({
        ...prev,
        [option.id]: selectedDate
      }));
    }
  };

  // Get price option by ID
  const getPriceOptionById = (option: CustomizableOption, id: number) => {
    return option.customizableOptionPrices?.find(p => p.id === id);
  };

  // Get selected option label
  const getSelectedLabel = (option: CustomizableOption): string => {
    const value = selectedOptions[option.id];
    if (!value) return '';

    if (option.type === 'radio' || option.type === 'select') {
      const priceOption = getPriceOptionById(option, value);
      return priceOption?.label || '';
    }
    
    if (option.type === 'multiselect' && Array.isArray(value)) {
      return value.map(id => {
        const priceOption = getPriceOptionById(option, id);
        return priceOption?.label || '';
      }).join(', ');
    }

    if (option.type === 'checkbox' && Array.isArray(value)) {
      return value.map(id => {
        const priceOption = getPriceOptionById(option, id);
        return priceOption?.label || '';
      }).join(', ');
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'object' && value !== null) {
      return value.name || 'File selected';
    }

    return value.toString();
  };

  // Render option based on type
  const renderOption = (option: CustomizableOption) => {
    // Ensure we have prices array
    const prices = option.customizableOptionPrices || [];
    
    switch (option.type) {
      case 'text':
      case 'textarea':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                option.type === 'textarea' && styles.textarea,
                isRTL && styles.rtlText,
              ]}
              placeholder={t("enterValue")}
              placeholderTextColor={Colors.textSecondary}
              maxLength={option.maxCharacters || undefined}
              multiline={option.type === 'textarea'}
              numberOfLines={option.type === 'textarea' ? 4 : 1}
              onChangeText={(text) => 
                setSelectedOptions(prev => ({ ...prev, [option.id]: text }))
              }
              value={selectedOptions[option.id] || ''}
            />
            {option.maxCharacters && (
              <Text style={[styles.charCounter, isRTL && styles.rtlText]}>
                {selectedOptions[option.id]?.length || 0}/{option.maxCharacters}
              </Text>
            )}
          </View>
        );

      case 'radio':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.radioGroup}>
              {prices
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((priceOption) => {
                  const isSelected = selectedOptions[option.id] === priceOption.id;
                  return (
                    <Pressable
                      key={priceOption.id}
                      style={[
                        styles.radioOption,
                        isSelected && styles.radioSelected,
                      ]}
                      onPress={() => 
                        setSelectedOptions(prev => ({ ...prev, [option.id]: priceOption.id }))
                      }
                    >
                      <View style={styles.radioOuter}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.radioContent}>
                        <Text style={[styles.radioLabel, isRTL && styles.rtlText]}>
                          {priceOption.label}
                        </Text>
                        {priceOption.price > 0 && (
                          <Text style={styles.radioPrice}>
                            (+{formatPrice(priceOption.price)})
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        );

      case 'select':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            
            <Pressable
              style={styles.selectButton}
              onPress={() => setExpandedSelect(prev => ({ ...prev, [option.id]: !prev[option.id] }))}
            >
              <Text style={[
                styles.selectButtonText,
                !selectedOptions[option.id] && styles.selectButtonPlaceholder,
                isRTL && styles.rtlText
              ]}>
                {selectedOptions[option.id] 
                  ? getSelectedLabel(option) 
                  : t("selectOption")}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </Pressable>

            {expandedSelect[option.id] && (
              <View style={styles.selectDropdown}>
                {prices
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((priceOption) => {
                    const isSelected = selectedOptions[option.id] === priceOption.id;
                    return (
                      <Pressable
                        key={priceOption.id}
                        style={[
                          styles.selectOption,
                          isSelected && styles.selectOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedOptions(prev => ({ ...prev, [option.id]: priceOption.id }));
                          setExpandedSelect(prev => ({ ...prev, [option.id]: false }));
                        }}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          isSelected && styles.selectOptionTextSelected,
                          isRTL && styles.rtlText
                        ]}>
                          {priceOption.label}
                        </Text>
                        {priceOption.price > 0 && (
                          <Text style={styles.selectOptionPrice}>
                            +{formatPrice(priceOption.price)}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            )}
          </View>
        );

      case 'multiselect':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            
            <Pressable
              style={styles.selectButton}
              onPress={() => setExpandedSelect(prev => ({ ...prev, [option.id]: !prev[option.id] }))}
            >
              <Text style={[
                styles.selectButtonText,
                (!selectedOptions[option.id] || selectedOptions[option.id].length === 0) && styles.selectButtonPlaceholder,
                isRTL && styles.rtlText
              ]} numberOfLines={1}>
                {selectedOptions[option.id]?.length > 0 
                  ? getSelectedLabel(option) 
                  : t("selectOptions")}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </Pressable>

            {expandedSelect[option.id] && (
              <View style={styles.selectDropdown}>
                {prices
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((priceOption) => {
                    const isSelected = Array.isArray(selectedOptions[option.id]) && 
                      selectedOptions[option.id]?.includes(priceOption.id);
                    
                    return (
                      <Pressable
                        key={priceOption.id}
                        style={[
                          styles.selectOption,
                          isSelected && styles.selectOptionSelected,
                        ]}
                        onPress={() => {
                          const current = selectedOptions[option.id] || [];
                          const newValue = isSelected
                            ? current.filter((id: number) => id !== priceOption.id)
                            : [...current, priceOption.id];
                          setSelectedOptions(prev => ({ ...prev, [option.id]: newValue }));
                        }}
                      >
                        <View style={styles.multiselectCheckbox}>
                          {isSelected && <Check size={12} color={Colors.white} />}
                        </View>
                        <Text style={[
                          styles.selectOptionText,
                          isSelected && styles.selectOptionTextSelected,
                          isRTL && styles.rtlText
                        ]}>
                          {priceOption.label}
                        </Text>
                        {priceOption.price > 0 && (
                          <Text style={styles.selectOptionPrice}>
                            +{formatPrice(priceOption.price)}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
              </View>
            )}
          </View>
        );

      case 'checkbox':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.checkboxGroup}>
              {prices
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((priceOption) => {
                  const isSelected = Array.isArray(selectedOptions[option.id]) && 
                    selectedOptions[option.id]?.includes(priceOption.id);
                  
                  return (
                    <Pressable
                      key={priceOption.id}
                      style={[
                        styles.checkboxOption,
                        isSelected && styles.checkboxSelected,
                      ]}
                      onPress={() => {
                        const current = selectedOptions[option.id] || [];
                        const newValue = isSelected
                          ? current.filter((id: number) => id !== priceOption.id)
                          : [...current, priceOption.id];
                        setSelectedOptions(prev => ({ ...prev, [option.id]: newValue }));
                      }}
                    >
                      <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                        {isSelected && <Check size={12} color={Colors.white} />}
                      </View>
                      <View style={styles.checkboxContent}>
                        <Text style={[styles.checkboxLabel, isRTL && styles.rtlText]}>
                          {priceOption.label}
                        </Text>
                        {priceOption.price > 0 && (
                          <Text style={styles.checkboxPrice}>
                            (+{formatPrice(priceOption.price)})
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        );

      case 'date':
      case 'datetime':
      case 'time':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            
            <Pressable
              style={styles.datePickerButton}
              onPress={() => {
                if (option.type === 'date') {
                  setShowDatePicker(prev => ({ ...prev, [option.id]: true }));
                } else if (option.type === 'time') {
                  setShowTimePicker(prev => ({ ...prev, [option.id]: true }));
                } else {
                  setShowDatePicker(prev => ({ ...prev, [option.id]: true }));
                }
              }}
            >
              {option.type === 'date' || option.type === 'datetime' ? (
                <Calendar size={20} color={Colors.primary} />
              ) : (
                <Clock size={20} color={Colors.primary} />
              )}
              <Text style={[
                styles.datePickerText,
                !selectedOptions[option.id] && styles.datePickerPlaceholder,
                isRTL && styles.rtlText
              ]}>
                {selectedOptions[option.id]
                  ? option.type === 'date'
                    ? selectedOptions[option.id].toLocaleDateString()
                    : option.type === 'time'
                    ? selectedOptions[option.id].toLocaleTimeString()
                    : selectedOptions[option.id].toLocaleString()
                  : t("select") + ' ' + t(option.type)}
              </Text>
            </Pressable>

            {(showDatePicker[option.id] || showTimePicker[option.id]) && (
              <DateTimePicker
                value={selectedOptions[option.id] || new Date()}
                mode={
                  showDatePicker[option.id]
                    ? option.type === 'datetime' ? 'datetime' : 'date'
                    : 'time'
                }
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange(option, event, date)}
              />
            )}
          </View>
        );

      case 'file':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={[styles.optionLabel, isRTL && styles.rtlText]}>
              {option.label}
              {option.isRequired && <Text style={styles.required}> *</Text>}
            </Text>
            
            <Pressable
              style={styles.filePickerButton}
              onPress={() => handleFilePick(option)}
            >
              <Upload size={20} color={Colors.primary} />
              <Text style={[
                styles.filePickerText,
                !fileNames[option.id] && styles.filePickerPlaceholder,
                isRTL && styles.rtlText
              ]}>
                {fileNames[option.id] || t("chooseFile")}
              </Text>
            </Pressable>

            {option.supportedFileExtensions && option.supportedFileExtensions.length > 0 && (
              <Text style={[styles.fileExtensions, isRTL && styles.rtlText]}>
                {t("supportedFormats")}: {option.supportedFileExtensions.join(', ')}
              </Text>
            )}

            {selectedOptions[option.id] && (
              <Pressable
                style={styles.clearFileButton}
                onPress={() => {
                  setSelectedOptions(prev => {
                    const newState = { ...prev };
                    delete newState[option.id];
                    return newState;
                  });
                  setFileNames(prev => {
                    const newState = { ...prev };
                    delete newState[option.id];
                    return newState;
                  });
                }}
              >
                <X size={16} color={Colors.error} />
                <Text style={[styles.clearFileText, isRTL && styles.rtlText]}>
                  {t("removeFile")}
                </Text>
              </Pressable>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t("customizableOptions")}
      </Text>
      
      <View style={styles.optionsList}>
        {options
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(renderOption)}
      </View>

      <View style={styles.totalContainer}>
        <Text style={[styles.totalLabel, isRTL && styles.rtlText]}>
          {t("totalWithOptions")}:
        </Text>
        <Text style={styles.totalPrice}>
          {formatPrice(basePrice + calculateAdditionalPrice())}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  optionsList: {
    gap: 16,
  },
  optionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  required: {
    color: Colors.error,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "right",
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radioSelected: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.primary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  radioPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 8,
  },
  checkboxGroup: {
    gap: 12,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxSelected: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.primary,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  checkboxBoxSelected: {
    backgroundColor: Colors.primary,
  },
  checkboxContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  checkboxPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
  },
  selectButtonText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: Colors.textSecondary,
  },
  selectDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectOptionSelected: {
    backgroundColor: Colors.borderLight,
  },
  selectOptionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  selectOptionTextSelected: {
    fontWeight: "600",
    color: Colors.primary,
  },
  selectOptionPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 8,
  },
  multiselectCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: Colors.primary,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
    gap: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: Colors.textSecondary,
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
    gap: 12,
  },
  filePickerText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  filePickerPlaceholder: {
    color: Colors.textSecondary,
  },
  fileExtensions: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  clearFileButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  clearFileText: {
    fontSize: 12,
    color: Colors.error,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  rtlText: {
    textAlign: "right",
  },
});