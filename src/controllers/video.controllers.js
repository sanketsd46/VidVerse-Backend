import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 5, query = "", sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    // match the qury condition for both title and description
    const matchCondition = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }

    if (userId) {
        matchCondition.owner = new mongoose.Types.ObjectId(userId),
            matchCondition.isPublished = true
    }

    // video.aggregate pipeline for matchingCondition and looking up in users collection
    let videoAggregate;
    try {
        // dont use await b/c : - Using await with Video.aggregate([...]) would execute the aggregation pipeline immediately, preventing aggregatePaginate from modifying the pipeline for pagination. By not using await, you pass the unexecuted aggregation object to aggregatePaginate, allowing it to append additional stages and handle pagination correctly.
        videoAggregate = Video.aggregate([
            {
                $match: matchCondition
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
                                _id: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner" // yamule jo array ahe tyatle pahile element jo kamacha ahe toch aapn pick kela 
                    }
                }
            },
            {
                $sort: {
                    [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1
                }
            }
        ])
    }
    catch (err) {
        console.error("Error in aggregation:", err);
        throw new ApiError(500, err.message || "Internal server error in video aggregate");

    }

    // options for aggregatePaginate
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos"
        }
    }

    // video.aggregatePaginate for pagination
    Video.aggregatePaginate(videoAggregate, options)
        .then((result) => {
            try {
                res.status(200)
                    .json(new ApiResponse(200, result, result.totalVideos === 0 ? "No video found" : "videos fetched successfully"))
            } catch (error) {
                console.error("Error in aggregatePaginate:", error);
                throw new ApiError(500, error.message || "Internal server error in video aggregatePaginate");

            }
        })


});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const ownerId = req.user?._id;
    if (!ownerId) {
        throw new ApiError(401, "Invalid User");
    }
    if ([title, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
        throw new ApiError(
            500,
            "Failed to upload video and thumbnail to cloudinary"
        );
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        owner: req.user?._id,
        duration: videoFile?.duration,
    });
    if (!newVideo) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newVideo, "Video Published Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;





    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid VideoId");
    }

    const videoFind = await Video.findById(videoId);

    if (!videoFind) {
        throw new ApiError(404, "Video not found");
    }

    const userFind = await User.findById(req.user?._id, { watchhistory: 1 });


    if (!userFind) {
        throw new ApiError(404, "User not found");
    }

    if (userFind?.watchHistory && !userFind.watchHistory.includes(videoId)) {
        await Video.findByIdAndUpdate(
            videoId,
            {
                $inc: {
                    views: 1,
                },
            },
            { new: true }
        );
    }

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId,
        },
    });

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
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
                            username: 1,
                            avatar: 1,
                            email: 1,
                            fullName: 1,
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
                videoFile: "$videoFile.url",
                thumbnail: "$thumbnail.url",
            },
        },
    ]);

    if (!video) {
        throw new ApiError(400, "video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video details fetched Succesfully"));
})

export { getAllVideos, publishAVideo, getVideoById }

