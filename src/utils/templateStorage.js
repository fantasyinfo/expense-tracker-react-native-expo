import AsyncStorage from '@react-native-async-storage/async-storage';

const TEMPLATE_STORAGE_KEY = '@expense_tracker_templates';

/**
 * Load all templates from AsyncStorage
 */
export const loadTemplates = async () => {
  try {
    const data = await AsyncStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

/**
 * Save all templates to AsyncStorage
 */
export const saveTemplates = async (templates) => {
  try {
    await AsyncStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
};

/**
 * Add a new template
 */
export const addTemplate = async (template) => {
  const templates = await loadTemplates();
  const newTemplate = {
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  await saveTemplates(templates);
  return newTemplate;
};

/**
 * Delete a template by id
 */
export const deleteTemplate = async (id) => {
  const templates = await loadTemplates();
  const filtered = templates.filter(template => template.id !== id);
  await saveTemplates(filtered);
};

/**
 * Update a template by id
 */
export const updateTemplate = async (id, updatedTemplate) => {
  const templates = await loadTemplates();
  const index = templates.findIndex(template => template.id === id);
  if (index !== -1) {
    templates[index] = {
      ...templates[index],
      ...updatedTemplate,
      id, // Preserve the original id
    };
    await saveTemplates(templates);
    return templates[index];
  }
  return null;
};

