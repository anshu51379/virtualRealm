function emailQuery(email) {
  // Old accounts were saved without lowercasing. Match those records without
  // a destructive migration, while keeping new addresses normalized.
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { email: { $regex: `^${escaped}$`, $options: "i" } };
}
module.exports = { emailQuery };
