// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [20, 'Username cannot be more than 20 characters long'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },

    // --- NEW PROFILE FIELDS (Phase 1) ---
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name cannot be more than 50 characters long'],
      default: '', // Default to empty string
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [250, 'Bio cannot be more than 250 characters long'],
      default: '', // Default to empty string
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot be more than 100 characters long'],
      default: '', // Default to empty string
    },
    profilePictureUrl: {
      // We'll store the URL to the image (e.g., from a cloud storage service later)
      type: String,
      trim: true,
      default: '', // Default to empty string, frontend can show a placeholder
    },
    // -------------------------------------

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection', // Reference the Connection model
        // Removed 'required: true' here as an empty favorites array is valid
        // required: true, // Ensure entries are valid ObjectIds (though array can be empty) -- This was likely incorrect for an array field itself
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    // Ensure password is not sent back in JSON responses by default
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        // Optionally, ensure new fields are always present even if empty? No, default handles this.
        return ret;
      },
    },
    // Ensure password is not sent back when converting to Object (used internally sometimes)
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Middleware: Hash password before saving a new user or modified password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexing username and email for faster lookups
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
// Optional: Index the favorites array if you anticipate querying users based on favorites frequently
// userSchema.index({ favorites: 1 }); // Consider adding this later if performance dictates

const User = mongoose.model('User', userSchema);

export default User;