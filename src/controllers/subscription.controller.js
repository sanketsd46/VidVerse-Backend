import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid ChannelId");
  
    let isSubscribed;
  
    const findRes = await Subscription.findOne({
      subscriber: req.user?._id,
      channel: channelId,
    });
  
    if (findRes) {
      const res = await Subscription.deleteOne({
        subscriber: req.user?._id,
        channel: channelId,
      });
      isSubscribed = false;
    } else {
      const newSub = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      if (!newSub) throw new ApiError(500, "Failed to toggle Subscription");
      isSubscribed = true;
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed },
          `${isSubscribed ? "Subscribed successfully" : "Un-Subscribed successfully"}`
        )
      );
  });



  export {toggleSubscription,}