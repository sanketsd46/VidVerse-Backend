
import { resend } from "./resend.js";

export const sendVerificationEmail = async ({email, verifyCode}) => {

        const { data, error } = await resend.emails.send({
            from: "Vidverse <onboarding@resend.dev>",
            to:email,
            subject: "Vidverse Verification Code",
            html: ` <p> your otp is ${verifyCode} !</p>`
        })

        if (error) {
            
            return error

        }else{
            return data
        }
}