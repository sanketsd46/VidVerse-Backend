import mongoose from "mongoose"
import { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
        }
    
    const {page = 1, limit = 10} = req.params
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404 , "Video not found")
    }

    const commentAggrigate = Comment.aggregate([
        {
          $match: {
           video: new mongoose.Types.ObjectId(videoId)
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: 'owner',
            pipeline : [
              {
                $project : {
                  _id : 1,
                  username : 1,
                  avatar : 1,
                }
              }
            ]
          }
        },
        {
          $addFields: {
            owner: {
              $first : "$owner"
            }
          }
        },
        {
          $sort : {
            createdAt : 1
          }
        }
      ])

      const options ={
        page : parseInt(page),
        limit : parseInt(limit),
        customLabels : {
            totalDocs: 'totalComments',
            docs: 'comments',
        }
      }

      Comment.aggregatePaginate(commentAggrigate , options , (err , result)=>{
        if(err){
            console.error("Error in aggregatePaginate:", err);
            throw new ApiError(500, err.message || "Internal server error in video aggregatePaginate");
        }
        // return the comments in the response
        return res.status(200)
            .json(new ApiResponse(200 , result , result.totalComments === 0 ? "No Comments Found" :"Comments fetched successfully"))
      })


})

const addComment = asyncHandler(async (req, res) => {


    const {videoId} = req.params;
  
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
        }
        
    const {content} = req.body;
    if(content.trim() === ""){
        throw new ApiError(404 , "Content is required")
    }

    const video = await Video.findById(videoId , {_id : 1 , owner : 1})
    if(!video){
        throw new ApiError(404 , "Video not Found")
    }

    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404 , "user not Found")
    }

    const newComment = await Comment.create({
        content,
        video : video._id,
        owner : req.user?._id   
    })

    if(!newComment){
        throw new ApiError(500 , "Comment not added successfully")
    }

    return res.status(200)
        .json(new ApiResponse(200 , newComment , "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
 
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid video id")
    }

    const comment = await Comment.findById(commentId, {_id : 1 , owner : 1})
    if(!comment){
        throw new ApiError(404 , "Comment not found")
    }

    if(comment?.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(403 , "You are not authorized to update this comment")
    }

    const {content} = req.body;
    if(content.trim() === ""){
        throw new ApiError(404 , "Content is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId , {content} , {new : true})

    if(!updatedComment){
        throw new ApiError(500 , "Comment not updated successfully")
    }

    return res.status(200)
        .json(new ApiResponse(200 , updatedComment , "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid comment id")
    }

    const comment = await Comment.findById(commentId , {_id : 1 , owner : 1})
    if(!comment){
        throw new ApiError(404 ,"comment not found")
    }

    if(comment?.owner?._id.toString() !== req.user?._id.toString()){
        throw new ApiError(403 , "Not Authorized to perform this action")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)
    if(!deleteComment){
        throw new ApiError(500 , "Comment not deleted successfully")
    }

    return res.status(200)
        .json(new ApiResponse(200 , {} , "Comment Deleted Successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
