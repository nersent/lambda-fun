const HASH_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const makeId = (length = 12) => {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += HASH_CHARACTERS.charAt(
      Math.floor(Math.random() * HASH_CHARACTERS.length),
    );
  }

  return result;
};
