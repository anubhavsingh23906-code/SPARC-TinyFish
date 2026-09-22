import mongoose from "mongoose";
declare global { var mongooseConnection: Promise<typeof mongoose> | undefined; }
export async function connectDb() { const uri=process.env.MONGODB_URI; if(!uri) throw new Error("MONGODB_URI is required. Copy .env.example to .env.local."); if (!global.mongooseConnection) global.mongooseConnection = mongoose.connect(uri); return global.mongooseConnection; }

