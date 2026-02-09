Since you already have users in your Firebase project from your Next.js app, the good news is that you don't need to migrate anything. You just need to connect your Expo app to that same project.

However, "Google Auth" works differently on the web than it does on native Android. Since you want your Expo app to work on both, you'll need a "hybrid" approach.

### 1. Register Your Expo Web App in Firebase

Even though you have a "Web" app for Next.js, Firebase treats different domains/apps as separate entities for the purpose of OAuth.

1. Go to the .
2. Click **Add app** and select the **Web** icon ().
3. Name it (e.g., "Expo Web") and register it.
4. **Crucial Step:** Copy the `firebaseConfig` object. It might look identical to your Next.js one, but it's good to keep a separate copy.
5. Go to **Authentication > Settings > Authorized Domains**.
6. Add the domain where your Expo web app is currently hosted.

### 2. Prepare for Android (The "Web Client ID")

Since you haven't touched the Google Cloud Console yet, Firebase created a "Web Client ID" for you automatically when you enabled Google Auth in Next.js. You need this ID for the Expo app to talk to Google on Android.

1. In Firebase Console, go to **Authentication > Sign-in method**.
2. Click the **Google** provider to edit it.
3. Expand the **Web SDK configuration** section.
4. Copy the **Web client ID**. You will need this in your Expo code.

---

### 3. Install Required Libraries

In your Expo project folder, run:

```bash
npx expo install firebase
npx expo install @react-native-google-signin/google-signin

```

*Note: We use the `google-signin` library because standard web pop-ups (`signInWithPopup`) often fail or provide a poor experience on native mobile devices.*

---

### 4. Implementation Logic

Since your app is "Expo Web" now but will be "Android" later, you should use the **Firebase JS SDK** for Email/Password and the **Native Google Sign-In** library for Google.

#### **A. Configuration (`firebaseConfig.js`)**

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... rest of your config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

```

#### **B. Google Sign-In (Universal Code)**

This logic handles the "Native" flow for Android and can be adapted for Web.

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID_FROM_STEP_2', // This works for both Web and Android
});

async function onGoogleButtonPress() {
  try {
    // 1. Get the ID Token from Google
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();

    // 2. Create a Firebase credential from the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // 3. Sign in to Firebase with the credential
    return signInWithCredential(auth, googleCredential);
  } catch (error) {
    console.error(error);
  }
}

```

---

### 5. Transitioning to Android (Future Steps)

When you are ready to build the `.apk` or `.aab` for Android:

1. **Register Android App:** In Firebase Console, click **Add App > Android**. Use the "Package Name" found in your `app.json` (e.g., `com.yourname.app`).
2. **SHA-1 Fingerprint:** This is the "security handshake." You must get the SHA-1 key from Expo (using `npx eas credentials`) and paste it into the Firebase Android App settings.
3. **Download `google-services.json`:** Place this in your project root and reference it in your `app.json`.

> **Helpful Tip:** On the **Web** version of your Expo app, you can still use `signInWithPopup(auth, provider)` like you did in Next.js. However, once you move to Android, `signInWithPopup` will not work. It is better to stick with the `signInWithCredential` method shown above for a consistent experience across both.

**Would you like me to show you how to set up the protected routes in Expo Router so users are redirected if they aren't logged in?**

---

To implement protected routes in Expo, you’ll use Route Groups and a React Context. This allows you to automatically redirect users to the login screen if they aren't authenticated, or to the home screen if they are.
1. The Directory Structure
Expo Router uses folders to group logic. We will create an (auth) group for public screens and an (app) group for protected screens.
Plaintext
app/
├── (auth)/           <-- Public: Login, Sign Up
│   ├── login.tsx
│   └── _layout.tsx
├── (app)/            <-- Protected: Your actual app
│   ├── index.tsx     (Home)
│   └── _layout.tsx
├── _layout.tsx       <-- Root Layout (Context Provider)
└── context/
    └── auth.js       <-- Firebase Auth Logic

2. Create the Auth Context (app/context/auth.js)
This file listens to Firebase's auth state and provides it to the rest of the app.
JavaScript
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Your config from previous step

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

3. Setup the Root Layout (app/_layout.tsx)
This is where you wrap your entire app in the AuthProvider.
JavaScript
import { Slot } from 'expo-router';
import { AuthProvider } from './context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}

4. Protect the App Group (app/(app)/_layout.tsx)
This layout sits inside your protected folder. If there is no user, it forces a redirect to the login page.
JavaScript
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../context/auth';
import { Text } from 'react-native';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <Text>Loading...</Text>;

  // If NOT logged in, kick them out to login page
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If logged in, show the app screens
  return <Stack />;
}

5. Handle the Auth Group (app/(auth)/_layout.tsx)
Conversely, if a user is already logged in, you don't want them seeing the login screen.
JavaScript
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../context/auth';

export default function AuthLayout() {
  const { user } = useAuth();

  // If already logged in, send them to home
  if (user) {
    return <Redirect href="/" />;
  }

  return <Stack />;
}

Summary of the Flow
Key Differences to Remember:
Web vs Native Redirects: On Web, Redirect works like a standard link. On Android, it manages the "Stack," meaning the user can't just press the "Back" button to get into the protected app if they aren't logged in.
Persistence: Since you are using Firebase with Expo, the user will stay logged in even if they close the app, thanks to the internal persistence handled by the Firebase JS SDK (on Web) and the logic we set up earlier (for Android).

---


---

This login screen is designed to be "Universal." It uses standard **React Native** components so it looks consistent on both web and Android.

I've combined the Firebase email/password logic with the Google Sign-In logic we discussed earlier.

### The Universal Login Screen (`app/(auth)/login.tsx`)

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Email/Password Login ---
  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Google Login ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error: any) {
      // In a real app, you'd handle the 'user cancelled' error silently
      Alert.alert("Google Sign-In Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, styles.loginButton]} 
        onPress={handleEmailLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  loginButton: { backgroundColor: '#007AFF' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 10, color: '#888' },
  googleButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  googleButtonText: { color: '#000', fontWeight: '600', fontSize: 16 },
});

```

---

### Important Implementation Notes

1. **Platform Detection:** On **Expo Web**, the `@react-native-google-signin/google-signin` library may require extra configuration. If you find it's buggy on web during development, you can use a simple "Platform" check:
```javascript
import { Platform } from 'react-native';
// If Platform.OS === 'web', use Firebase's signInWithPopup
// If Platform.OS === 'android', use GoogleSignin.signIn()

```


2. **The "Success" Flow:** Notice there is no `router.replace('/home')` inside the login functions. This is intentional! Because we set up the **Auth Context** in the previous step, Firebase will trigger a state change, and your `(app)/_layout.tsx` will automatically redirect the user to the home screen.
3. **Error Handling:** I used `Alert.alert`. On web, this translates to a standard browser `alert()`. On Android, it shows a native system dialog.
