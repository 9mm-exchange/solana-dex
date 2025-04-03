import express from "express";
import { Date, Types } from "mongoose";
import { io } from "../sockets";

const router = express.Router();

router.get("/", async (req: any, res: any) => {
  console.log("Get Pool Router")
    try {

    } catch (error) {
        
    }
})

export default router;