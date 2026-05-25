import Status from "../models/status.model.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { validateBase64File } from "../lib/fileValidator.js";

export const uploadStatus = async (req, res) => {
  try {
    const { content, type } = req.body;
    let imageUrl = content;

    if (type === "image") {
      const validation = validateBase64File(
        content,
        ["image/jpeg", "image/png", "image/gif", "image/webp"],
        5 * 1024 * 1024 // 5MB
      );
      if (!validation.isValid) {
        return res.status(400).json({ message: `Status upload failed: ${validation.message}` });
      }
      const uploadResponse = await cloudinary.uploader.upload(content);
      imageUrl = uploadResponse.secure_url;
    }

    const newStatus = new Status({
      userId: req.user._id,
      content: imageUrl,
      type
    });

    await newStatus.save();
    
    // Populate user info before returning
    await newStatus.populate("userId", "-password");

    res.status(201).json(newStatus);
  } catch (error) {
    console.log("Error in uploadStatus controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getStatuses = async (req, res) => {
  try {
    // In a real app we'd fetch contacts'. We'll just fetch all online users' or all users' recent statuses for simplicity.
    // Fetching all statuses from the last 24h. They are auto-deleted by TTL anyway.
    const statuses = await Status.find()
      .populate("userId", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error in getStatuses controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
