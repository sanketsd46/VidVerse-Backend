import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
   
    const { content } = req.body;
  
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    if (!content || content.trim() === "") {
      throw new ApiError(400, "tweet content is required");
    }
  
    const tweet = await Tweet.create({
      owner: req.user?._id,
      content,
    });
   
    if (!tweet) {
      throw new ApiError(500, "Something Went Wrong While creating tweet");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet added Successfully"));
  });
  
  const getUserTweets = asyncHandler(async (req, res) => {
    
    const { userId } = req.params;
  
    const { page = 1, limit = 10 } = req.query;
  
    if (!isValidObjectId(userId)) {
      throw new ApiError(404, "Invalid User Id");
    }
  
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(400, "User not found");
    }
  
    const tweetsAggregation = Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                email: 1,
                username: 1,
                fullname: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
  
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      customLabels: {
        totalDocs: "TweetCount",
        docs: "Tweets",
      },
    };
  
    const tweetResult = await Tweet.aggregatePaginate(tweetsAggregation, options);
    if (!tweetResult) {
      throw new ApiError(
        500,
        "some Internal error Occured while fetching Tweets"
      );
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, tweetResult, "Tweets Fetched Sucessfully"));
  });
  
  const updateTweet = asyncHandler(async (req, res) => {
   
    const { tweetId } = req.params;
    
    const { content } = req.body;
  
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(404, "Invalid TweetId");
    }
  
    if (content?.trim() === "") {
      throw new ApiError(400, "Tweet Content is Required");
    }
  
    const tweet = await Tweet.findById(tweetId, { owner: 1 });
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
  
    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
 
    if (tweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized To perform this action");
    }
  
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { content },
      { new: true }
    );
    if (!updateTweet) {
      throw new ApiError(500, "some internal error occured while updating Tweet");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"));
  });
  
  const deleteTweet = asyncHandler(async (req, res) => {
   
    const { tweetId } = req.params;
  
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(404, "Invalid TweetId");
    }
  
    const tweet = await Tweet.findById(tweetId, { owner: 1 });
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
  
    const user = await User.findById(req.user?._id, { _id: 1 });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    if (tweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You are not authorized To perform this action");
    }
  
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deleteTweet) {
      throw new ApiError(500, "some internal error occured while Deleting Tweet");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Tweet Deleted Successfully"));
  });
  
  export { createTweet, getUserTweets, updateTweet, deleteTweet };