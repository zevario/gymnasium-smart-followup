export const defaultProfilePhoto = "/images/avatar-default.svg";
export const profileAvatars = [defaultProfilePhoto, "/images/avatar-teal.svg", "/images/avatar-blue.svg", "/images/avatar-purple.svg", "/images/avatar-long.svg", "/images/avatar-bob.svg"];
export function isProfilePhoto(value) {
    return profileAvatars.includes(value) || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
}
