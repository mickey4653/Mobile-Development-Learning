import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, View, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  dueDate: string | null;
  createdAt: string;
}

type SortOption = 'dueDate' | 'createdAt' | 'alphabetical';

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const categories = ['personal', 'work', 'shopping', 'other'];

  // Load todos from AsyncStorage
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todos');
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  // Save todos to AsyncStorage
  const saveTodos = async (newTodos: Todo[]) => {
    try {
      await AsyncStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const addTodo = () => {
    if (newTodo.trim().length === 0) return;
    
    const newTodos = [
      ...todos,
      {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        category,
        dueDate: selectedDate ? selectedDate.toISOString() : null,
        createdAt: new Date().toISOString(),
      },
    ];
    
    setTodos(newTodos);
    saveTodos(newTodos);
    setNewTodo('');
    setSelectedDate(null);
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const editTodo = (id: string, newText: string) => {
    if (newText.trim().length === 0) return;
    
    const newTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, text: newText.trim() } : todo
    );
    
    setTodos(newTodos);
    saveTodos(newTodos);
    setEditingTodo(null);
    setEditText('');
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const filteredAndSortedTodos = () => {
    let filtered = todos.filter((todo) =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'dueDate':
        filtered.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case 'createdAt':
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search todos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.sortContainer}>
        <ThemedText>Sort by: </ThemedText>
        {(['dueDate', 'alphabetical', 'createdAt'] as SortOption[]).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
            onPress={() => setSortBy(option)}>
            <ThemedText>{option}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a new todo..."
          onSubmitEditing={addTodo}
        />
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}>
          <MaterialIcons name="event" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
            onPress={() => setCategory(cat)}>
            <ThemedText>{cat}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {showDatePicker && Platform.OS === 'web' ? (
        <input
          aria-label="Due date"
          title="Select due date"
          placeholder="Select due date"
          type="date"
          value={(selectedDate || new Date()).toISOString().split('T')[0]}
          onChange={(e) => {
            const date = new Date(e.target.value);
            handleDateChange(null, date);
          }}
          style={styles.dateInput}
        />
      ) : showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={filteredAndSortedTodos()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.todoItem}>
            {editingTodo === item.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  onSubmitEditing={() => editTodo(item.id, editText)}
                  autoFocus
                />
                <TouchableOpacity 
                  onPress={() => editTodo(item.id, editText)}
                  style={styles.editButton}
                >
                  <ThemedText>Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setEditingTodo(null);
                    setEditText('');
                  }}
                  style={styles.cancelButton}
                >
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => toggleTodo(item.id)}
                  style={styles.todoTextContainer}
                >
                  <ThemedText style={[
                    styles.todoText,
                    item.completed && styles.completedTodo
                  ]}>
                    {item.text}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setEditingTodo(item.id);
                    setEditText(item.text);
                  }}
                  style={styles.editButton}
                >
                  <MaterialIcons name="edit" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteTodo(item.id)}
                  style={styles.deleteButton}
                >
                    
                  <MaterialIcons name="delete" size={24} color="white" />
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortButton: {
    padding: 5,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#eee',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  dateButton: {
    padding: 8,
    justifyContent: 'center',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: 8,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  todoMetadata: {
    flexDirection: 'row',
    marginTop: 5,
  },
  categoryTag: {
    fontSize: 12,
    backgroundColor: '#eee',
    padding: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
  dateInput: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 8,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  cancelButton: {
    padding: 8,
  },
});
