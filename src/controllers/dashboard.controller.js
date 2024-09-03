import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
   
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const channelStatus = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "Totalvideos",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "Videolikes",
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "TotalComments",
              },
            },
            {
              $addFields: {
                Videolikes: {
                  $first: "$Videolikes",
                },
              },
            },
            {
              $addFields: {
                TotalComments: {
                  $size: "$TotalComments",
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "Subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "SubscribedTo",
        },
      },
      {
        $lookup: {
          from: "tweets",
          localField: "_id",
          foreignField: "owner",
          as: "tweets",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "TweetLikes",
              },
            },
            {
              $addFields: {
                TweetLikes: {
                  $first: "$TweetLikes",
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "owner",
          as: "comments",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "CommentLikes",
              },
            },
            {
              $addFields: {
                CommentLikes: {
                  $first: "$CommentLikes",
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          fullname: 1,
          avatar: 1,
          TotalComments: { $sum: "$Totalvideos.TotalComments" },
          TotalViews: { $sum: "$Totalvideos.views" },
          Totalvideos: { $size: "$Totalvideos" },
          Subscribers: { $size: "$Subscribers" },
          SubscribedTo: { $size: "$SubscribedTo" },
          TotalTweets: { $size: "$tweets" },
          TotalLikes: {
            videoLikes: { $size: "$Totalvideos.Videolikes" },
            tweetLikes: { $size: "$tweets.TweetLikes" },
            commentLikes: { $size: "$comments.CommentLikes" },
            total: { $sum: [{ $size: "$Totalvideos.Videolikes" }, { $size: "$tweets.TweetLikes" }, { $size: "$comments.CommentLikes" }] },
          },
        },
      },
    ]);
    
    if (!channelStatus) {
      throw new ApiError(500, "Some Internal error Occured");
    }
  
    res.status(200).json(new ApiResponse(200, channelStatus[0], "Channel Stats"));
  });
  
  const getChannelVideos = asyncHandler(async (req, res) => {
   
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: "$thumbnail.url",
          videoFile: "$videoFile.url",
          views: 1,
          duration: 1,
          isPublished: 1,
        },
      },
    ]);
    if (!videos) {
      throw new ApiError(500, "Some Internal error Occured");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "All videos uploaded by the channel"));
  });
  
  export { getChannelStats, getChannelVideos };