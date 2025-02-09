import React, { useEffect, useState, createContext, useContext } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button, Box, Typography } from "@mui/material";
import { app, db } from "@/services/firebase";
import { AppUser } from "@/services/interfaces";

export interface AuthContextProps {
    user: User | null;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const AuthWrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // Monitor authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Update last login time
                await setDoc(doc(db, "users", user.uid), {
                    lastLogin: new Date().toISOString(),
                    displayName: user.displayName,
                } as AppUser, { merge: true });
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [auth]);

    // Handle login with Google
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error logging in with Google:", error);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // If user is authenticated, provide context and show children components
    if (user) {
        return (
            <AuthContext.Provider value={{ user, logout: handleLogout }}>
                <Box>
                    {/*<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
                        <Typography variant="h6">Welcome, {user.displayName}</Typography>
                        <Button variant="contained" color="secondary" onClick={handleLogout}>Logout</Button>
                    </Box>*/}
                    {children}
                </Box>
            </AuthContext.Provider>
        );
    }

    // If user is not authenticated, show login option
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <Typography variant="h4" gutterBottom>Welcome to Dungeon Master Deck Builder</Typography>
            <Button variant="contained" color="primary" onClick={handleLogin}>Login with Google</Button>
        </Box>
    );
};

export default AuthWrapper;
