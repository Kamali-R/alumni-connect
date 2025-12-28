 import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  console.error("❌ Google OAuth environment variables are missing");
  console.log("Required variables:");
  console.log("- GOOGLE_CLIENT_ID:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("- GOOGLE_CLIENT_SECRET:", !!process.env.GOOGLE_CLIENT_SECRET);
  console.log("- GOOGLE_CALLBACK_URL:", !!process.env.GOOGLE_CALLBACK_URL);
  process.exit(1);
}

console.log("✅ Google OAuth Config loaded:");
console.log("- Client ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...");
console.log("- Callback URL:", process.env.GOOGLE_CALLBACK_URL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Processing Google profile for:', profile.emails[0].value);
        
        const email = profile.emails[0].value;
        const name = profile.displayName;
        
        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email: email },
            { googleId: profile.id }
          ]
        });
        
        if (!user) {
          // Do NOT auto-create users. Signal signup requirement.
          console.log('⚠️ No existing user for Google account. Redirecting to signup:', email);
          return done(null, false, { needsSignup: true, email, name, googleId: profile.id });
        } else {
          // Update existing user
          console.log('🔄 Updating existing user for Google login:', email);
          
          // Ensure Google ID is set
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          
          // Update last login
          user.lastLogin = new Date();
          
          // Ensure user is verified
          if (!user.isVerified) {
            user.isVerified = true;
          }
          
          // Update auth provider if needed
          if (!user.authProvider) {
            user.authProvider = 'google';
          }
          
          await user.save();
          console.log('✅ Existing Google user updated successfully');
        }
        
        console.log('🎯 Google auth successful for user:', {
          id: user._id,
          email: user.email,
          role: user.role,
          profileCompleted: user.profileCompleted
        });
        
        return done(null, user);
        
      } catch (error) {
        console.error('❌ Google OAuth strategy error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log('🔐 Serializing user:', user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🔓 Deserializing user:', id);
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('❌ Deserialize error:', err);
    done(err, null);
  }
});

export default passport; 