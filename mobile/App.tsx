import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Views
import HomeView from './src/views/HomeView';
import YearsView from './src/views/YearsView';
import QuizView from './src/views/QuizView';
import ReviewView from './src/views/ReviewView';
import QuestionDetailView from './src/views/QuestionDetailView';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
       <Stack.Screen name="HomeMain" component={HomeView} />
       <Stack.Screen name="Years" component={YearsView} />
       <Stack.Screen name="Quiz" component={QuizView} />
       <Stack.Screen name="QuestionDetail" component={QuestionDetailView} />
    </Stack.Navigator>
  );
}

function ReviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
       <Stack.Screen name="ReviewMain" component={ReviewView} initialParams={{ type: 'wrong' }} />
       <Stack.Screen name="QuestionDetail" component={QuestionDetailView} />
    </Stack.Navigator>
  );
}

function FavoriteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
       <Stack.Screen name="FavoriteMain" component={ReviewView} initialParams={{ type: 'favorites' }} />
       <Stack.Screen name="QuestionDetail" component={QuestionDetailView} />
    </Stack.Navigator>
  );
}

function Navigation() {
  const insets = useSafeAreaInsets();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName = 'home';
            if (route.name === 'Ana Sayfa') iconName = 'home-variant';
            else if (route.name === 'HatalarSekme') iconName = 'alert-circle';
            else if (route.name === 'FavorilerSekme') iconName = 'star';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: { 
            height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0
          },
          tabBarLabelStyle: {
            fontWeight: '900',
            fontSize: 10,
            marginBottom: 4
          }
        })}
      >
        <Tab.Screen name="Ana Sayfa" component={MainStack} options={{ title: 'Sınavlar' }} />
        <Tab.Screen name="HatalarSekme" component={ReviewStack} options={{ title: 'Hatalarım' }} />
        <Tab.Screen name="FavorilerSekme" component={FavoriteStack} options={{ title: 'Favoriler' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
