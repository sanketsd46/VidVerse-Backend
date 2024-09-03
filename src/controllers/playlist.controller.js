import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
   
    if (
      !(name && description) ||
      name.trim() === "" ||
      description.trim() === ""
    ) {
      throw new ApiError(400, "Playlist name and decription is required");
    }
  
    const user = User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const createdPlaylist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });
    
    if (!createdPlaylist) {
      throw new ApiError(500, "Playlist could not be created");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, createdPlaylist, "Playlist created successfully")
      );
  });
  
  const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
   
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }
  
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "VideoOwner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: 1,
                      fullname: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                VideoOwner: {
                  $first: "$VideoOwner",
                },
              },
            },
            {
              $project: {
                thumbnail: "$thumbnail.url",
                title: 1,
                videoFile: "$videoFile.url",
                duration: 1,
                views: 1,
                description: 1,
                videoOwner: "$VideoOwner",
              },
            },
          ],
        },
      },
      {
        $addFields: {
          video: "$video",
        },
      },
      {
        $addFields: {
          totalVideos: {
            $size: "$video",
          },
        },
      },
    ]);
  
    if (!playlists) {
      throw new ApiError(404, "Error Fetching User Playlists");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlists,
          playlists.length === 0
            ? "No Playlist Found"
            : "User playlists retrieved successfully"
        )
      );
  });
  
  const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
 
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist id");
    }
 
    const validPlaylist = await Playlist.findById(playlistId);
    if (!validPlaylist) {
      throw new ApiError(404, "playlist not found");
    }
  
    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "VideoOwner",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      avatar: 1,
                      fullname: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                VideoOwner: {
                  $first: "$VideoOwner",
                },
              },
            },
            {
              $project: {
                thumbnail: "$thumbnail.url",
                title: 1,
                videoFile: "$videoFile.url",
                duration: 1,
                views: 1,
                description: 1,
                videoOwner: "$VideoOwner",
              },
            },
          ],
        },
      },
      {
        $addFields: {
          video: "$video",
        },
      },
      {
        $addFields: {
          totalVideos: {
            $size: "$video",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "PlaylistOwner",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                fullname: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          PlaylistOwner: {
            $first: "$PlaylistOwner",
          },
        },
      },
      {
       
        $unset: "owner",
      },
    ]);
    
    if (!playlist) {
      throw new ApiError(404, "Error Fetching User Playlists");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          playlist[0],
          "User playlists retrieved successfully"
        )
      );
  });
  
  const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const { playlistId, videoId } = req.params;
  
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid playlist id or video id");
    }
  
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
  
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
  
    if (user._id.toString() !== playlist.owner.toString()) {
      throw new ApiError(403, "Unauthorized access");
    }
  
    if (playlist.videos.includes(videoId)) {
      throw new ApiError(400, "Video already in playlist");
    }
  
    const videoAdd = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, videoAdd, "Video added to playlist successfully")
      );
  });
  
  const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
   
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid playlist id or video id");
    }
  
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
  
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
  
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    if (playlist?.owner.toString() !== user._id.toString()) {
      throw new ApiError(
        403,
        "Unauthorized access, you are not allowed to perform this action"
      );
    }
  
    if (!playlist.videos.includes(videoId)) {
      throw new ApiError(400, "Video not in playlist");
    }
  
    const videoRemove = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );
    if (!videoRemove) {
      throw new ApiError(500, "Error removing video from playlist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, [], "video Removed from playlist successfully"));
  });
  
  const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
  
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist id");
    }
  
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
  
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    if (playlist?.owner.toString() !== user?._id.toString()) {
      throw new ApiError(
        403,
        "Unauthorized access, you are not allowed to perform this action"
      );
    }
  
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
      throw new ApiError(500, "Error deleting playlist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Playlist deleted successfully"));
  });
  
  const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
  
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist id");
    }
  
    if (
      !(name || description) ||
      name?.trim() === "" ||
      description?.trim() === ""
    ) {
      throw new ApiError(400, "Playlist name or description is required");
    }
  
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "playlist not found");
    }
  
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    if (playlist?.owner.toString() !== user?._id.toString()) {
      throw new ApiError(
        403,
        "Unauthorized access, you are not allowed to perform this action"
      );
    }
  
    const updatePlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name,
        description,
      },
      { new: true }
    );
    if (!updatePlaylist) {
      throw new ApiError(500, "Error updating playlist");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatePlaylist, "Playlist updated successfully")
      );
  });
  
  export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
  };