// auth.ts
// Authentication utilities for getting VSCode user identity

import * as vscode from "vscode";
import { AuthUser } from "./types";

/**
 * Get the authenticated user from VSCode
 * Tries GitHub, Microsoft, then Google in that order
 * Forces GitHub login if none found
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    // Helper to extract username from label (which might be email)
    const extractUsername = (label: string): string => {
      if (label.includes('@')) {
        return label.split('@')[0];
      }
      return label;
    };

    // 1. Try GitHub first (most common for developers)
    try {
      const ghSession = await vscode.authentication.getSession('github', ['read:user'], { createIfNone: false });
      if (ghSession) {
        return {
          id: ghSession.account.id,
          username: ghSession.account.label, // GitHub label is usually username
          email: ghSession.account.label, // Might not be email, but used for display
          provider: 'github'
        };
      }
    } catch (e) {
      console.log('GitHub auth not available');
    }

    // 2. Try Microsoft (built-in to VSCode)
    try {
      const msSession = await vscode.authentication.getSession('microsoft', ['User.Read'], { createIfNone: false });
      if (msSession) {
        return {
          id: msSession.account.id,
          username: extractUsername(msSession.account.label),
          email: msSession.account.label,
          provider: 'microsoft'
        };
      }
    } catch (e) {
      console.log('Microsoft auth not available');
    }

    // 3. Try Google
    try {
      const googleSession = await vscode.authentication.getSession('google', ['profile', 'email'], { createIfNone: false });
      if (googleSession) {
        return {
          id: googleSession.account.id,
          username: extractUsername(googleSession.account.label),
          email: googleSession.account.label,
          provider: 'google'
        };
      }
    } catch (e) {
      console.log('Google auth not available');
    }

    // 4. Force GitHub login if nothing found
    const session = await vscode.authentication.getSession('github', ['read:user'], { createIfNone: true });
    if (session) {
      return {
        id: session.account.id,
        username: session.account.label,
        email: session.account.label,
        provider: 'github'
      };
    }

    return null;
  } catch (e) {
    console.error('Error getting authenticated user:', e);
    vscode.window.showErrorMessage(`Failed to authenticate: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/**
 * Ensure user is authenticated, show error if not
 */
export async function ensureAuthenticated(): Promise<AuthUser | null> {
  const user = await getAuthenticatedUser();
  if (!user) {
    vscode.window.showErrorMessage('Please sign in to track your coding time. Use Command Palette: "Sign in to sync settings"');
  }
  return user;
}
