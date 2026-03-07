import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri, DiscoveryDocument } from 'expo-auth-session';
import { 
  Phone, 
  Facebook, 
  Twitter, 
  Globe, 
  Linkedin, 
  Github 
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface SocialLoginButtonsProps {
  isLoading?: boolean;
  disabled?: boolean;
}

// OAuth configuration for each provider
const OAUTH_CONFIG = {
  GOOGLE: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'com.botica.app',
      path: 'auth/google',
    }),
    discovery: {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    },
  },
  FACEBOOK: {
    clientId: 'YOUR_FACEBOOK_APP_ID',
    scopes: ['public_profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'com.botica.app',
      path: 'auth/facebook',
    }),
    discovery: {
      authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
    },
  },
  LINKEDIN: {
    clientId: 'YOUR_LINKEDIN_CLIENT_ID',
    clientSecret: 'YOUR_LINKEDIN_CLIENT_SECRET',
    scopes: ['r_liteprofile', 'r_emailaddress'],
    redirectUri: makeRedirectUri({
      scheme: 'com.botica.app',
      path: 'auth/linkedin',
    }),
    discovery: {
      authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    },
  },
  GITHUB: {
    clientId: 'Ov23lirCDhxl6nuIDiiL', // Your GitHub client ID
    clientSecret: '0a96017f6c35563f8587a7d2954b9b10b43a2bb8', // Your GitHub client secret
    scopes: ['user:email', 'read:user'],
    redirectUri: 'http://164.92.172.89/customer/social-login/github/callback', // Your backend callback URL
    discovery: {
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        revocationEndpoint: 'https://api.github.com/applications/Ov23lirCDhxl6nuIDiiL/token',
        },
    },
  TWITTER: {
    clientId: 'YOUR_TWITTER_CLIENT_ID',
    clientSecret: 'YOUR_TWITTER_CLIENT_SECRET',
    redirectUri: makeRedirectUri({
      scheme: 'com.botica.app',
      path: 'auth/twitter',
    }),
    discovery: {
      authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
      tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
    },
  },
};

export default function SocialLoginButtons({ 
  isLoading = false, 
  disabled = false 
}: SocialLoginButtonsProps) {
  const { socialLogin, socialLoginLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Google Sign-In
  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider('GOOGLE');
      
      const config = OAUTH_CONFIG.GOOGLE;
      const clientId = Platform.select({
        ios: config.iosClientId,
        android: config.androidClientId,
        default: config.clientId,
      });

      const authRequest = new AuthSession.AuthRequest({
        clientId: clientId!,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Token,
        extraParams: {
          access_type: 'offline',
          include_granted_scopes: 'true',
        },
      });

      const result = await authRequest.promptAsync(config.discovery as DiscoveryDocument);

      if (result.type === 'success') {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${result.params.access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        await socialLogin({
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Google',
          lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
          email: userInfo.email,
          signupType: 'GOOGLE',
        });
        
        router.back();
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', error.message || 'Google login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Facebook Login
  const handleFacebookLogin = async () => {
    try {
      setLoadingProvider('FACEBOOK');
      
      const config = OAUTH_CONFIG.FACEBOOK;
      
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Token,
      });

      const result = await authRequest.promptAsync(config.discovery as DiscoveryDocument);

      if (result.type === 'success') {
        // Get user info from Facebook
        const userInfoResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${result.params.access_token}`
        );
        const userInfo = await userInfoResponse.json();

        await socialLogin({
          firstName: userInfo.first_name || 'Facebook',
          lastName: userInfo.last_name || 'User',
          email: userInfo.email,
          signupType: 'FACEBOOK',
        });
        
        router.back();
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      Alert.alert('Error', error.message || 'Facebook login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // LinkedIn Login
  const handleLinkedInLogin = async () => {
    try {
      setLoadingProvider('LINKEDIN');
      
      const config = OAUTH_CONFIG.LINKEDIN;
      
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          state: Math.random().toString(36).substring(7),
        },
      });

      const result = await authRequest.promptAsync(config.discovery as DiscoveryDocument);

      if (result.type === 'success') {
        // Exchange code for token
        const tokenResponse = await fetch(config.discovery.tokenEndpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: result.params.code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            client_secret: config.clientSecret,
          }).toString(),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Get user info
        const userInfoResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        const emailInfo = await emailResponse.json();
        
        await socialLogin({
          firstName: userInfo.localizedFirstName || 'LinkedIn',
          lastName: userInfo.localizedLastName || 'User',
          email: emailInfo.elements?.[0]?.['handle~']?.emailAddress,
          signupType: 'LINKEDIN',
        });
        
        router.back();
      }
    } catch (error: any) {
      console.error('LinkedIn login error:', error);
      Alert.alert('Error', error.message || 'LinkedIn login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // GitHub Login
  const handleGitHubLogin = async () => {
    try {
      setLoadingProvider('GITHUB');
      
      const config = OAUTH_CONFIG.GITHUB;
      
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await authRequest.promptAsync(config.discovery as DiscoveryDocument);

      if (result.type === 'success') {
        // Exchange code for token
        const tokenResponse = await fetch(config.discovery.tokenEndpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code: result.params.code,
            redirect_uri: config.redirectUri,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Get user info
        const userInfoResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${tokenData.access_token}`,
          },
        });
        
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${tokenData.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((email: any) => email.primary) || emails[0];
        
        const nameParts = (userInfo.name || userInfo.login || 'GitHub User').split(' ');
        
        await socialLogin({
          firstName: nameParts[0] || 'GitHub',
          lastName: nameParts.slice(1).join(' ') || 'User',
          email: primaryEmail?.email,
          signupType: 'GITHUB',
        });
        
        router.back();
      }
    } catch (error: any) {
      console.error('GitHub login error:', error);
      Alert.alert('Error', error.message || 'GitHub login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Twitter Login
  const handleTwitterLogin = async () => {
    try {
      setLoadingProvider('TWITTER');
      
      const config = OAUTH_CONFIG.TWITTER;
      
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          code_challenge: 'challenge',
          code_challenge_method: 'plain',
          state: Math.random().toString(36).substring(7),
        },
        scopes: ['tweet.read', 'users.read', 'offline.access'],
      });

      const result = await authRequest.promptAsync(config.discovery as DiscoveryDocument);

      if (result.type === 'success') {
        // Exchange code for token
        const tokenResponse = await fetch(config.discovery.tokenEndpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: result.params.code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code_verifier: 'challenge',
          }).toString(),
        });
        
        const tokenData = await tokenResponse.json();
        
        // Get user info
        const userInfoResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        
        await socialLogin({
          firstName: userInfo.data?.name?.split(' ')[0] || 'Twitter',
          lastName: userInfo.data?.name?.split(' ').slice(1).join(' ') || 'User',
          email: userInfo.data?.email, // Email requires additional permissions
          signupType: 'TWITTER',
        });
        
        router.back();
      }
    } catch (error: any) {
      console.error('Twitter login error:', error);
      Alert.alert('Error', error.message || 'Twitter login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Apple Login (iOS only)
  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Sign-In is only available on iOS');
      return;
    }

    try {
      setLoadingProvider('APPLE');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential) {
        await socialLogin({
          firstName: credential.fullName?.givenName || 'Apple',
          lastName: credential.fullName?.familyName || 'User',
          email: credential.email,
          signupType: 'APPLE',
        });
        
        router.back();
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Apple login error:', error);
        Alert.alert('Error', error.message || 'Apple login failed');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  // Truecaller Login (Android only)
  const handleTruecallerLogin = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Error', 'Truecaller is only available on Android');
      return;
    }

    try {
      setLoadingProvider('TRUECALLER');
      
      Alert.alert(
        'Truecaller Integration',
        'Truecaller SDK requires native integration. Please implement the Truecaller Android SDK in your native code.',
        [
          {
            text: 'Continue with Demo',
            onPress: async () => {
              await socialLogin({
                firstName: 'Truecaller',
                lastName: 'User',
                phone: '+1234567890',
                signupType: 'TRUECALLER',
              });
              router.back();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      console.error('Truecaller login error:', error);
      Alert.alert('Error', error.message || 'Truecaller login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  const getHandlerForProvider = (provider: string) => {
    switch (provider) {
      case 'GOOGLE':
        return handleGoogleLogin;
      case 'FACEBOOK':
        return handleFacebookLogin;
      case 'LINKEDIN':
        return handleLinkedInLogin;
      case 'GITHUB':
        return handleGitHubLogin;
      case 'TWITTER':
        return handleTwitterLogin;
      case 'APPLE':
        return handleAppleLogin;
      case 'TRUECALLER':
        return handleTruecallerLogin;
      default:
        return () => Alert.alert('Error', 'Provider not implemented');
    }
  };

  const isButtonDisabled = isLoading || socialLoginLoading || disabled || !!loadingProvider;

  const SocialButton = ({ 
    provider, 
    icon, 
    color 
  }: { 
    provider: string; 
    icon: React.ReactNode; 
    color: string;
  }) => {
    const isLoading = loadingProvider === provider;
    
    return (
      <Pressable
        style={[
          styles.socialButton,
          { backgroundColor: color + '10' },
          isRTL && styles.socialButtonRTL,
          (isButtonDisabled || isLoading) && styles.socialButtonDisabled,
        ]}
        onPress={getHandlerForProvider(provider)}
        disabled={isButtonDisabled || isLoading}
      >
        <View style={[styles.socialIconContainer, isRTL && styles.socialIconContainerRTL]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            icon
          )}
        </View>
        <Text style={[styles.socialButtonText, isRTL && styles.socialButtonTextRTL]}>
          {provider}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.socialButtonsGrid, isRTL && styles.socialButtonsGridRTL]}>
        <SocialButton
          provider="GOOGLE"
          icon={<Globe size={24} color="#DB4437" />}
          color="#DB4437"
        />
        <SocialButton
          provider="FACEBOOK"
          icon={<Facebook size={24} color="#4267B2" />}
          color="#4267B2"
        />
        <SocialButton
          provider="TWITTER"
          icon={<Twitter size={24} color="#1DA1F2" />}
          color="#1DA1F2"
        />
        {Platform.OS === 'ios' && (
          <SocialButton
            provider="APPLE"
            icon={<Text style={{ fontSize: 24, color: '#000' }}></Text>}
            color="#000000"
          />
        )}
        <SocialButton
          provider="LINKEDIN"
          icon={<Linkedin size={24} color="#0077B5" />}
          color="#0077B5"
        />
        <SocialButton
          provider="GITHUB"
          icon={<Github size={24} color="#333" />}
          color="#333"
        />
        {Platform.OS === 'android' && (
          <SocialButton
            provider="TRUECALLER"
            icon={<Phone size={24} color="#3CAA34" />}
            color="#3CAA34"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  socialButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  socialButtonsGridRTL: {
    flexDirection: 'row-reverse',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialButtonRTL: {
    flexDirection: 'row-reverse',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialIconContainer: {
    marginRight: 8,
  },
  socialIconContainerRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  socialButtonTextRTL: {
    textAlign: 'right',
  },
});