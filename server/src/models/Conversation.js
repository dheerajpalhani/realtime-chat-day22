import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      required: true,
      validate: [
        {
          validator: (arr) => arr.length === 2,
          message: 'Conversation must have exactly 2 participants',
        },
      ],
    },
    // Unique hash of sorted participant IDs to prevent duplicate conversations
    participantsHash: {
      type: String,
      unique: true,
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageText: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index participants array to optimize queries (getting all conversations for a user)
conversationSchema.index({ participants: 1 });

// Pre-validate hook to automatically populate and sort participantsHash
conversationSchema.pre('validate', function (next) {
  if (this.participants && this.participants.length === 2) {
    // Ensure the IDs are represented as strings, sorted, and joined
    const sortedIds = this.participants.map((id) => id.toString()).sort();
    this.participantsHash = sortedIds.join('_');
    
    // Also save participants in sorted order for consistency
    this.participants = sortedIds;
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
