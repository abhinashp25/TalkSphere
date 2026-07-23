import Call from "../models/Call.js";

const METERED_API_KEY = "MvuvyIskyECloIuYKpPiik55mUZWbIVtnkTKWRiQxLS4TerM";
const METERED_DOMAIN  = "talksphere.metered.live";

/**
 * Fetch fresh time-limited TURN credentials from Metered.ca.
 * The API key stays on the server — never exposed to the browser.
 */
export const getIceServers = async (_req, res) => {
  try {
    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    const resp = await fetch(url);
    const iceServers = await resp.json();
    res.json(iceServers);
  } catch (error) {
    console.error("Failed to fetch Metered ICE servers:", error.message);
    // Fallback: Google STUN only
    res.json([
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]);
  }
};

export const saveCallLog = async (req, res) => {
  try {
    const { callerId, receiverId, type, isVideo, duration, timestamp } = req.body;

    const newCall = new Call({
      callerId,
      receiverId,
      type,
      isVideo,
      duration,
      timestamp: timestamp || Date.now(),
    });

    await newCall.save();
    res.status(201).json(newCall);
  } catch (error) {
    console.error("Error saving call log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all calls involving me, where I have not deleted it
    const calls = await Call.find({
      $or: [{ callerId: myId }, { receiverId: myId }],
      deletedFor: { $ne: myId },
    })
      .sort({ createdAt: -1 })
      .populate("callerId", "fullName profilePic bio")
      .populate("receiverId", "fullName profilePic bio");

    // Format the response to return a unified participant info
    const formattedCalls = calls.map((call) => {
      const isCaller = call.callerId._id.toString() === myId.toString();
      const peer = isCaller ? call.receiverId : call.callerId;
      return {
        _id: call._id,
        userId: peer._id,
        fullName: peer.fullName,
        profilePic: peer.profilePic,
        bio: peer.bio,
        type: isCaller ? (call.type === "missed" ? "missed" : "outgoing") : (call.type === "missed" ? "missed" : "incoming"),
        isVideo: call.isVideo,
        duration: call.duration,
        timestamp: call.timestamp,
      };
    });

    res.status(200).json(formattedCalls);
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCallLog = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ message: "Call log not found" });
    }

    // Add myId to deletedFor array
    if (!call.deletedFor.includes(myId)) {
      call.deletedFor.push(myId);
      await call.save();
    }

    // If both caller and receiver deleted it, delete the document permanently
    if (call.deletedFor.length >= 2) {
      await Call.findByIdAndDelete(id);
    }

    res.status(200).json({ message: "Call log deleted successfully" });
  } catch (error) {
    console.error("Error deleting call log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearCallHistory = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all calls involving me and update deletedFor
    const calls = await Call.find({
      $or: [{ callerId: myId }, { receiverId: myId }],
      deletedFor: { $ne: myId },
    });

    for (const call of calls) {
      call.deletedFor.push(myId);
      await call.save();
      
      if (call.deletedFor.length >= 2) {
        await Call.findByIdAndDelete(call._id);
      }
    }

    res.status(200).json({ message: "Call history cleared successfully" });
  } catch (error) {
    console.error("Error clearing call history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
