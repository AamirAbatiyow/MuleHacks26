import mongoose from "mongoose";

export const CHECK_IN_STATIONS = [
  "arrival",
  "dinner",
  "midnight_snack",
  "breakfast",
  "lunch",
  "workshop",
  "reentry",
];

const checkInEventSchema = new mongoose.Schema(
  {
    participantEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    participantName: { type: String, trim: true, default: "" },
    station: {
      type: String,
      required: true,
      enum: CHECK_IN_STATIONS,
    },
    organizerName: { type: String, required: true, trim: true },
    scannedByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

checkInEventSchema.index({ createdAt: -1 });
checkInEventSchema.index({ participantEmail: 1, station: 1, createdAt: -1 });

export function toStoredCheckIn(doc) {
  if (!doc) return null;
  const event = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(event._id),
    participantEmail: event.participantEmail,
    participantName: event.participantName || "",
    station: event.station,
    organizerName: event.organizerName,
    scannedByEmail: event.scannedByEmail,
    createdAt: new Date(event.createdAt).toISOString(),
  };
}

export const CheckInEvent =
  mongoose.models.CheckInEvent || mongoose.model("CheckInEvent", checkInEventSchema);
