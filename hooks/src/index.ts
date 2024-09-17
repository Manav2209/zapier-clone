import express , {Request , Response} from "express";
import { PrismaClient } from "@prisma/client";
const client  = new PrismaClient();
const app = express();
app.use(express())
 // https://hooks.zapier.com/hooks/catch/1010541/22b4846/
//password logic 

interface Params {
    userId  : number,
    zapId  : string
}


app.post("/hooks/catch/userId/zapId" , async(req: Request<Params>, res : Response) =>{
    const userId  = req.params.userId ;
    const zapId  = req.params.zapId ;
    const body = req.body;


    //store in db trigger
    await client.$transaction(async tx =>{
        const run = await tx.zapRun.create({
            data :{
                zapId :zapId,
                metadata: body
            }
        });
        await tx.zapRunOutbox.create({
            data : {
                zapRunId: run.id
            }
        })
    })
    res.json({
        message : "Webhook Recieved"
    })
    //push it into a queue (kafka/redis)
})

app.listen(3000)