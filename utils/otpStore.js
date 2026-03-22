const store = new Map();

export const saveOtp = (email, otp) => {
  store.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
};

export const verifyOtp = (email, otp) => {
  const record = store.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return false;
  }
  if (record.otp !== otp) return false;
  store.delete(email);
  return true;
};