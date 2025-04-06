import mongoose from 'mongoose';
import { Comment } from '../models/Comment';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://datastoreReadWrite:goldfish@localhost:27017/datastore?authSource=admin&retryWrites=true&w=majority';

const addTestComment = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    // The ID of the discussion, replace with your actual discussion ID
    const discussionId = '67df9ec3d2217eb1cdc3d931';
    
    // Get the level 1 comment (first reply to the root)
    const level1Comment = await Comment.findOne({ 
      discussion: discussionId,
      parent: { $ne: null }
    });
    
    if (!level1Comment) {
      console.log('No level 1 comment found');
      return;
    }
    
    console.log('Found level 1 comment:', level1Comment._id.toString());
    
    // Create a level 2 comment (reply to the level 1 comment)
    const level2Comment = new Comment({
      content: 'This is a test level 2 comment',
      author: level1Comment.author, // Use the same author
      discussion: discussionId,
      parent: level1Comment._id
    });
    
    await level2Comment.save();
    console.log('Created level 2 comment:', level2Comment._id.toString());
    
    // Create a level 3 comment (reply to the level 2 comment)
    const level3Comment = new Comment({
      content: 'This is a test level 3 comment',
      author: level1Comment.author, // Use the same author
      discussion: discussionId,
      parent: level2Comment._id
    });
    
    await level3Comment.save();
    console.log('Created level 3 comment:', level3Comment._id.toString());
    
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addTestComment(); 