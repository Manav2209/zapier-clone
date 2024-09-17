import { Router } from "express";
import {authMiddleware} from "../middleware"
import { SignInSchema, SignupSchema } from "../types";
import { prismaClient } from "../db";
import bcrypt from "bcrypt"
import { JWT_PASSWORD } from "../config";
import jwt from "jsonwebtoken"
import { Request } from 'express';


const router = Router();

interface CustomRequest extends Request {
    id: number;  // Add custom 'id' field as a number
  }

router.post("/signup"  , async(req , res) =>{
    
    const body = req.body;
    console.log(req.body);
    const parsedData = SignupSchema.safeParse(body);

    if(!parsedData.success){
        return res.status(411).json({
            message :" Incorrect inputs"
        })
    }

    const userExists = await prismaClient.user.findFirst({
        where:{
        email:parsedData.data.username
    }
    })
    if (userExists) {
        return res.status(403).json({
            message: "User already exists"
        })
    }
    try{
        const hashedPassword = await bcrypt.hash(parsedData.data.password , 10)
        console.log(hashedPassword)
    await prismaClient.user.create({
        data:{
            email :parsedData.data.username,
            password: hashedPassword,
            name : parsedData.data.name

        }  
    })
    // send mail()
    return res.json({
        message: "Please verify your account by checking your email"
    });
    }catch(error){
        console.error(error);
        res.status(404).json({
            message:"user has not been created"
        })
    }
})
router.post("/signin"  , async (req , res) =>{
    const body = req.body;
    const parsedData = SignInSchema.safeParse(body);

    if(!parsedData.success){
        return res.status(411).json({
            message :"Incorrect inputs"
        })
    }
  
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
        }
    })
    if(!user){
        res.status(403).json({
            "message":"User not found Or email id is not correct"
        })
    }

    const check = await bcrypt.compare(parsedData.data.password , user.password);

    if(!check){
        res.status(403).json({
            "message":"Password is incorrect"
        })
    }
    

    // sign the jwt
    const token = jwt.sign({
        id: user.id
    }, JWT_PASSWORD);

    res.json({
        token: token,
    });
}) 
router.get("/", authMiddleware, async (req: CustomRequest, res) => {
    
    
    const id = req.id;
    const user = await prismaClient.user.findFirst({
        where: {
            id
        },
        select: {
            name: true,
            email: true
        }
    });

    return res.json({
        user
    });
})

export const userRouter = router;
