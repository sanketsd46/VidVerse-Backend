import mongoose,{Schema} from "mongoose";

const usersSchema = new Schema({
    email:{
        type:String
    },
    fullname:{
        type:String
    },
    password:{
        type:String
    }
})

export const DiffUsers = mongoose.model("DiffUsers",usersSchema) 