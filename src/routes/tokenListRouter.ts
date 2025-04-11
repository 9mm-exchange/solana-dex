import express from "express";
import { Date, Types } from "mongoose";
import { io } from "../sockets";

const router = express.Router();

router.get("/", async (req: any, res: any) => {
    try {
        console.log("tokenListRouter");
    } catch (error) {
        console.log("tokenListRouter error", error);
    }
})

export default router;