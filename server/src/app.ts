import express, { Request, Response } from "express";

// initialize environment variables
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// @ts-ignore Currently not using req
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
