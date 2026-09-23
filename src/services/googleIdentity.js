export function getGoogleProfile(idToken) {
  const payloadPart = idToken?.split(".")[1];
  if (!payloadPart) throw new Error("Google did not return a valid account profile.");

  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes));
  const fullName = String(claims.name || "").trim().split(/\s+/);

  return {
    email: claims.email || "",
    firstName: claims.given_name || fullName.shift() || "",
    lastName: claims.family_name || fullName.join(" "),
  };
}
