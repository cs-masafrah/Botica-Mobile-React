
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, X, GripVertical, Edit2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { useHomepageConfig, SectionType, HomepageSection, SortOrder } from '@/contexts/HomepageConfigContext';
import { useShopify, useShopifyVendors } from '@/contexts/ShopifyContext';

export default function CustomizeHomepageScreen() {
  const { sections, toggleSection, removeSection, reorderSections, addSection, updateSection, resetToDefaults, isLoading } = useHomepageConfig();
  const { categories, products } = useShopify();
  const vendors = useShopifyVendors();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [newSectionType, setNewSectionType] = useState<SectionType>('on-sale');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [limit, setLimit] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');

  const moveSection = (index: number, direction: 'up' | 'down') => {
    console.log('moveSection called', { index, direction, sectionsLength: sections.length });
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) {
      console.log('Invalid target index, aborting');
      return;
    }
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    console.log('Reordering sections:', newSections.map(s => s.title));
    reorderSections(newSections);
  };

  const handleOpenEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setNewSectionType(section.type);
    setNewSectionTitle(section.title);
    setSelectedCollection(section.config?.collectionId || '');
    setSelectedTag(section.config?.tag || '');
    setSelectedVendor(section.config?.vendorName || '');
    setLimit(section.config?.limit?.toString() || '');
    setSortOrder(section.config?.sortOrder || 'alphabetical');
    setShowAddModal(true);
  };

  const handleSaveSection = () => {
    if (!newSectionTitle.trim()) return;

    const config: HomepageSection['config'] = {};
    
    if (newSectionType === 'collection' && selectedCollection) {
      const collection = categories.find(c => c.id === selectedCollection);
      if (!collection) return;
      config.collectionId = collection.id;
      config.collectionName = collection.name;
    } else if (newSectionType === 'tag' && selectedTag) {
      config.tag = selectedTag;
    } else if (newSectionType === 'vendor' && selectedVendor) {
      config.vendorName = selectedVendor;
    }

    if (limit) {
      config.limit = parseInt(limit, 10);
    }

    config.sortOrder = sortOrder;

    if (editingSection) {
      updateSection(editingSection.id, {
        type: newSectionType,
        title: newSectionTitle,
        config,
      });
    } else {
      addSection({
        type: newSectionType,
        title: newSectionTitle,
        enabled: true,
        config,
      });
    }

    setShowAddModal(false);
    setEditingSection(null);
    setNewSectionTitle('');
    setSelectedCollection('');
    setSelectedTag('');
    setSelectedVendor('');
    setLimit('');
    setSortOrder('alphabetical');
  };

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach(p => p.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [products]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, isWeb && styles.webContentContainer]}>
        <View style={[styles.header, isWeb && styles.webHeader]}>
          <View>
            <Text style={styles.title}>Customize Homepage</Text>
            <Text style={styles.subtitle}>
              {isWeb ? 'Reorder sections, toggle visibility, or add new sections to customize your store homepage' : 'Drag sections to reorder, toggle visibility, or add new sections'}
            </Text>
          </View>
          {isWeb && (
            <View style={styles.webHeaderActions}>
              <Pressable style={styles.webResetButton} onPress={resetToDefaults}>
                <Text style={styles.webResetButtonText}>Reset to Defaults</Text>
              </Pressable>
              <Pressable style={styles.webAddButton} onPress={() => setShowAddModal(true)}>
                <Plus size={20} color={Colors.white} />
                <Text style={styles.webAddButtonText}>Add Section</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.sectionsContainer, isWeb && styles.webSectionsContainer]}>
          {sections.map((section, index) => (
            <View key={section.id} style={[styles.sectionCard, isWeb && styles.webSectionCard]}>
              <View style={[styles.sectionHeader, isWeb && styles.webSectionHeader]}>
                {isWeb && (
                  <View style={styles.dragHandle}>
                    <GripVertical size={20} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.sectionInfo}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, isWeb && styles.webSectionTitle]}>{section.title}</Text>
                    {isWeb && section.config && (
                      <Text style={styles.webConfigBadge}>
                        {section.config.collectionName || section.config.tag || section.config.vendorName || ''}
                      </Text>
                    )}
                    {isWeb && section.config?.sortOrder && (
                      <Text style={styles.webSortBadge}>
                        {section.config.sortOrder}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.sectionType}>{section.type}</Text>
                </View>
                <View style={[styles.sectionActions, isWeb && styles.webSectionActions]}>
                  {!isWeb && (
                    <>
                      <Pressable
                        style={styles.actionButton}
                        onPress={() => toggleSection(section.id)}
                      >
                        {section.enabled ? (
                          <Eye size={20} color={Colors.text} />
                        ) : (
                          <EyeOff size={20} color={Colors.textSecondary} />
                        )}
                      </Pressable>
                      {section.type !== 'banner' && section.type !== 'featured' && (
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => removeSection(section.id)}
                        >
                          <Trash2 size={20} color={Colors.error} />
                        </Pressable>
                      )}
                    </>
                  )}
                  {isWeb && (
                    <>
                      <View style={styles.webToggleContainer}>
                        <Text style={styles.webToggleLabel}>Visible</Text>
                        <Pressable
                          style={[styles.webToggle, section.enabled && styles.webToggleActive]}
                          onPress={() => toggleSection(section.id)}
                        >
                          <View style={[styles.webToggleThumb, section.enabled && styles.webToggleThumbActive]} />
                        </Pressable>
                      </View>
                      <Pressable
                        style={styles.webEditButton}
                        onPress={() => handleOpenEdit(section)}
                      >
                        <Edit2 size={18} color={Colors.primary} />
                      </Pressable>
                      <View style={styles.webReorderButtons}>
                        <Pressable
                          style={[styles.webIconButton, index === 0 && styles.webIconButtonDisabled]}
                          onPress={() => moveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp size={18} color={index === 0 ? Colors.textSecondary : Colors.text} />
                        </Pressable>
                        <Pressable
                          style={[styles.webIconButton, index === sections.length - 1 && styles.webIconButtonDisabled]}
                          onPress={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                        >
                          <ChevronDown size={18} color={index === sections.length - 1 ? Colors.textSecondary : Colors.text} />
                        </Pressable>
                      </View>
                      {section.type !== 'banner' && section.type !== 'featured' && (
                        <Pressable
                          style={styles.webDeleteButton}
                          onPress={() => removeSection(section.id)}
                        >
                          <Trash2 size={18} color={Colors.error} />
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              </View>

              {!isWeb && (
                <View style={styles.reorderButtons}>
                  <Pressable
                    style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    onPress={() => moveSection(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp size={20} color={index === 0 ? Colors.textSecondary : Colors.text} />
                    <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>
                      Move Up
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.reorderButton, index === sections.length - 1 && styles.reorderButtonDisabled]}
                    onPress={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                  >
                    <ChevronDown size={20} color={index === sections.length - 1 ? Colors.textSecondary : Colors.text} />
                    <Text style={[styles.reorderButtonText, index === sections.length - 1 && styles.reorderButtonTextDisabled]}>
                      Move Down
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>

        {!isWeb && (
          <>
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={24} color={Colors.white} />
              <Text style={styles.addButtonText}>Add New Section</Text>
            </Pressable>

            <Pressable style={styles.resetButton} onPress={resetToDefaults}>
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, isWeb && styles.webModalOverlay]}>
          <View style={[styles.modalContent, isWeb && styles.webModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSection ? 'Edit Section' : 'Add New Section'}</Text>
              <Pressable onPress={() => {
                setShowAddModal(false);
                setEditingSection(null);
                setNewSectionTitle('');
                setSelectedCollection('');
                setSelectedTag('');
                setSelectedVendor('');
                setLimit('');
                setSortOrder('alphabetical');
              }}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Section Type</Text>
              <View style={styles.typeGrid}>
                {['on-sale', 'new-arrivals', 'collection', 'tag', 'vendor', 'vendors-row', 'brands'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeButton,
                      newSectionType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewSectionType(type as SectionType)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        newSectionType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Section Title</Text>
              <TextInput
                style={styles.input}
                value={newSectionTitle}
                onChangeText={setNewSectionTitle}
                placeholder="Enter section title"
                placeholderTextColor={Colors.textSecondary}
              />

              {newSectionType === 'collection' && (
                <>
                  <Text style={styles.label}>Select Collection</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.optionChip,
                          selectedCollection === category.id && styles.optionChipActive,
                        ]}
                        onPress={() => setSelectedCollection(category.id)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selectedCollection === category.id && styles.optionChipTextActive,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {newSectionType === 'tag' && (
                <>
                  <Text style={styles.label}>Select Tag</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    {allTags.map((tag) => (
                      <Pressable
                        key={tag}
                        style={[
                          styles.optionChip,
                          selectedTag === tag && styles.optionChipActive,
                        ]}
                        onPress={() => setSelectedTag(tag)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selectedTag === tag && styles.optionChipTextActive,
                          ]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {newSectionType === 'vendor' && (
                <>
                  <Text style={styles.label}>Select Vendor</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    {vendors.map((vendor) => (
                      <Pressable
                        key={vendor.name}
                        style={[
                          styles.optionChip,
                          selectedVendor === vendor.name && styles.optionChipActive,
                        ]}
                        onPress={() => setSelectedVendor(vendor.name)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selectedVendor === vendor.name && styles.optionChipTextActive,
                          ]}
                        >
                          {vendor.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.label}>Items Limit (Optional)</Text>
              <TextInput
                style={styles.input}
                value={limit}
                onChangeText={setLimit}
                placeholder="e.g., 10"
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.label}>Sort Order</Text>
              <View style={styles.typeGrid}>
                {(['alphabetical', 'latest', 'random'] as SortOrder[]).map((order) => (
                  <Pressable
                    key={order}
                    style={[
                      styles.typeButton,
                      sortOrder === order && styles.typeButtonActive,
                    ]}
                    onPress={() => setSortOrder(order)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        sortOrder === order && styles.typeButtonTextActive,
                      ]}
                    >
                      {order}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingSection(null);
                  setNewSectionTitle('');
                  setSelectedCollection('');
                  setSelectedTag('');
                  setSelectedVendor('');
                  setLimit('');
                  setSortOrder('alphabetical');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveSection}
              >
                <Text style={styles.modalButtonSaveText}>{editingSection ? 'Save Changes' : 'Add Section'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  webContentContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    padding: 40,
  },
  header: {
    marginBottom: 24,
  },
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  webHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  webAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  webAddButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  webResetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  webResetButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  webSectionsContainer: {
    gap: 8,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  webSectionCard: {
    borderRadius: 8,
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.cardBackground,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  webSectionHeader: {
    padding: 16,
    marginBottom: 0,
    alignItems: 'center',
  },
  dragHandle: {
    padding: 8,
    marginRight: 12,
    cursor: 'grab',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  webSectionTitle: {
    fontSize: 15,
    marginBottom: 0,
  },
  webConfigBadge: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webSortBadge: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionType: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  webSectionActions: {
    gap: 16,
    alignItems: 'center',
  },
  webToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webToggleLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  webToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    padding: 2,
    justifyContent: 'center',
  },
  webToggleActive: {
    backgroundColor: Colors.primary,
  },
  webToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  webToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  webReorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  webIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webIconButtonDisabled: {
    opacity: 0.3,
  },
  webEditButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reorderButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    marginBottom: 40,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  webModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  webModalContent: {
    borderRadius: 12,
    maxWidth: 600,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionsScroll: {
    marginTop: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  optionChipTextActive: {
    color: Colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBackground,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.cardBackground,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalButtonSave: {
    backgroundColor: Colors.primary,
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
