import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const {name,email,password,phone} = body

        if(!name || !email || !password){
            return NextResponse.json({
                success: false,
                message: "Name, Email and Password are required"},
                {status:400}
            )
        }

        const verifycode = Math.floor(100000+Math.random()*900000).toString()

        const verifycodeExpiry = new Date(Date.now() + 30*60*1000)

        const {data,error} = await supabase.auth.signUp({
            email,
            password
        })

        if(error){
            return NextResponse.json({
                success: false,
                error: error.message || "Supabase auth error"
            },{status:400})
        }

        const user = data.user

        if(user){
            await supabase.from("signup").insert({
                id: user.id,
                name,
                email,
                phone: phone || null,
                verifycode: verifycode,
                verifycodeExpiry: verifycodeExpiry,
            })
        }

        return NextResponse.json({
            success: true,
            message: "Verification code sent"
        },{status:200})

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Signup failed"
        }, { status: 400 })
    }
}