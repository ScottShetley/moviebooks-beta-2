// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema (
  {
    username: {
      // <-- NEW FIELD
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      lowercase: true, // Store usernames in lowercase for case-insensitive uniqueness
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [20, 'Username cannot be more than 20 characters long'],
      // Basic validation to prevent spaces or special characters often disallowed in usernames
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
    // --- ADDED FIELD ---
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection', // Reference the Connection model
        required: true, // Ensure entries are valid ObjectIds (though array can be empty)
    }],
    // -------------------
  },
  {
    timestamps: true,
    // Ensure password is not sent back in JSON responses by default
    toJSON: {
      transform (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    // Ensure password is not sent back when converting to Object (used internally sometimes)
    toObject: {
      transform (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Middleware: Hash password before saving a new user or modified password
userSchema.pre ('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified ('password')) {
    return next ();
  }
  try {
    const salt = await bcrypt.genSalt (10);
    this.password = await bcrypt.hash (this.password, salt);
    next ();
  } catch (error) {
    next (error);
  }
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare (enteredPassword, this.password);
};

// Indexing username and email for faster lookups
userSchema.index ({username: 1});
userSchema.index ({email: 1});
// Optional: Index the favorites array if you anticipate querying users based on favorites frequently
// userSchema.index({ favorites: 1 }); // Consider adding this later if performance dictates

const User = mongoose.model ('User', userSchema);

export default User;