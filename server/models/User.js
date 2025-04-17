// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Represents a User in the application.
 * Stores user credentials (username, email, hashed password), profile information,
 * and references to their favorited connections. Includes methods for password handling.
 */
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
      index: true, // Ensure index for unique constraint and lookups.
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      lowercase: true,
      trim: true,
      index: true, // Ensure index for unique constraint and lookups.
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevent password hash from being returned in queries by default.
                     // Must explicitly use .select('+password') if needed (e.g., during login check).
    },

    // --- Profile Fields ---
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
      // Stores the URL to the profile image (e.g., from Cloudinary).
      type: String,
      trim: true,
      default: '', // Default to empty string; frontend can show a placeholder.
    },
    // --- End Profile Fields ---

    favorites: [
      {
        // Array of ObjectIds referencing Connections the user has favorited.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection',
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields.

    // --- Schema Options for Data Transformation ---
    // Ensure password is not sent back in JSON responses by default.
    toJSON: {
      transform(doc, ret) {
        delete ret.password; // Remove password field from JSON output.
        return ret;
      },
    },
    // Ensure password is not sent back when converting to Object.
    toObject: {
      transform(doc, ret) {
        delete ret.password; // Remove password field from object output.
        return ret;
      },
    },
  }
);

// --- Middleware: Hash password before saving ---
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new).
  if (!this.isModified('password')) {
    return next();
  }
  // Hash the password using bcrypt.
  try {
    const salt = await bcrypt.genSalt(10); // Generate salt.
    this.password = await bcrypt.hash(this.password, salt); // Hash password with salt.
    next(); // Proceed with saving.
  } catch (error) {
    next(error); // Pass any error to the next middleware/error handler.
  }
});

// --- Instance Method: Compare entered password with hashed password ---
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Requires the hashed password to be available on the instance.
  // Ensure the query fetching the user includes `.select('+password')`.
  if (!this.password) {
      throw new Error('Password field not selected on user document for comparison.');
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Indexes ---
// Indexes for username and email are defined inline above.
// Optional: Index the favorites array if querying users based on favorites becomes frequent.
// userSchema.index({ favorites: 1 });

// Create the Mongoose model from the schema.
const User = mongoose.model('User', userSchema);

// Export the model for use in other parts of the application.
export default User;
