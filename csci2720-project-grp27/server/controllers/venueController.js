// this file will contain the logic for what the API should do when venue's route is accessed

export const getVenues = async (req, res) => {
  try {
    res.json({ message: "Venue API works" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};